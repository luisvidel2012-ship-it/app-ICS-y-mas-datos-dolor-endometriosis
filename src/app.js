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
  form.fecha.valueAsDate = new Date();
  $("#btn-clear").addEventListener("click", () => setTimeout(() => { form.fecha.valueAsDate = new Date(); live(); $("#result").hidden = true; }));

  form.addEventListener("submit", e => {
    e.preventDefault();
    const s = CSI.score(answers());
    const recs = load();
    if (recs.some(r => r.id === form.id.value.trim() && r.fecha === form.fecha.value) &&
        !confirm("Ya existe un registro con ese ID y fecha. ¿Guardar de todos modos?")) return;
    const rec = {
      clinica: CLINICA, demo: form.demo.checked, consentimiento: { version: CSI_CONSENT.VERSION, fecha: new Date().toISOString(), c1: form.c1.checked, c2: form.c2.checked, c3: form_c3_off ? null : form.c3.checked },
      uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      id: form.id.value.trim(), fecha: form.fecha.value, edad: form.edad.value,
      eva: form.eva.value, endo: form.endo.value, obs: form.obs.value,
      respuestas: answers(), total: s.total, nivel: CSI.level(s.total),
      diagnosticos: CSI.DIAGNOSES.map((n, i) => ({
        nombre: n, si: form.querySelector(`input[name=d${i}]:checked`).value === "Sí", anio: form[`dy${i}`].value }))
    };
    recs.push(rec); save(recs); render();
    flush();
    const r = $("#result"); r.hidden = false;
    r.innerHTML = `<h2>¡Gracias por responder!</h2><p>Su puntaje CSI es <strong>${rec.total} de 100</strong>.
      Este cuestionario es una herramienta de tamizaje y <strong>no es un diagnóstico</strong>.
      ${rec.total >= 40 ? "Su puntaje está en un rango que su médica querrá revisar con usted." : "Su puntaje está por debajo del valor de referencia de 40."}
      Su médica interpretará este resultado junto con el resto de su evaluación.</p>
      <p><button type="button" class="primary" id="open-report">Ver mi informe</button></p>`;
    lastRec = rec; $("#open-report").addEventListener("click", openReport);
    form.reset(); form.fecha.valueAsDate = new Date(); live();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Informe del paciente (se genera en el dispositivo; no se envía nada)
  const LABELS = ["Nunca", "Pocas veces", "Algunas veces", "Continuamente", "Siempre"];
  const e2 = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function reportHTML(r) {
    const rows = CSI.ITEMS.map((t, i) => `<tr><td>${i + 1}</td><td>${e2(t)}</td><td>${LABELS[r.respuestas[i]]} (${r.respuestas[i]})</td></tr>`).join("");
    const dx = r.diagnosticos.filter(d => d.si).map(d => `<li>${e2(d.nombre)}${d.anio ? " — " + e2(d.anio) : ""}</li>`).join("") || "<li>Ninguno indicado</li>";
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
button{font:700 1rem "Nunito Sans",sans-serif;color:#fff;border:0;border-radius:999px;padding:.8rem 1.6rem;cursor:pointer;
  background:linear-gradient(105deg,#5a1c5c 0%,#7e2363 38%,#c43a74 76%,#e2508a 100%);box-shadow:0 10px 24px rgba(122,28,84,.28)}
@media print{button{display:none}body{margin:0}}
</style>
<div class="head"><img src="${U("icons/logo-kc.png")}" alt="Dra. Karina Castillo — Ginecología">
<div class="meta"><strong>Código:</strong> ${e2(r.id)}<br><strong>Fecha:</strong> ${e2(r.fecha)}</div></div>
<h1>Informe — Inventario de<br>Sensibilización Central (CSI)</h1>
<p><strong>Edad:</strong> ${e2(r.edad)}${r.eva !== "" ? " · <strong>Dolor pélvico (0–10):</strong> " + e2(r.eva) : ""}${r.endo ? " · <strong>Endometriosis:</strong> " + e2(r.endo) : ""}</p>
<div class="scorebox"><div class="score">${r.total} <small>de 100</small></div>
<div>El valor de referencia utilizado en la literatura es 40. ${r.total >= 40 ? "Su puntaje lo alcanza o lo supera." : "Su puntaje está por debajo de ese valor."}
Este puntaje es una herramienta de tamizaje: <strong>no es un diagnóstico</strong> y debe ser interpretado por su médica.</div></div>
<h2>Parte A — Sus respuestas</h2>
<table><tr><th>N°</th><th>Enunciado</th><th>Respuesta</th></tr>${rows}</table>
<h2>Parte B — Diagnósticos previos indicados</h2><ul>${dx}</ul>
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

  // Registros
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function render() {
    const recs = load();
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
    const head = ["id", "fecha", "edad", "dolor_pelvico", "endometriosis",
      ...CSI.ITEMS.map((_, i) => "csi_" + (i + 1)), "csi_total", "csi_nivel",
      ...CSI.DIAGNOSES.flatMap((_, i) => ["dx" + (i + 1), "dx" + (i + 1) + "_anio"]), "observaciones"];
    const q = v => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const rows = load().map(r => [r.id, r.fecha, r.edad, r.eva, r.endo, ...r.respuestas, r.total, r.nivel,
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
      fecha: r.fecha, edad: r.edad, dolor_pelvico: r.eva, endometriosis: r.endo };
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
