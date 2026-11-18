// Genera en el dispositivo un PDF con todo el formulario, las respuestas y la puntuación.
// No usa servidores: las librerías (vendor/) y las fuentes se cargan desde la propia app solo al pedir el PDF.
(function (root) {
  const C = {
    ciruela: [56, 16, 72], texto: [64, 16, 72], suave: [110, 74, 108],
    rosa: [210, 60, 114], profundo: [174, 42, 96], vino: [152, 8, 72],
    fondo: [252, 228, 236], fondo2: [250, 206, 223], borde: [242, 207, 223], cabecera: [251, 230, 239]
  };
  const LABELS = ["Nunca", "Pocas veces", "Algunas veces", "Continuamente", "Siempre"];
  const M = 16, W = 210, H = 297, CW = W - 2 * M;   // márgenes y ancho útil (mm)

  let loading = null;
  function loadScript(src) {
    return new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = () => fail(new Error("No se pudo cargar " + src));
      document.head.appendChild(s);
    });
  }
  function ensureLibs() {
    if (root.jspdf && root.jspdf.jsPDF && root.CSI_PDF_FONTS && root.jspdf.jsPDF.API.autoTable) return Promise.resolve();
    if (!loading) loading = loadScript("vendor/jspdf.umd.min.js")
      .then(() => Promise.all([loadScript("vendor/jspdf.plugin.autotable.min.js"), loadScript("vendor/pdf-fonts.js")]))
      .catch(e => { loading = null; throw e; });
    return loading;
  }
  function imageData(src) {
    return fetch(src).then(r => r.blob()).then(b => new Promise(ok => {
      const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(b);
    }));
  }
  const fechaCL = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? `${m[3]}-${m[2]}-${m[1]}` : (iso || "—"); };
  const val = v => (v === undefined || v === null || String(v).trim() === "") ? "—" : String(v);

  async function build(r, opts) {
    await ensureLibs();
    const { jsPDF } = root.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const F = root.CSI_PDF_FONTS;
    doc.addFileToVFS("DMSerif.ttf", F.DMSerif); doc.addFont("DMSerif.ttf", "DMSerif", "normal");
    doc.addFileToVFS("Nunito.ttf", F.Nunito); doc.addFont("Nunito.ttf", "Nunito", "normal");
    doc.addFileToVFS("NunitoBold.ttf", F.NunitoBold); doc.addFont("NunitoBold.ttf", "Nunito", "bold");
    doc.setProperties({ title: "Informe CSI " + r.id, subject: "Inventario de Sensibilización Central", author: "Dra. Karina Castillo", creator: "App CSI" });

    const font = (f, s, c) => { doc.setFont(f === "serif" ? "DMSerif" : "Nunito", f === "bold" ? "bold" : "normal"); doc.setFontSize(s); doc.setTextColor(...(c || C.texto)); };
    // Texto con tramos en negrita en una misma línea: [["Edad: ", true], ["34", false], ...]
    const runs = (parts, x, y, size) => {
      for (const [t, b] of parts) { font(b ? "bold" : "sans", size, b ? C.ciruela : C.texto); doc.text(t, x, y); x += doc.getTextWidth(t); }
    };
    const heading = (t, y) => { font("serif", 14, C.ciruela); doc.text(t, M, y); return y + 3; };
    const ensureSpace = (y, need) => { if (y + need > H - 22) { doc.addPage(); return 22; } return y; };

    // Encabezado: logo, código y fecha
    try { doc.addImage(await imageData(opts.logo), "PNG", M, 13, 60, 60 * 133 / 536); } catch (e) { font("serif", 16, C.ciruela); doc.text("Dra. Karina Castillo", M, 22); }
    font("bold", 9.5, C.ciruela); doc.text("Código: " + r.id, W - M, 19, { align: "right" });
    font("sans", 9.5, C.suave); doc.text("Fecha: " + fechaCL(r.fecha), W - M, 24.5, { align: "right" });
    doc.setDrawColor(...C.borde); doc.setLineWidth(0.6); doc.line(M, 33, W - M, 33);

    // Título
    font("serif", 21, C.ciruela);
    doc.text("Informe — Inventario de", M, 45); doc.text("Sensibilización Central (CSI)", M, 53.5);
    let y = 62;
    runs([["Edad: ", true], [val(r.edad) + " años", false], ["   ·   Dolor pélvico promedio (0–10): ", true], [val(r.eva), false],
          ["   ·   Endometriosis: ", true], [val(r.endo), false]], M, y, 10);

    // Cuadro de puntuación
    y += 6;
    doc.setFillColor(...C.fondo); doc.setDrawColor(...C.borde); doc.setLineWidth(0.3);
    doc.roundedRect(M, y, CW, 31, 4, 4, "FD");
    font("serif", 38, C.profundo); doc.text(String(r.total), M + 21, y + 18, { align: "center" });
    font("sans", 9.5, C.suave); doc.text("de 100", M + 21, y + 25, { align: "center" });
    const msg = "El valor de referencia utilizado en la literatura es 40. " +
      (r.total >= 40 ? "Este puntaje lo alcanza o lo supera. " : "Este puntaje está por debajo de ese valor. ") +
      "El CSI es una herramienta de tamizaje: no es un diagnóstico y debe ser interpretado por su médica.";
    font("sans", 10, C.texto); doc.text(doc.splitTextToSize(msg, CW - 48), M + 42, y + 9.5, { lineHeightFactor: 1.35 });
    y += 41;

    const table = (o) => doc.autoTable(Object.assign({
      margin: { left: M, right: M, top: 22, bottom: 24 }, theme: "plain",
      styles: { font: "Nunito", fontSize: 9.2, textColor: C.texto, cellPadding: { top: 1.9, bottom: 1.9, left: 2.2, right: 2.2 },
        lineColor: C.borde, lineWidth: { bottom: 0.25 }, valign: "middle" },
      headStyles: { font: "Nunito", fontStyle: "bold", fillColor: C.cabecera, textColor: C.ciruela },
      footStyles: { font: "Nunito", fontStyle: "bold", fillColor: C.fondo, textColor: C.ciruela }
    }, o));

    // Parte A
    y = heading("Parte A — Respuestas", y);
    table({
      startY: y,
      head: [["N°", "Enunciado", "Respuesta"]],
      body: opts.items.map((t, i) => [String(i + 1), t, `${LABELS[r.respuestas[i]]} (${r.respuestas[i]})`]),
      foot: [["", "Puntaje total", `${r.total} / 100`]], showFoot: "lastPage",
      columnStyles: { 0: { cellWidth: 10, halign: "center", textColor: C.suave }, 2: { cellWidth: 40, fontStyle: "bold", textColor: C.vino } },
      didParseCell: d => {
        if (d.section !== "body" && d.column.index === 2) d.cell.styles.textColor = C.profundo;
        if (d.section === "head" && d.column.index === 0) d.cell.styles.halign = "center";
      }
    });
    y = doc.lastAutoTable.finalY + 9;

    // Parte B (lista completa)
    y = ensureSpace(y, 30);
    y = heading("Parte B — Diagnósticos previos", y);
    table({
      startY: y,
      head: [["Diagnóstico", "Respuesta", "Año"]],
      body: r.diagnosticos.map(d => [d.nombre, d.si ? "Sí" : "No", d.si ? val(d.anio) : "—"]),
      columnStyles: { 1: { cellWidth: 24, halign: "center" }, 2: { cellWidth: 22, halign: "center" } },
      didParseCell: d => {
        if (d.section === "head" && d.column.index > 0) d.cell.styles.halign = "center";
        if (d.section === "body" && d.column.index === 1 && d.cell.raw === "Sí") { d.cell.styles.fontStyle = "bold"; d.cell.styles.textColor = C.vino; }
      }
    });
    y = doc.lastAutoTable.finalY + 9;

    // Observaciones
    font("sans", 10, C.texto);
    const obs = doc.splitTextToSize(val(r.obs), CW);
    y = ensureSpace(y, 14 + obs.length * 5);
    y = heading("Observaciones", y) + 3;
    font("sans", 10, C.texto); doc.text(obs, M, y, { lineHeightFactor: 1.35 }); y += obs.length * 4.8 + 7;

    // Consentimiento
    const c = r.consentimiento || {};
    const acepto = [opts.consentTexts[0], opts.consentTexts[1]].concat(c.c3 ? [opts.consentTexts[2]] : []);
    const cuando = c.fecha ? new Date(c.fecha).toLocaleString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
    font("sans", 9.5, C.texto);
    const lines = acepto.map(t => doc.splitTextToSize("•  " + t, CW - 4));
    y = ensureSpace(y, 16 + lines.flat().length * 4.8);
    y = heading("Consentimiento informado", y) + 3;
    font("sans", 9.5, C.suave); doc.text(`Aceptado el ${cuando} · versión ${val(c.version)}`, M, y); y += 6;
    font("sans", 9.5, C.texto);
    for (const l of lines) { doc.text(l, M + 1, y, { lineHeightFactor: 1.35 }); y += l.length * 4.6 + 1.4; }

    // Pie en todas las páginas
    const n = doc.getNumberOfPages();
    for (let p = 1; p <= n; p++) {
      doc.setPage(p);
      doc.setDrawColor(...C.borde); doc.setLineWidth(0.3); doc.line(M, H - 17, W - M, H - 17);
      font("sans", 7.2, C.suave);
      doc.text(doc.splitTextToSize("Aplicación desarrollada por la Dra. Karina Castillo. Instrumento: Central Sensitization Inventory (Mayer et al., 2012); " +
        "versión en español: Cuesta-Vargas et al., SpringerPlus 2016;5:1837, doi:10.1186/s40064-016-3515-4 (CC BY 4.0). " +
        "Documento generado en el dispositivo del paciente.", CW - 22), M, H - 12.5, { lineHeightFactor: 1.3 });
      font("bold", 7.5, C.ciruela); doc.text(`Página ${p} de ${n}`, W - M, H - 12.5, { align: "right" });
    }
    return doc;
  }

  function fileName(r) {
    const safe = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    const id = safe(r.id) || "paciente";
    return `Informe-${/^CSI-/.test(id) ? "" : "CSI-"}${id}-${safe(r.fecha)}.pdf`;
  }

  root.CSI_PDF = { build, fileName, ensureLibs };
})(typeof self !== "undefined" ? self : this);
