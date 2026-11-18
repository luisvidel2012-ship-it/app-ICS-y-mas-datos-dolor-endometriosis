// Lógica del CSI (Central Sensitization Inventory) — sin dependencias del DOM.
// Texto oficial: Cuesta-Vargas et al. 2016, SpringerPlus 5:1837, Apéndice (CC BY 4.0). No modificar sin justificar.
(function (root) {
  const ITEMS = [
    "Me siento cansado y desanimado cuando me levanto por las mañanas.",
    "Mis músculos están tensos y doloridos.",
    "Tengo ataques de pánico.",
    "Rechino los dientes o aprieto la mandíbula.",
    "Tengo problemas de diarrea o estreñimiento.",
    "Necesito ayuda para realizar mis actividades diarias.",
    "Soy sensible a la luz brillante.",
    "Me canso fácilmente cuando estoy físicamente activo.",
    "Siento dolor en todo mi cuerpo.",
    "Tengo dolores de cabeza.",
    "Tengo molestia en mi vejiga o sensación de quemazón al orinar.",
    "No duermo bien.",
    "Tengo dificultad para concentrarme.",
    "Tengo problemas en la piel como resequedad, picor o sarpullido.",
    "El estrés hace que mis síntomas físicos empeoren.",
    "Me siento triste o deprimido.",
    "Me siento con poca energía.",
    "Tengo tensión muscular en mi cuello y hombros.",
    "Tengo dolor en mi mandíbula.",
    "Algunos olores, como perfumes, me hacen sentir mareado y con náuseas.",
    "Tengo que orinar frecuentemente.",
    "Mis piernas se sienten incómodas e inquietas cuando intento dormir por la noche.",
    "Tengo dificultad para recordar cosas.",
    "Sufrí algún trauma cuando era niño(a).",
    "Tengo dolor en mi zona pélvica."
  ];
  const DIAGNOSES = [
    "Síndrome de Piernas Inquietas",
    "Síndrome de Fatiga Crónica",
    "Fibromialgia",
    "Trastornos Temporomandibulares",
    "Migrañas o Cefalea Tensional",
    "Síndrome de Colon Irritable",
    "Sensibilidad Química Múltiple",
    "Latigazo o Lesión en el Cuello (incluir la lesión de Whiplash)",
    "Ansiedad o Ataques de Pánico",
    "Depresión"
  ];
  const LEVELS = [
    { max: 29, label: "Subclínico" },
    { max: 39, label: "Leve" },
    { max: 49, label: "Moderado" },
    { max: 59, label: "Grave" },
    { max: 100, label: "Extremo" }
  ];
  // answers: arreglo de 25 valores 0–4 (o null/undefined si falta).
  function score(answers) {
    let total = 0, answered = 0;
    for (let i = 0; i < ITEMS.length; i++) {
      const v = answers[i];
      if (v === null || v === undefined || v === "") continue;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0 || n > 4) throw new Error("Respuesta inválida en ítem " + (i + 1));
      total += n; answered++;
    }
    return { total, answered, complete: answered === ITEMS.length };
  }
  function level(total) { return LEVELS.find(l => total <= l.max).label; }

  // Interpretación para la paciente. Rangos: Neblett et al., Pain Pract 2017;17(2):166-175, doi:10.1111/papr.12440.
  // Nombres amables para la paciente; el término técnico se muestra en letra pequeña.
  const BANDS = [
    { max: 29, label: "Bajo", tech: "Subclínico", range: "0–29",
      text: "Su puntaje está en el rango bajo: pocos de los síntomas que explora este cuestionario se presentan con frecuencia." },
    { max: 39, label: "Leve", tech: "Leve", range: "30–39",
      text: "Su puntaje está en el rango leve: algunos de los síntomas que explora este cuestionario se presentan con cierta frecuencia." },
    { max: 49, label: "Moderado", tech: "Moderado", range: "40–49",
      text: "Su puntaje está en el rango moderado y alcanza el valor de referencia (40). Varios de sus síntomas podrían estar relacionados con la sensibilización central; vale la pena conversarlo con su médica." },
    { max: 59, label: "Alto", tech: "Grave", range: "50–59",
      text: "Su puntaje está en el rango alto. Muchos de sus síntomas podrían estar relacionados con la sensibilización central; es importante conversarlo con su médica." },
    { max: 100, label: "Muy alto", tech: "Extremo", range: "60–100",
      text: "Su puntaje está en el rango muy alto. Gran parte de sus síntomas podría estar relacionada con la sensibilización central; es importante conversarlo con su médica." }
  ];
  function band(total) { const i = BANDS.findIndex(b => total <= b.max); return Object.assign({ index: i }, BANDS[i]); }
  const EXPLAIN = "La sensibilización central es un estado en el que el sistema nervioso queda con el «volumen alto»: responde con más intensidad al dolor y a otros estímulos, como la luz, los olores o el estrés. El dolor es real y puede abordarse junto a su equipo de salud.";
  const ACTIONS = ["Imprima este informe y llévelo a su consulta.", "Recuerde que este resultado no reemplaza la evaluación médica."];
  // Agrupación descriptiva (el CSI-Sp es unidimensional: no hay puntajes por área).
  // El ítem 24 (trauma en la infancia) se excluye a propósito: no es un síntoma.
  const GROUPS = [
    { name: "Energía, sueño y actividades diarias", items: [1, 6, 8, 12, 17, 22] },
    { name: "Ánimo, estrés y concentración", items: [3, 13, 15, 16, 23] },
    { name: "Músculos, cabeza y dolor", items: [2, 4, 9, 10, 18, 19, 25] },
    { name: "Vejiga, intestino y piel", items: [5, 11, 14, 21] },
    { name: "Sensibilidad a la luz y los olores", items: [7, 20] }
  ];
  function frequent(respuestas) {
    return GROUPS.map(g => ({ name: g.name, items: g.items.filter(n => respuestas[n - 1] >= 3).map(n => ({ n, text: ITEMS[n - 1], v: respuestas[n - 1] })) }))
      .filter(g => g.items.length);
  }
  const api = { ITEMS, DIAGNOSES, LEVELS, score, level, BANDS, band, EXPLAIN, ACTIONS, GROUPS, frequent };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.CSI = api;
})(typeof self !== "undefined" ? self : this);
