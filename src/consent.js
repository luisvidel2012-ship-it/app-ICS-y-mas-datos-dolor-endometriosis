// Consentimiento informado del piloto. Los campos {{CLAVE}} se completan desde src/config.js.
// Lo no completado se muestra resaltado como [COMPLETAR] para que nunca pase inadvertido.
(function (root) {
  const VERSION = "v0.2-2026-11";
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const DEFAULT_ETICA = "Este estudio <strong>aún no cuenta con evaluación de un Comité Ético Científico</strong>.";

  const TEXT = `
<h3>Consentimiento informado — Inventario de Sensibilización Central (CSI)</h3>
<p class="hint">Versión ${VERSION}. Lea con calma. Puede detenerse en cualquier momento.</p>

<h4>1. ¿De qué se trata?</h4>
<p>Se le invita a participar en un estudio que recoge, mediante una aplicación desarrollada por Karina Castillo, las respuestas al <em>Inventario de Sensibilización Central (CSI)</em>, un cuestionario que explora síntomas que pueden relacionarse con la sensibilización central del dolor en personas con dolor pélvico o endometriosis. El cuestionario es una herramienta de tamizaje: <strong>no entrega un diagnóstico</strong> y no reemplaza la evaluación de su equipo de salud.</p>
<p>Responsable del estudio: {{INSTITUCION}}. Persona responsable: {{RESPONSABLE}}.</p>

<h4>2. ¿Qué se le pide?</h4>
<p>Responder datos básicos (edad, intensidad del dolor pélvico, si tiene diagnóstico de endometriosis), 25 preguntas sobre síntomas y una lista de diagnósticos previos. Toma alrededor de 10 minutos.</p>

<h4>3. ¿Qué datos se recogen?</h4>
<p>Un código de participante, la fecha, su edad, su dolor pélvico (0 a 10), si tiene diagnóstico de endometriosis, sus respuestas al cuestionario, los diagnósticos previos y el año, las observaciones que usted escriba, y la fecha y hora de este consentimiento. Son <strong>datos de salud</strong>, considerados <strong>datos sensibles</strong> por la ley chilena.</p>
<p><strong>No se le pide su nombre, RUT, dirección, teléfono ni correo.</strong> Por favor, no escriba datos que lo identifiquen en el campo de observaciones.</p>

<h4>4. ¿Para qué se usarán?</h4>
<p>Solo para los fines de este estudio, mediante análisis estadísticos agrupados. No se usarán con fines comerciales, ni se venderán ni cederán a terceros.</p>

<!--SERVER--><h4>5. ¿Quién tendrá acceso?</h4>
<p>Solo las personas autorizadas del equipo del proyecto.</p>

<h4>6. ¿Dónde se guardan?</h4>
<p>Sus respuestas se almacenan en una planilla de Google Sheets del proyecto, protegida con una cuenta con verificación en dos pasos. Google puede alojar los datos en servidores ubicados <strong>fuera de Chile</strong> (transferencia internacional de datos). Ningún sistema informático es totalmente invulnerable; por eso le pedimos no ingresar información que permita identificarlo.</p>

<h4>7. ¿Por cuánto tiempo?</h4>
<p>Hasta: {{PLAZO}}. Después, los datos serán eliminados o anonimizados.</p>

<!--/SERVER--><h4>8. Riesgos y beneficios</h4>
<p>Los riesgos son mínimos: puede sentir incomodidad al responder sobre ánimo, sueño o antecedentes personales, y existe un riesgo, que buscamos reducir, de pérdida de confidencialidad de los datos. No hay beneficio directo para usted; su participación contribuye al conocimiento sobre este tema. Si se siente mal, puede detenerse y comunicarse con {{CONTACTO}}. Ante una urgencia, acuda al servicio de urgencia más cercano.</p>

<h4>9. Participación voluntaria y retiro</h4>
<p>Participar es voluntario. Puede negarse o retirarse en cualquier momento, <strong>sin ninguna consecuencia para su atención de salud</strong>. Si desea que se eliminen sus datos, escriba a {{CONTACTO}} indicando su código de participante. Como sus datos no incluyen su nombre, <strong>necesitamos su código para encontrar su registro: anótelo</strong>.</p>

<h4>10. Sus derechos</h4>
<p>Usted puede solicitar acceso a sus datos, su rectificación, su eliminación y oponerse a su tratamiento, y, cuando rija la Ley N° 21.719, también su portabilidad y bloqueo, escribiendo a {{CONTACTO}}.</p>

<h4>11. Evaluación ética y marco legal</h4>
<p>{{ETICA}}</p>
<p>Este documento se redacta considerando las leyes N° 19.628 (protección de la vida privada), N° 20.120 (investigación científica en el ser humano) y N° 20.584 (derechos y deberes de los pacientes), y la Ley N° 21.719 (protección de datos personales) en lo que corresponda.</p>`;

  function html(cfg) {
    cfg = cfg || {};
    const t = cfg.SHEETS_URL ? TEXT : TEXT.replace(/<!--SERVER-->[\s\S]*?<!--\/SERVER-->/, '<h4>5. ¿Quién tendrá acceso?</h4>\n<p>Nadie más que usted. Sus respuestas se procesan en su propio dispositivo y <strong>no se envían a ningún servidor</strong> ni al equipo del proyecto.</p>\n\n<h4>6. ¿Dónde se guardan?</h4>\n<p>Únicamente en la memoria de su navegador, en este dispositivo. Usted puede generar un informe para guardarlo o imprimirlo. Si usa un dispositivo compartido, borre los datos del navegador al terminar.</p>\n\n<h4>7. ¿Por cuánto tiempo?</h4>\n<p>Hasta que usted los borre del navegador.</p>\n\n');
    return t.replace(/\{\{(\w+)\}\}/g, (_, k) => {
      const v = (cfg[k] || "").toString().trim();
      if (v) return k === "ETICA" ? v : esc(v);
      if (k === "ETICA") return DEFAULT_ETICA;
      return '<mark class="todo">[COMPLETAR: ' + k + "]</mark>";
    });
  }
  root.CSI_CONSENT = { VERSION, html };
})(typeof self !== "undefined" ? self : this);
