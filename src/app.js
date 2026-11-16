(function () {
  const KEY = "csi-records-v1";
  const $ = s => document.querySelector(s);
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
  form.fecha.valueAsDate = new Date();
  $("#btn-clear").addEventListener("click", () => setTimeout(() => { form.fecha.valueAsDate = new Date(); live(); $("#result").hidden = true; }));

  form.addEventListener("submit", e => {
    e.preventDefault();
    const s = CSI.score(answers());
    const recs = load();
    if (recs.some(r => r.id === form.id.value.trim() && r.fecha === form.fecha.value) &&
        !confirm("Ya existe un registro con ese ID y fecha. ¿Guardar de todos modos?")) return;
    const rec = {
      uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      id: form.id.value.trim(), fecha: form.fecha.value, edad: form.edad.value,
      eva: form.eva.value, endo: form.endo.value, obs: form.obs.value,
      respuestas: answers(), total: s.total, nivel: CSI.level(s.total),
      diagnosticos: CSI.DIAGNOSES.map((n, i) => ({
        nombre: n, si: form.querySelector(`input[name=d${i}]:checked`).value === "Sí", anio: form[`dy${i}`].value }))
    };
    recs.push(rec); save(recs); render();
    const r = $("#result"); r.hidden = false;
    r.innerHTML = `<h2>Registro guardado</h2><p>CSI total: <strong>${rec.total}/100</strong> — ${rec.nivel}.
      ${rec.total >= 40 ? "Supera el punto de corte (≥40) sugestivo de sensibilización central." : "Por debajo del punto de corte (40)."}</p>`;
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

  render(); live();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
