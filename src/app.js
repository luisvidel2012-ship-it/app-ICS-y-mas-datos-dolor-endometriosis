(function () {
  const KEY = "csi-records-v1";
  const $ = s => document.querySelector(s);
  const CFG = window.CSI_CONFIG || {};
  const params = new URLSearchParams(location.search);
  const STAFF = location.hash === "#staff";          // pestaña de registros solo para el equipo
  const CLINICA = params.get("c") || "";            // viene en el QR: ?c=codigo
  if (STAFF) $("#nav").hidden = false;
  const load = () => JSON.parse(localStorage.getItem(KEY) || "[]");
  const save = r => localStorage.setItem(KEY, JSON.stringify(r));

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
  form.demo.addEventListener("change", () => { $("#demo-banner").hidden = !form.demo.checked; });
  if (params.get("demo") === "1") { form.demo.checked = true; $("#demo-banner").hidden = false; }
  form.fecha.valueAsDate = new Date();
  $("#btn-clear").addEventListener("click", () => setTimeout(() => { form.fecha.valueAsDate = new Date(); live(); $("#result").hidden = true; }));

  form.addEventListener("submit", e => {
    e.preventDefault();
    const s = CSI.score(answers());
    const recs = load();
    if (recs.some(r => r.id === form.id.value.trim() && r.fecha === form.fecha.value) &&
        !confirm("Ya existe un registro con ese ID y fecha. ¿Guardar de todos modos?")) return;
    const rec = {
      clinica: CLINICA, demo: form.demo.checked, consentimiento: true,
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
      ${rec.total >= 40 ? "Su puntaje está en un rango que su equipo de salud querrá revisar con usted." : "Su puntaje está por debajo del valor de referencia de 40."}
      Su equipo tratante interpretará este resultado junto con el resto de su evaluación.</p>`;
    form.reset(); form.fecha.valueAsDate = new Date(); live();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

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
    o.observaciones = r.obs; return o;
  }
  window.addEventListener("online", flush);
  render(); live(); flush();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
