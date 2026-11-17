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
  const api = { ITEMS, DIAGNOSES, LEVELS, score, level };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.CSI = api;
})(typeof self !== "undefined" ? self : this);
