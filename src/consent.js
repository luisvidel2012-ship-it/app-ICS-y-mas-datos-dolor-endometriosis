// Consentimiento informado (uso clínico). Los campos {{CLAVE}} se completan desde src/config.js.
// El texto cambia según la app guarde solo en el dispositivo (sin SHEETS_URL) o envíe al equipo de salud.
(function (root) {
  const VERSION = "v0.3-2026-11";
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const DESTINO_LOCAL = `<p>Sus respuestas se procesan y guardan <strong>solo en este dispositivo</strong>; no se envían a ningún servidor. Al terminar podrá ver un informe con su resultado para guardarlo o mostrarlo en su consulta. Puede borrar sus datos cuando quiera desde la configuración de su navegador; si usa un dispositivo compartido, bórrelos al terminar.</p>`;
  const DESTINO_REMOTO = `<p>Sus respuestas se envían a la {{RESPONSABLE}} y se almacenan en una planilla de Google, cuyos servidores pueden estar fuera de Chile. Solo ella y su equipo tienen acceso, y las usan únicamente para su atención. Puede pedir que se borren escribiendo a {{CONTACTO}} e indicando su código.</p>`;

  const TEXT = `
<p class="hint">Versión ${VERSION}</p>

<h4>¿Para qué es este cuestionario?</h4>
<p>El <em>Inventario de Sensibilización Central (CSI)</em> pregunta por síntomas que pueden relacionarse con la forma en que su sistema nervioso procesa el dolor. Sus respuestas ayudan a su médica, la <strong>{{RESPONSABLE}}</strong>, a <strong>orientar su evaluación y tratamiento</strong>. Por sí solo <strong>no es un diagnóstico</strong>.</p>

<h4>¿Qué se le pide?</h4>
<p>Responder unas preguntas breves sobre usted, 25 preguntas sobre síntomas y una lista de diagnósticos previos. Toma unos 10 minutos. <strong>No se le pide su nombre ni su RUT</strong>; por favor no escriba datos que lo identifiquen.</p>

<h4>¿Qué pasa con sus respuestas?</h4>
{{DESTINO}}
<p>Sus respuestas son datos de salud y se tratan con confidencialidad (leyes N° 19.628 y N° 20.584).</p>

<h4>Es voluntario</h4>
<p>Puede no responder o detenerse en cualquier momento, <strong>sin que esto afecte su atención de salud</strong>. Algunas preguntas tratan sobre ánimo, sueño o experiencias personales; si le incomodan, puede detenerse.</p>

<h4>Dudas</h4>
<p>{{CONTACTO}}</p>`;

  function html(cfg) {
    cfg = cfg || {};
    const t = TEXT.replace("{{DESTINO}}", cfg.SHEETS_URL ? DESTINO_REMOTO : DESTINO_LOCAL);
    return t.replace(/\{\{(\w+)\}\}/g, (_, k) => {
      const v = (cfg[k] || "").toString().trim();
      return v ? esc(v) : '<mark class="todo">[COMPLETAR: ' + k + "]</mark>";
    });
  }
  root.CSI_CONSENT = { VERSION, html };
})(typeof self !== "undefined" ? self : this);
