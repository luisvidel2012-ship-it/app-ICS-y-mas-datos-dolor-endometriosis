// Lógica del CSI (Central Sensitization Inventory) — sin dependencias del DOM.
(function (root) {
  const ITEMS = [
    "Me siento cansado/a y sin descansar al despertar por la mañana",
    "Mis músculos se sienten rígidos y doloridos",
    "Tengo ataques de ansiedad",
    "Aprieto o rechino los dientes",
    "Tengo problemas de diarrea y/o estreñimiento",
    "Necesito ayuda para realizar mis actividades diarias",
    "Soy sensible a las luces brillantes",
    "Me canso con mucha facilidad cuando hago actividad física",
    "Siento dolor en todo el cuerpo",
    "Tengo dolores de cabeza",
    "Siento molestias en la vejiga y/o ardor al orinar",
    "No duermo bien",
    "Tengo dificultad para concentrarme",
    "Tengo problemas de piel como sequedad, picazón o erupciones",
    "El estrés empeora mis síntomas físicos",
    "Me siento triste o deprimido/a",
    "Tengo poca energía",
    "Tengo tensión muscular en el cuello y los hombros",
    "Tengo dolor en la mandíbula",
    "Ciertos olores, como los perfumes, me hacen sentir mareo y náuseas",
    "Tengo que orinar con frecuencia",
    "Mis piernas se sienten incómodas e inquietas cuando intento dormir por la noche",
    "Tengo dificultad para recordar cosas",
    "Sufrí un trauma en la infancia",
    "Tengo dolor en la zona pélvica"
  ];
  const DIAGNOSES = [
    "Síndrome de piernas inquietas",
    "Síndrome de fatiga crónica",
    "Fibromialgia",
    "Trastorno de la articulación temporomandibular (ATM)",
    "Migraña o cefalea tensional",
    "Síndrome de intestino irritable",
    "Sensibilidad química múltiple",
    "Lesión de cuello (incluye latigazo cervical)",
    "Ansiedad o ataques de pánico",
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
