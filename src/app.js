(function () {
  let form_c3_off = false;
  const KEY = "csi-records-v1";
  const $ = s => document.querySelector(s);
  const CFG = window.CSI_CONFIG || {};
  const params = new URLSearchParams(location.search);
  const STAFF = location.hash === "#staff";          // pestaña de registros solo para el equipo
  const CLINICA = params.get("c") || "";            // viene en el QR: ?c=codigo
  if (STAFF) { $("#nav").hidden = false; document.querySelector("label.demo").hidden = false; }
  const load = () => JSON.parse(localStorage.getItem(KEY) || "[]");
  const save = r => localStorage.setItem(KEY, JSON.stringify(r));

  // Consentimiento
  const REMOTE = !!CFG.SHEETS_URL;                    // sin URL configurada: todo queda en el dispositivo
  if (!REMOTE) { $("#c3-label").hidden = true; form_c3_off = true; $("[name=c3]").required = false; }
  $("#consent-text").innerHTML = CSI_CONSENT.html(CFG);
  $("#print-consent").addEventListener("click", () => {
    const w = window.open("", "_blank");
    if (!w) return alert("Permita las ventanas emergentes para imprimir.");
    w.document.write("<!DOCTYPE html><meta charset=utf-8><title>Consentimiento informado</title><body style='font-family:sans-serif;max-width:700px;margin:auto;color:#401048'><h2>Consentimiento informado</h2>" + CSI_CONSENT.html(CFG) + "</body>");
    w.document.close(); w.focus(); w.print();
  });

  // Render del formulario
  $("#items").innerHTML = CSI.ITEMS.map((t, i) => `
    <div class="item"><span class="q">${i + 1}. ${t}</span>
      <span class="opts">${[0,1,2,3,4].map(v =>
        `<label><input type="radio" name="q${i}" value="${v}" required><span>${v}</span></label>`).join("")}</span></div>`).join("");
  $("#diagnoses").innerHTML = CSI.DIAGNOSES.map((t, i) => `
    <div class="diag"><span>${t}</span>
      <label><input type="radio" name="d${i}" value="No" checked> No</label>
      <label><input type="radio" name="d${i}" value="Sí"> Sí</label>
      <input type="number" name="dy${i}" placeholder="Año" min="1900" max="2100" class="year"></div>`).join("");

  const form = $("#csi-form");
  const answers = () => CSI.ITEMS.map((_, i) => { const c = form.querySelector(`input[name=q${i}]:checked`); return c ? +c.value : null; });
  function live() {
    const s = CSI.score(answers());
    $("#live-score").textContent = s.total; $("#live-answered").textContent = s.answered;
  }
  form.addEventListener("change", live);
  const showBanner = () => { $("#demo-banner").hidden = !(STAFF && form.demo.checked); };
  form.demo.addEventListener("change", showBanner);
  if (params.get("demo") === "1") { form.demo.checked = true; showBanner(); }  // marca silenciosa: el paciente no ve nada
  // Fecha y hora las fija el sistema al guardar (hora local del dispositivo); el paciente no las ingresa
  const pad = n => String(n).padStart(2, "0");
  const ahora = () => { const d = new Date(); return { fecha: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, hora: `${pad(d.getHours())}:${pad(d.getMinutes())}` }; };
  const fechaCL = iso => iso ? iso.split("-").reverse().join("-") : "";
  $("#btn-clear").addEventListener("click", () => setTimeout(() => { live(); $("#result").hidden = true; clearErrors(); }));

  // Código al azar: identifica el informe sin datos personales (sin 0/O ni 1/I/L para evitar confusiones)
  function newCode() {
    const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", n = new Uint32Array(6);
    crypto.getRandomValues(n);
    const s = Array.from(n, v => abc[v % abc.length]).join("");
    return "CSI-" + s.slice(0, 3) + "-" + s.slice(3);
  }

  // Termómetro del puntaje (anchos proporcionales a cada rango)
  const BAND_W = [30, 10, 10, 10, 41];
  function gaugeHTML(total) {
    const b = CSI.band(total), pos = Math.min(98, Math.max(2, total));
    return `<div class="gauge" role="img" aria-label="Puntaje ${total} de 100, nivel ${b.label}">
      <div class="gauge-bar">${CSI.BANDS.map((x, i) => `<span class="seg s${i}" style="flex:${BAND_W[i]}"></span>`).join("")}
        <span class="marker" style="left:${pos}%"><b>${total}</b></span></div>
      <div class="gauge-ticks"><span style="left:0">0</span><span style="left:30%">30</span><span style="left:40%">40</span><span style="left:50%">50</span><span style="left:60%">60</span><span style="left:100%">100</span></div>
      <div class="gauge-legend">${CSI.BANDS.map((x, i) => `<span class="chip s${i}${i === b.index ? " on" : ""}">${x.label} <small>${x.range}</small></span>`).join("")}</div>
      <p class="gauge-now">Nivel: <strong>${b.label}</strong> <small>(${b.tech}; Neblett et al., 2017)</small></p></div>`;
  }
  // "Agendar evaluación": abre WhatsApp con un mensaje de texto listo; no se adjunta ni se envía nada automáticamente
  const WA_URL = CFG.TELEFONO ? `https://wa.me/${String(CFG.TELEFONO).replace(/\D/g, "")}?text=${encodeURIComponent(CFG.WHATSAPP_TEXTO || "")}` : "";
  const WA_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"/></svg>';

  // Validación con mensajes claros (los botones 0–4 son radios ocultos: el aviso nativo del navegador no se ve)
  const errBox = $("#form-error");
  function clearErrors() { form.querySelectorAll(".missing").forEach(el => el.classList.remove("missing")); errBox.hidden = true; }
  function firstProblem() {
    const box = n => form[n].closest("label");
    for (const n of ["c1", "c2", "c3"]) if (form[n].required && !form[n].checked)
      return { el: box(n), msg: "Para continuar, marque las casillas del consentimiento informado (al inicio)." };
    const edad = Number(form.edad.value);
    if (!form.edad.value || !Number.isInteger(edad) || edad < 18 || edad > 120) return { el: form.edad, msg: "Ingrese su edad. Este cuestionario es solo para mayores de 18 años." };
    if (form.eva.value !== "" && !(Number(form.eva.value) >= 0 && Number(form.eva.value) <= 10)) return { el: form.eva, msg: "El dolor pélvico debe ser un número de 0 a 10." };
    const faltan = answers().map((v, i) => v === null ? i : -1).filter(i => i >= 0);
    if (faltan.length) {
      faltan.forEach(i => form.querySelector(`input[name=q${i}]`).closest(".item").classList.add("missing"));
      const n = faltan.length;
      return { el: form.querySelector(`input[name=q${faltan[0]}]`).closest(".item"),
        msg: n === 1 ? `Falta responder la pregunta ${faltan[0] + 1}.` : `Faltan ${n} preguntas por responder (primera: la ${faltan[0] + 1}). Están marcadas en color.` };
    }
    for (let i = 0; i < CSI.DIAGNOSES.length; i++) {
      const y = form[`dy${i}`]; if (y.value && !(Number(y.value) >= 1900 && Number(y.value) <= new Date().getFullYear()))
        return { el: y, msg: `Revise el año de diagnóstico de: ${CSI.DIAGNOSES[i]}.` };
    }
    return null;
  }
  form.addEventListener("change", e => {   // al corregir, quitar la marca
    for (const sel of [".item", "label", ".diag"]) { const it = e.target.closest(sel); if (it) it.classList.remove("missing"); }
    if (e.target.classList) e.target.classList.remove("missing");
    if (!errBox.hidden && !form.querySelector(".missing")) errBox.hidden = true;
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    clearErrors();
    const prob = firstProblem();
    if (prob) {
      prob.el.classList.add("missing");
      errBox.textContent = prob.msg; errBox.hidden = false;
      prob.el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const s = CSI.score(answers());
    const recs = load();
    const t = ahora();
    const rec = {
      clinica: CLINICA, demo: form.demo.checked, consentimiento: { version: CSI_CONSENT.VERSION, fecha: new Date().toISOString(), c1: form.c1.checked, c2: form.c2.checked, c3: form_c3_off ? null : form.c3.checked },
      uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      id: newCode(), fecha: t.fecha, hora: t.hora, edad: form.edad.value,
      eva: form.eva.value, endo: form.endo.value, obs: form.obs.value,
      respuestas: answers(), total: s.total, nivel: CSI.level(s.total),
      diagnosticos: CSI.DIAGNOSES.map((n, i) => ({
        nombre: n, si: form.querySelector(`input[name=d${i}]:checked`).value === "Sí", anio: form[`dy${i}`].value }))
    };
    recs.push(rec); save(recs); render();
    flush();
    const r = $("#result"); r.hidden = false;
    const b = CSI.band(rec.total);
    r.innerHTML = `<h2>¡Gracias por responder!</h2><p class="code-line">Código de su informe: <strong>${rec.id}</strong><br>Fecha: <strong>${fechaCL(rec.fecha)} · ${rec.hora}</strong></p>
      <p class="score-line">Su puntaje CSI es <strong>${rec.total} de 100</strong></p>
      ${gaugeHTML(rec.total)}
      <p class="band-text">${b.text} <strong>Este resultado no es un diagnóstico.</strong></p>
      <h3 class="r-h">¿Qué es la sensibilización central?</h3>
      <p>${CSI.EXPLAIN}</p>
      <h3 class="r-h">Qué puede hacer ahora</h3>
      <ul class="r-actions">${CSI.ACTIONS.map(t => `<li>${t}</li>`).join("")}</ul>
      <p class="report-step">Guarde o comparta su informe con todas sus respuestas y su puntaje:</p>
      <p class="report-actions">${CAN_SHARE ? '<button type="button" class="primary" id="share-pdf">Compartir mi informe</button>' : ""}
      <button type="button" class="${CAN_SHARE ? "" : "primary"}" id="download-pdf">Descargar PDF</button>
      <button type="button" class="link" id="open-report">Ver en pantalla</button></p>
      ${CAN_SHARE ? '<p class="hint share-hint">Podrá enviarlo por WhatsApp, correo u otra aplicación. Usted elige a quién.</p>' : ""}
      <p class="hint pdf-status" id="pdf-status" role="status"></p>
      ${WA_URL ? `<div class="agenda"><p class="agenda-t">¿Desea una evaluación con la Dra. Karina Castillo?</p>
        <a class="wa-btn" href="${WA_URL}" target="_blank" rel="noopener">${WA_ICON}<span>Agendar evaluación</span></a>
        <p class="hint">Se abrirá WhatsApp con un mensaje listo para enviar. Solo se envía el texto, no sus respuestas.</p></div>` : ""}
      <p class="report-new"><button type="button" class="link" id="new-form">Responder un nuevo cuestionario</button></p>`;
    lastRec = rec; $("#open-report").addEventListener("click", openReport); $("#download-pdf").addEventListener("click", downloadPDF);
    if (CAN_SHARE) $("#share-pdf").addEventListener("click", sharePDF);
    preparePDF(rec);                                      // listo antes de que el paciente toque "Compartir"
    $("#new-form").addEventListener("click", () => {
      r.hidden = true; form.hidden = false; window.scrollTo({ top: 0, behavior: "smooth" });
    });
    form.reset(); live();
    form.hidden = true;                                   // el resultado queda solo y arriba, a la vista
    r.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Informe del paciente (se genera en el dispositivo; no se envía nada)
  const LABELS = ["Nunca", "Pocas veces", "Algunas veces", "Continuamente", "Siempre"];
  const e2 = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function reportHTML(r) {
    const rows = CSI.ITEMS.map((t, i) => `<tr><td>${i + 1}</td><td>${e2(t)}</td><td>${LABELS[r.respuestas[i]]} (${r.respuestas[i]})</td></tr>`).join("");
    const dx = r.diagnosticos.map(d => `<tr><td>${e2(d.nombre)}</td><td>${d.si ? "Sí" : "No"}</td><td>${d.si && d.anio ? e2(d.anio) : "—"}</td></tr>`).join("");
    const U = p => new URL(p, location.href).href;   // rutas absolutas: el informe se abre en otra ventana
    return `<!DOCTYPE html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Informe CSI ${e2(r.id)}</title>
<style>
@font-face{font-family:"DM Serif Display";src:url(${U("fonts/dm-serif-display-400.woff2")}) format("woff2")}
@font-face{font-family:"Nunito Sans";font-weight:400;src:url(${U("fonts/nunito-sans-400.woff2")}) format("woff2")}
@font-face{font-family:"Nunito Sans";font-weight:700;src:url(${U("fonts/nunito-sans-700.woff2")}) format("woff2")}
@page{size:A4;margin:14mm}
*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:"Nunito Sans",system-ui,sans-serif;max-width:760px;margin:1.2rem auto;padding:0 1rem;color:#401048;line-height:1.4}
.head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:.6rem 1rem;border-bottom:2px solid #f2cfdf;padding-bottom:.8rem;margin-bottom:1rem}
.head img{width:230px;height:auto}
.head .meta{text-align:right;font-size:.85rem;color:#6e4a6c;white-space:nowrap}
h1{font-family:"DM Serif Display",Georgia,serif;font-weight:400;color:#381048;font-size:1.75rem;line-height:1.05;letter-spacing:-.02em;margin:0 0 .2rem}
h2{font-family:"DM Serif Display",Georgia,serif;font-weight:400;color:#381048;font-size:1.2rem;margin:1.2rem 0 .5rem}
.scorebox{display:flex;align-items:center;gap:1.2rem;background:linear-gradient(180deg,#fce4ec,#facedf);border-radius:18px;padding:1rem 1.2rem;margin:1rem 0}
.score{font-family:"DM Serif Display",Georgia,serif;font-size:3.2rem;line-height:1;color:#ae2a60;text-align:center;flex:none;min-width:5.5rem}
.score small{display:block;margin-top:.25rem;font-family:"Nunito Sans",sans-serif;font-size:.9rem;color:#6e4a6c}
table{border-collapse:collapse;width:100%;font-size:.86rem}td,th{border-bottom:1px solid #f4dbe6;padding:.38rem .5rem;text-align:left}
th{background:#fbe6ef;color:#381048}td:last-child{white-space:nowrap;color:#980848;font-weight:700}
ul{margin:.2rem 0}.note{color:#6e4a6c;font-size:.78rem}
h3{font-size:1rem;color:#381048;margin:.8rem 0 .2rem}.ans{color:#980848;white-space:nowrap}.lv small{color:#6e4a6c}a{color:#d23c72;font-weight:700}
button{font:700 1rem "Nunito Sans",sans-serif;color:#fff;border:0;border-radius:999px;padding:.8rem 1.6rem;cursor:pointer;
  background:linear-gradient(105deg,#5a1c5c 0%,#7e2363 38%,#c43a74 76%,#e2508a 100%);box-shadow:0 10px 24px rgba(122,28,84,.28)}
@media print{button{display:none}body{margin:0}}
</style>
<div class="head"><img src="${U("icons/logo-kc.png")}" alt="Dra. Karina Castillo — Ginecología">
<div class="meta"><strong>Código:</strong> ${e2(r.id)}<br><strong>Fecha:</strong> ${e2(fechaCL(r.fecha))}${r.hora ? " · " + e2(r.hora) : ""}</div></div>
<h1>Informe — Inventario de<br>Sensibilización Central (CSI)</h1>
<p><strong>Edad:</strong> ${e2(r.edad)}${r.eva !== "" ? " · <strong>Dolor pélvico (0–10):</strong> " + e2(r.eva) : ""}${r.endo ? " · <strong>Endometriosis:</strong> " + e2(r.endo) : ""}</p>
<div class="scorebox"><div class="score">${r.total} <small>de 100</small></div>
<div>El valor de referencia utilizado en la literatura es 40. ${r.total >= 40 ? "Su puntaje lo alcanza o lo supera." : "Su puntaje está por debajo de ese valor."}
Este puntaje es una herramienta de tamizaje: <strong>no es un diagnóstico</strong> y debe ser interpretado por su médica.</div></div>
${(() => { const b = CSI.band(r.total), fq = CSI.frequent(r.respuestas); return `
<h2>¿Qué significa su puntaje?</h2>
<p class="lv">Nivel: <strong>${b.label}</strong> <small>(${b.tech}; Neblett et al., 2017) · Bajo 0–29 · Leve 30–39 · Moderado 40–49 · Alto 50–59 · Muy alto 60–100</small></p>
<p>${b.text} <strong>Este resultado no es un diagnóstico.</strong></p>
<h3>¿Qué es la sensibilización central?</h3><p>${CSI.EXPLAIN}</p>
<h2>Sus síntomas más frecuentes</h2>
${fq.length ? fq.map(g => `<h3>${g.name}</h3><ul>${g.items.map(i => `<li>${e2(i.text)} <strong class="ans">${LABELS[i.v]} (${i.v})</strong></li>`).join("")}</ul>`).join("") : "<p>No marcó ningún síntoma como «Continuamente» o «Siempre».</p>"}
<p class="note">Agrupación descriptiva: el CSI se interpreta con el puntaje total.</p>
<h2>Qué puede hacer ahora</h2><ul>${CSI.ACTIONS.map(t => `<li>${t}</li>`).join("")}</ul>
${WA_URL ? `<p><strong>Agendar evaluación:</strong> <a href="${WA_URL}" target="_blank" rel="noopener">Dra. Karina Castillo · WhatsApp ${CFG.TELEFONO}</a></p>` : ""}`; })()}
<h2>Parte A — Sus respuestas</h2>
<table><tr><th>N°</th><th>Enunciado</th><th>Respuesta</th></tr>${rows}</table>
<h2>Parte B — Diagnósticos previos</h2><table><tr><th>Diagnóstico</th><th>Respuesta</th><th>Año</th></tr>${dx}</table>
<h2>Observaciones</h2><p>${r.obs ? e2(r.obs) : "—"}</p>
<p class="note">Consentimiento aceptado: versión ${e2(r.consentimiento.version)}, ${e2(r.consentimiento.fecha)}.
Este informe se generó en su dispositivo${REMOTE ? "; sus respuestas fueron además enviadas a su equipo de salud según el consentimiento que usted aceptó" : " y no se envió a ningún servidor"}.</p>
<p class="note">Aplicación desarrollada por la Dra. Karina Castillo. Instrumento: Central Sensitization Inventory (Mayer et al., 2012). Versión en español: Cuesta-Vargas AI, Roldán-Jiménez C, Neblett R, Gatchel RJ. SpringerPlus 2016;5:1837, doi:10.1186/s40064-016-3515-4 (CC BY 4.0).</p>
<p><button onclick="window.print()">Imprimir o guardar como PDF</button></p>`;
  }
  let lastRec = null;
  function openReport() {
    if (!lastRec) return;
    const w = window.open("", "_blank");
    if (!w) return alert("Permita las ventanas emergentes para ver el informe.");
    w.document.write(reportHTML(lastRec)); w.document.close();
  }

  // PDF completo generado en el dispositivo
  const consentTexts = () => ["c1", "c2", "c3"].map(n => $(`[name=${n}]`).parentElement.textContent.trim());
  // Se genera una sola vez por resultado y se reutiliza para descargar y compartir
  const CAN_SHARE = (() => {
    try { return !!(navigator.canShare && navigator.share && navigator.canShare({ files: [new File(["%PDF"], "x.pdf", { type: "application/pdf" })] })); }
    catch (e) { return false; }
  })();
  let pdfJob = null;
  function preparePDF(rec) {
    const name = CSI_PDF.fileName(rec);
    pdfJob = CSI_PDF.build(rec, { logo: "icons/logo-kc.png", items: CSI.ITEMS, consentTexts: consentTexts(), agenda: WA_URL ? { url: WA_URL, label: `Dra. Karina Castillo · WhatsApp ${CFG.TELEFONO}` } : null })
      .then(doc => new File([doc.output("blob")], name, { type: "application/pdf" }));
    pdfJob.catch(() => {});                                // el error se informa al usarlo
    return pdfJob;
  }
  const status = msg => { const s = $("#pdf-status"); if (s) s.textContent = msg || ""; };
  async function withButton(id, busyText, fn) {
    const btn = $(id), txt = btn.textContent;
    btn.disabled = true; btn.textContent = busyText;
    try { await fn(); } finally { btn.disabled = false; btn.textContent = txt; }
  }
  function downloadPDF() {
    if (!lastRec) return;
    return withButton("#download-pdf", "Preparando PDF…", async () => {
      try {
        const file = await (pdfJob || preparePDF(lastRec));
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file); a.download = file.name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 60000);
        status("");
      } catch (e) {
        pdfJob = null;
        alert("No se pudo generar el PDF. Se abrirá el informe en pantalla para que lo imprima o guarde.");
        openReport();
      }
    });
  }
  function sharePDF() {
    if (!lastRec) return;
    return withButton("#share-pdf", "Abriendo…", async () => {
      let file;
      try { file = await (pdfJob || preparePDF(lastRec)); }
      catch (e) { pdfJob = null; status("No se pudo preparar el PDF. Use “Descargar PDF” o “Ver en pantalla”."); return; }
      try {
        await navigator.share({ files: [file], title: "Informe CSI " + lastRec.id, text: "Informe del Inventario de Sensibilización Central (CSI)." });
        status("");
      } catch (e) {
        if (e && e.name === "AbortError") return;          // la persona cerró el menú: no es un error
        status(e && e.name === "NotAllowedError"
          ? "Su teléfono pidió confirmar. Toque “Compartir mi informe” otra vez."
          : "No se pudo abrir el menú para compartir. Use “Descargar PDF” y luego compártalo desde su teléfono.");
      }
    });
  }

  // Registros
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function render() {
    const recs = load();
    const t = ahora();
    $("#count").textContent = recs.length;
    $("#empty").hidden = recs.length > 0;
    $("#records-table tbody").innerHTML = recs.map(r => `<tr><td>${esc(r.id)}</td><td>${esc(r.fecha)}</td>
      <td>${esc(r.edad)}</td><td>${esc(r.eva)}</td><td><strong>${r.total}</strong></td><td>${esc(r.nivel)}</td>
      <td><button data-del="${r.uid}" title="Eliminar">✕</button></td></tr>`).join("");
  }
  $("#records-table").addEventListener("click", e => {
    const id = e.target.dataset.del;
    if (id && confirm("¿Eliminar este registro?")) { save(load().filter(r => r.uid !== id)); render(); }
  });

  document.querySelectorAll("nav button").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll("nav button").forEach(x => x.classList.toggle("active", x === b));
    $("#tab-form").hidden = b.dataset.tab !== "form"; $("#tab-records").hidden = b.dataset.tab !== "records";
  }));

  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  $("#export-csv").addEventListener("click", () => {
    const head = ["id", "fecha", "hora", "edad", "dolor_pelvico", "endometriosis",
      ...CSI.ITEMS.map((_, i) => "csi_" + (i + 1)), "csi_total", "csi_nivel",
      ...CSI.DIAGNOSES.flatMap((_, i) => ["dx" + (i + 1), "dx" + (i + 1) + "_anio"]), "observaciones"];
    const q = v => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const rows = load().map(r => [r.id, r.fecha, r.hora, r.edad, r.eva, r.endo, ...r.respuestas, r.total, r.nivel,
      ...r.diagnosticos.flatMap(d => [d.si ? 1 : 0, d.anio]), r.obs].map(q).join(","));
    download("csi_registros.csv", "﻿" + [head.join(","), ...rows].join("\n"), "text/csv;charset=utf-8");
  });
  $("#export-json").addEventListener("click", () => download("csi_respaldo.json", JSON.stringify(load(), null, 2), "application/json"));
  $("#import-json").addEventListener("change", async e => {
    try {
      const incoming = JSON.parse(await e.target.files[0].text());
      if (!Array.isArray(incoming)) throw 0;
      const cur = load(), have = new Set(cur.map(r => r.uid));
      save(cur.concat(incoming.filter(r => r && r.uid && !have.has(r.uid)))); render();
    } catch { alert("Archivo no válido."); }
    e.target.value = "";
  });

  // Envío a Google Sheets con cola de reintento (si no hay internet queda pendiente)
  async function flush() {
    if (!CFG.SHEETS_URL) return;
    let recs = load();
    for (const r of recs.filter(x => !x.enviado)) {
      try {
        const res = await fetch(CFG.SHEETS_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ token: CFG.TOKEN, record: flat(r) }) });
        const j = await res.json();
        if (j.ok) { recs = load(); const t = recs.find(x => x.uid === r.uid); if (t) { t.enviado = true; save(recs); } }
      } catch { break; }
    }
    // Con envío configurado, no se conservan copias de respuestas ya enviadas en el dispositivo
    if (!STAFF) save(load().filter(x => !x.enviado));
    render();
  }
  function flat(r) {
    const o = { uid: r.uid, recibido: new Date().toISOString(), id: r.id, clinica: r.clinica, demo: r.demo ? "sí" : "no",
      fecha: r.fecha, hora: r.hora, edad: r.edad, dolor_pelvico: r.eva, endometriosis: r.endo };
    CSI.ITEMS.forEach((_, i) => o["csi_" + (i + 1)] = r.respuestas[i]);
    o.csi_total = r.total; o.csi_nivel = r.nivel;
    r.diagnosticos.forEach((d, i) => { o["dx" + (i + 1)] = d.si ? 1 : 0; o["dx" + (i + 1) + "_anio"] = d.anio; });
    o.observaciones = r.obs;
    o.consentimiento_version = r.consentimiento && r.consentimiento.version;
    o.consentimiento_fecha = r.consentimiento && r.consentimiento.fecha;
    return o;
  }
  window.addEventListener("online", flush);
  render(); live(); flush();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
