/**
 * seed.js — Poblar base de datos con 10 materias, unidades y lecciones
 * Uso: node seed.js
 */

const mongoose = require("mongoose");

// ─── Conexión ────────────────────────────────────────────────────────────────
const MONGO_URI =
  process.env.MONGO_URI;

// ─── Schemas (inline para no depender de rutas) ───────────────────────────────

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, required: true, maxlength: 300 },
    icon: { type: String, default: "📚" },
    color: { type: String, default: "#4F46E5" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    aiPromptContext: { type: String, default: "" },
  },
  { timestamps: true }
);

subjectSchema.pre("save", async function () {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }
});

const unitSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 500 },
    icon: { type: String, default: "📖" },
    order: { type: Number, required: true },
    requiredXP: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
unitSchema.index({ subject: 1, order: 1 }, { unique: true });

const lessonSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 500 },
    order: { type: Number, required: true },
    type: {
      type: String,
      enum: ["lesson", "checkpoint", "review", "ai_generated"],
      default: "lesson",
    },
    xpReward: { type: Number, default: 10 },
    gemsReward: { type: Number, default: 0 },
    questionCount: { type: Number, default: 5, min: 3, max: 20 },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
    aiTopicHint: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
lessonSchema.index({ unit: 1, order: 1 }, { unique: true });

const Subject = mongoose.model("Subject", subjectSchema);
const Unit = mongoose.model("Unit", unitSchema);
const Lesson = mongoose.model("Lesson", lessonSchema);

// ─── Datos del currículo ──────────────────────────────────────────────────────

const CURRICULUM = [
  {
    name: "Matemáticas",
    description: "Desde aritmética básica hasta cálculo diferencial e integral.",
    icon: "📐",
    color: "#3B82F6",
    aiPromptContext: "Materia de matemáticas para estudiantes de secundaria y preuniversitario.",
    units: [
      {
        name: "Números y operaciones básicas",
        description: "Fundamentos de aritmética: enteros, fracciones y potencias.",
        lessons: [
          { name: "Suma y resta de enteros", type: "lesson", difficulty: "easy", aiTopicHint: "suma y resta de números enteros positivos y negativos" },
          { name: "Multiplicación y división", type: "lesson", difficulty: "easy", aiTopicHint: "multiplicación y división de enteros" },
          { name: "Fracciones y decimales", type: "lesson", difficulty: "easy", aiTopicHint: "operaciones con fracciones y números decimales" },
          { name: "Potencias y raíces", type: "lesson", difficulty: "medium", aiTopicHint: "potencias, raíces cuadradas y cúbicas" },
          { name: "Orden de operaciones (PEMDAS)", type: "lesson", difficulty: "medium", aiTopicHint: "jerarquía de operaciones matemáticas" },
          { name: "Checkpoint: aritmética", type: "checkpoint", difficulty: "medium", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Álgebra",
        description: "Variables, ecuaciones y sistemas de ecuaciones lineales.",
        lessons: [
          { name: "Variables y expresiones algebraicas", type: "lesson", difficulty: "easy", aiTopicHint: "variables y expresiones algebraicas básicas" },
          { name: "Ecuaciones de primer grado", type: "lesson", difficulty: "easy", aiTopicHint: "ecuaciones lineales con una incógnita" },
          { name: "Sistemas de ecuaciones", type: "lesson", difficulty: "medium", aiTopicHint: "sistemas de ecuaciones lineales 2x2" },
          { name: "Inecuaciones", type: "lesson", difficulty: "medium", aiTopicHint: "inecuaciones de primer grado y representación en recta numérica" },
          { name: "Factorización", type: "lesson", difficulty: "medium", aiTopicHint: "factorización de polinomios: factor común y trinomio cuadrado perfecto" },
          { name: "Checkpoint: álgebra", type: "checkpoint", difficulty: "hard", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Geometría",
        description: "Figuras planas, sólidos y el teorema de Pitágoras.",
        lessons: [
          { name: "Ángulos y rectas", type: "lesson", difficulty: "easy", aiTopicHint: "tipos de ángulos y relaciones entre rectas" },
          { name: "Triángulos y teorema de Pitágoras", type: "lesson", difficulty: "medium", aiTopicHint: "triángulos y aplicación del teorema de Pitágoras" },
          { name: "Cuadriláteros y polígonos", type: "lesson", difficulty: "medium", aiTopicHint: "propiedades y área de cuadriláteros y polígonos regulares" },
          { name: "Círculo: área y perímetro", type: "lesson", difficulty: "medium", aiTopicHint: "circunferencia, área y arco del círculo" },
          { name: "Sólidos geométricos y volumen", type: "lesson", difficulty: "medium", aiTopicHint: "volumen y superficie de prismas, pirámides y esferas" },
          { name: "Checkpoint: geometría", type: "checkpoint", difficulty: "hard", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Estadística y probabilidad",
        description: "Análisis de datos y probabilidad de eventos.",
        lessons: [
          { name: "Media, mediana y moda", type: "lesson", difficulty: "easy", aiTopicHint: "medidas de tendencia central" },
          { name: "Gráficos estadísticos", type: "lesson", difficulty: "easy", aiTopicHint: "interpretación de gráficos de barras, histogramas y pictogramas" },
          { name: "Probabilidad básica", type: "lesson", difficulty: "medium", aiTopicHint: "probabilidad clásica y espacio muestral" },
          { name: "Eventos dependientes e independientes", type: "lesson", difficulty: "medium", aiTopicHint: "probabilidad condicional y eventos independientes" },
          { name: "Repaso de estadística", type: "review", difficulty: "medium", xpReward: 15 },
        ],
      },
      {
        name: "Cálculo introductorio",
        description: "Límites, derivadas e integrales básicas.",
        lessons: [
          { name: "Límites y continuidad", type: "lesson", difficulty: "hard", aiTopicHint: "concepto de límite y continuidad de funciones" },
          { name: "Derivadas: concepto y reglas", type: "lesson", difficulty: "hard", aiTopicHint: "derivada como razón de cambio y reglas de derivación" },
          { name: "Integrales: concepto básico", type: "lesson", difficulty: "hard", aiTopicHint: "integral como área bajo la curva y reglas básicas de integración" },
          { name: "Aplicaciones de la derivada", type: "lesson", difficulty: "hard", aiTopicHint: "máximos, mínimos y problemas de optimización con derivadas" },
          { name: "Checkpoint: cálculo", type: "checkpoint", difficulty: "hard", xpReward: 25, questionCount: 10 },
        ],
      },
    ],
  },
  {
    name: "Lengua y Literatura",
    description: "Gramática, comprensión lectora y literatura universal.",
    icon: "📖",
    color: "#EC4899",
    aiPromptContext: "Materia de lengua castellana y literatura para nivel secundario.",
    units: [
      {
        name: "Comprensión lectora",
        description: "Estrategias para entender, interpretar y analizar textos.",
        lessons: [
          { name: "Idea principal e ideas secundarias", type: "lesson", difficulty: "easy", aiTopicHint: "identificar idea principal e ideas secundarias en un texto" },
          { name: "Inferencias y deducciones", type: "lesson", difficulty: "medium", aiTopicHint: "hacer inferencias y deducciones a partir de un texto" },
          { name: "Tipos de texto", type: "lesson", difficulty: "easy", aiTopicHint: "texto narrativo, expositivo, argumentativo y descriptivo" },
          { name: "Vocabulario en contexto", type: "lesson", difficulty: "medium", aiTopicHint: "deducir el significado de palabras desconocidas por contexto" },
          { name: "Checkpoint: comprensión", type: "checkpoint", difficulty: "medium", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Gramática y ortografía",
        description: "Reglas gramaticales y uso correcto del español escrito.",
        lessons: [
          { name: "Clases de palabras", type: "lesson", difficulty: "easy", aiTopicHint: "sustantivos, verbos, adjetivos, adverbios y preposiciones" },
          { name: "Sujeto y predicado", type: "lesson", difficulty: "easy", aiTopicHint: "identificación del sujeto y el predicado en oraciones" },
          { name: "Uso de tildes", type: "lesson", difficulty: "medium", aiTopicHint: "reglas de acentuación: agudas, llanas, esdrújulas y tilde diacrítica" },
          { name: "Signos de puntuación", type: "lesson", difficulty: "medium", aiTopicHint: "uso correcto de coma, punto, punto y coma y dos puntos" },
          { name: "Concordancia verbal y nominal", type: "lesson", difficulty: "medium", aiTopicHint: "concordancia de género, número y persona en oraciones" },
          { name: "Checkpoint: gramática", type: "checkpoint", difficulty: "medium", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Producción escrita",
        description: "Técnicas para redactar textos claros, coherentes y bien estructurados.",
        lessons: [
          { name: "El párrafo bien estructurado", type: "lesson", difficulty: "easy", aiTopicHint: "estructura del párrafo: oración temática, desarrollo y cierre" },
          { name: "Texto argumentativo", type: "lesson", difficulty: "medium", aiTopicHint: "estructura y técnicas del texto argumentativo" },
          { name: "Texto expositivo", type: "lesson", difficulty: "medium", aiTopicHint: "características y redacción del texto expositivo" },
          { name: "Corrección de estilo y cohesión", type: "lesson", difficulty: "hard", aiTopicHint: "conectores discursivos y cohesión textual" },
          { name: "Repaso de escritura", type: "review", difficulty: "medium", xpReward: 15 },
        ],
      },
      {
        name: "Literatura universal",
        description: "Grandes géneros y obras de la literatura mundial.",
        lessons: [
          { name: "Géneros literarios", type: "lesson", difficulty: "easy", aiTopicHint: "lírica, narrativa y dramática: características y diferencias" },
          { name: "Narrativa: cuento y novela", type: "lesson", difficulty: "medium", aiTopicHint: "elementos del cuento y la novela: narrador, personajes y estructura" },
          { name: "Poesía y figuras retóricas", type: "lesson", difficulty: "medium", aiTopicHint: "metáfora, símil, hipérbole y otras figuras retóricas" },
          { name: "Teatro clásico y moderno", type: "lesson", difficulty: "medium", aiTopicHint: "características del teatro griego y el teatro del siglo XX" },
          { name: "Literatura latinoamericana", type: "lesson", difficulty: "medium", aiTopicHint: "boom latinoamericano y realismo mágico" },
          { name: "Checkpoint: literatura", type: "checkpoint", difficulty: "hard", xpReward: 20, questionCount: 10 },
        ],
      },
    ],
  },
  {
    name: "Ciencias Naturales",
    description: "Biología celular, cuerpo humano, genética y ecología.",
    icon: "🔬",
    color: "#10B981",
    aiPromptContext: "Materia de ciencias naturales y biología para secundaria.",
    units: [
      {
        name: "Biología celular",
        description: "La célula como unidad básica de la vida.",
        lessons: [
          { name: "Célula: estructura y función", type: "lesson", difficulty: "easy", aiTopicHint: "partes de la célula y función de cada organelo" },
          { name: "Célula procariota vs eucariota", type: "lesson", difficulty: "easy", aiTopicHint: "diferencias entre células procariotas y eucariotas" },
          { name: "División celular (mitosis y meiosis)", type: "lesson", difficulty: "medium", aiTopicHint: "fases de la mitosis y la meiosis" },
          { name: "Checkpoint: célula", type: "checkpoint", difficulty: "medium", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Cuerpo humano",
        description: "Los sistemas del organismo y cómo trabajan juntos.",
        lessons: [
          { name: "Sistema digestivo", type: "lesson", difficulty: "easy", aiTopicHint: "órganos y proceso de digestión en humanos" },
          { name: "Sistema circulatorio", type: "lesson", difficulty: "easy", aiTopicHint: "corazón, vasos sanguíneos y circulación de la sangre" },
          { name: "Sistema respiratorio", type: "lesson", difficulty: "easy", aiTopicHint: "órganos del sistema respiratorio e intercambio gaseoso" },
          { name: "Sistema nervioso", type: "lesson", difficulty: "medium", aiTopicHint: "sistema nervioso central y periférico, neurona y sinapsis" },
          { name: "Sistema óseo y muscular", type: "lesson", difficulty: "medium", aiTopicHint: "huesos, articulaciones y tipos de músculos" },
          { name: "Checkpoint: sistemas del cuerpo", type: "checkpoint", difficulty: "medium", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Genética y evolución",
        description: "Herencia biológica y teoría de la evolución.",
        lessons: [
          { name: "Leyes de Mendel", type: "lesson", difficulty: "medium", aiTopicHint: "leyes de segregación y distribución independiente de Mendel" },
          { name: "ADN y ARN", type: "lesson", difficulty: "medium", aiTopicHint: "estructura del ADN, ARN y síntesis de proteínas" },
          { name: "Mutaciones y herencia", type: "lesson", difficulty: "medium", aiTopicHint: "tipos de mutaciones genéticas y enfermedades hereditarias" },
          { name: "Teoría de la evolución", type: "lesson", difficulty: "medium", aiTopicHint: "selección natural y evidencias de la evolución de Darwin" },
          { name: "Repaso genética", type: "review", difficulty: "medium", xpReward: 15 },
        ],
      },
      {
        name: "Ecología",
        description: "Ecosistemas, biodiversidad y el equilibrio ambiental.",
        lessons: [
          { name: "Ecosistemas y biomas", type: "lesson", difficulty: "easy", aiTopicHint: "tipos de ecosistemas y principales biomas del mundo" },
          { name: "Cadenas y redes tróficas", type: "lesson", difficulty: "easy", aiTopicHint: "productores, consumidores y descomponedores en la cadena trófica" },
          { name: "Ciclos biogeoquímicos", type: "lesson", difficulty: "medium", aiTopicHint: "ciclo del agua, carbono y nitrógeno" },
          { name: "Biodiversidad y conservación", type: "lesson", difficulty: "medium", aiTopicHint: "pérdida de biodiversidad, especies en peligro y áreas protegidas" },
          { name: "Checkpoint: ecología", type: "checkpoint", difficulty: "medium", xpReward: 20, questionCount: 10 },
        ],
      },
    ],
  },
  {
    name: "Historia Universal",
    description: "De las civilizaciones antiguas hasta la historia contemporánea.",
    icon: "🏛️",
    color: "#F59E0B",
    aiPromptContext: "Materia de historia universal para nivel secundario.",
    units: [
      {
        name: "Civilizaciones antiguas",
        description: "Mesopotamia, Egipto, Grecia y Roma.",
        lessons: [
          { name: "Mesopotamia y Egipto", type: "lesson", difficulty: "easy", aiTopicHint: "civilizaciones de Mesopotamia y el Antiguo Egipto" },
          { name: "Grecia clásica", type: "lesson", difficulty: "easy", aiTopicHint: "polis griega, democracia ateniense y cultura helenística" },
          { name: "Roma: República e Imperio", type: "lesson", difficulty: "medium", aiTopicHint: "historia de Roma desde la república hasta la caída del Imperio" },
          { name: "Civilizaciones de Asia y África", type: "lesson", difficulty: "medium", aiTopicHint: "China, India y civilizaciones precolombinas" },
          { name: "Checkpoint: antigüedad", type: "checkpoint", difficulty: "medium", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Edad Media y Renacimiento",
        description: "Feudalismo, Islam, Cruzadas y el renacer cultural europeo.",
        lessons: [
          { name: "Feudalismo europeo", type: "lesson", difficulty: "easy", aiTopicHint: "estructura del feudalismo medieval europeo" },
          { name: "Islam y expansión árabe", type: "lesson", difficulty: "medium", aiTopicHint: "surgimiento del Islam y expansión del califato árabe" },
          { name: "Las Cruzadas", type: "lesson", difficulty: "medium", aiTopicHint: "causas, desarrollo y consecuencias de las cruzadas" },
          { name: "Renacimiento e Humanismo", type: "lesson", difficulty: "medium", aiTopicHint: "humanismo renacentista, arte y ciencia en el siglo XV-XVI" },
          { name: "Checkpoint: medieval", type: "checkpoint", difficulty: "medium", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Era Moderna",
        description: "Revoluciones que transformaron el mundo entre los siglos XVIII y XX.",
        lessons: [
          { name: "Revolución Francesa", type: "lesson", difficulty: "medium", aiTopicHint: "causas, fases y consecuencias de la Revolución Francesa" },
          { name: "Revolución Industrial", type: "lesson", difficulty: "medium", aiTopicHint: "primera y segunda revolución industrial: causas y consecuencias" },
          { name: "Imperialismo y colonialismo", type: "lesson", difficulty: "medium", aiTopicHint: "imperialismo europeo en África y Asia en el siglo XIX" },
          { name: "Primera Guerra Mundial", type: "lesson", difficulty: "medium", aiTopicHint: "causas, desarrollo y consecuencias de la Primera Guerra Mundial" },
          { name: "Segunda Guerra Mundial", type: "lesson", difficulty: "hard", aiTopicHint: "causas, frentes y consecuencias de la Segunda Guerra Mundial" },
          { name: "Checkpoint: era moderna", type: "checkpoint", difficulty: "hard", xpReward: 25, questionCount: 10 },
        ],
      },
      {
        name: "Historia contemporánea",
        description: "Guerra Fría, descolonización y globalización.",
        lessons: [
          { name: "Guerra Fría", type: "lesson", difficulty: "medium", aiTopicHint: "Guerra Fría: bloques, conflictos representativos y fin de la URSS" },
          { name: "Descolonización de África y Asia", type: "lesson", difficulty: "medium", aiTopicHint: "movimientos de independencia en África y Asia en el siglo XX" },
          { name: "Globalización", type: "lesson", difficulty: "medium", aiTopicHint: "globalización económica, cultural y sus impactos" },
          { name: "Repaso historia contemporánea", type: "review", difficulty: "medium", xpReward: 15 },
        ],
      },
    ],
  },
  {
    name: "Inglés",
    description: "Gramática, vocabulario y habilidades comunicativas en inglés.",
    icon: "🇬🇧",
    color: "#6366F1",
    aiPromptContext: "Materia de inglés como lengua extranjera para hispanohablantes, nivel A2-B2.",
    units: [
      {
        name: "Gramática esencial",
        description: "Los tiempos verbales y estructuras clave del inglés.",
        lessons: [
          { name: "Presente simple y continuo", type: "lesson", difficulty: "easy", aiTopicHint: "simple present vs present continuous in English" },
          { name: "Pasado simple y pasado perfecto", type: "lesson", difficulty: "easy", aiTopicHint: "simple past vs present perfect in English" },
          { name: "Futuro: will y going to", type: "lesson", difficulty: "medium", aiTopicHint: "will vs going to for future in English" },
          { name: "Modales (can, must, should)", type: "lesson", difficulty: "medium", aiTopicHint: "modal verbs in English: can, must, should, might" },
          { name: "Condicionales", type: "lesson", difficulty: "hard", aiTopicHint: "zero, first and second conditionals in English" },
          { name: "Checkpoint: gramática", type: "checkpoint", difficulty: "hard", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Vocabulario y comunicación",
        description: "Vocabulario temático para situaciones cotidianas.",
        lessons: [
          { name: "Vocabulario cotidiano y rutinas", type: "lesson", difficulty: "easy", aiTopicHint: "daily routines and common vocabulary in English" },
          { name: "Situaciones de viaje", type: "lesson", difficulty: "easy", aiTopicHint: "travel English: airport, hotel and directions vocabulary" },
          { name: "Trabajo y negocios", type: "lesson", difficulty: "medium", aiTopicHint: "business English vocabulary and workplace communication" },
          { name: "Phrasal verbs comunes", type: "lesson", difficulty: "medium", aiTopicHint: "most common phrasal verbs in English with examples" },
          { name: "Repaso de vocabulario", type: "review", difficulty: "medium", xpReward: 15 },
        ],
      },
      {
        name: "Comprensión y expresión",
        description: "Reading, listening y writing en inglés.",
        lessons: [
          { name: "Reading: textos informativos", type: "lesson", difficulty: "medium", aiTopicHint: "reading comprehension of informational texts in English" },
          { name: "Listening: conversaciones cotidianas", type: "lesson", difficulty: "medium", aiTopicHint: "listening comprehension of everyday conversations in English" },
          { name: "Writing: emails y mensajes", type: "lesson", difficulty: "medium", aiTopicHint: "writing formal and informal emails in English" },
          { name: "Checkpoint: comprensión", type: "checkpoint", difficulty: "hard", xpReward: 20, questionCount: 10 },
        ],
      },
    ],
  },
  {
    name: "Física",
    description: "Mecánica, electricidad, ondas y física moderna.",
    icon: "⚡",
    color: "#14B8A6",
    aiPromptContext: "Materia de física para nivel secundario y preuniversitario.",
    units: [
      {
        name: "Mecánica clásica",
        description: "Movimiento, fuerzas y energía.",
        lessons: [
          { name: "Cinemática: movimiento uniforme", type: "lesson", difficulty: "easy", aiTopicHint: "movimiento rectilíneo uniforme: velocidad y distancia" },
          { name: "Movimiento acelerado (MUA)", type: "lesson", difficulty: "medium", aiTopicHint: "movimiento uniformemente acelerado y caída libre" },
          { name: "Leyes de Newton", type: "lesson", difficulty: "medium", aiTopicHint: "primera, segunda y tercera ley de Newton con aplicaciones" },
          { name: "Trabajo, energía y potencia", type: "lesson", difficulty: "medium", aiTopicHint: "trabajo mecánico, energía cinética y potencial, conservación de energía" },
          { name: "Checkpoint: mecánica", type: "checkpoint", difficulty: "hard", xpReward: 25, questionCount: 10 },
        ],
      },
      {
        name: "Ondas y sonido",
        description: "Naturaleza de las ondas y propagación del sonido.",
        lessons: [
          { name: "Naturaleza de las ondas", type: "lesson", difficulty: "easy", aiTopicHint: "longitud de onda, frecuencia, amplitud y tipos de ondas" },
          { name: "El sonido: velocidad y frecuencia", type: "lesson", difficulty: "medium", aiTopicHint: "velocidad del sonido, frecuencia e intensidad" },
          { name: "Efecto Doppler", type: "lesson", difficulty: "hard", aiTopicHint: "efecto Doppler: concepto, fórmula y aplicaciones" },
          { name: "Repaso ondas", type: "review", difficulty: "medium", xpReward: 15 },
        ],
      },
      {
        name: "Electricidad y magnetismo",
        description: "Carga eléctrica, circuitos y electromagnetismo.",
        lessons: [
          { name: "Carga eléctrica y ley de Coulomb", type: "lesson", difficulty: "medium", aiTopicHint: "carga eléctrica, ley de Coulomb y campo eléctrico" },
          { name: "Corriente, voltaje y resistencia", type: "lesson", difficulty: "medium", aiTopicHint: "ley de Ohm, corriente eléctrica y resistencia" },
          { name: "Circuitos en serie y paralelo", type: "lesson", difficulty: "medium", aiTopicHint: "circuitos en serie y paralelo: cálculo de resistencia equivalente" },
          { name: "Magnetismo y electromagnetismo", type: "lesson", difficulty: "hard", aiTopicHint: "campo magnético, inducción electromagnética y motor eléctrico" },
          { name: "Checkpoint: electricidad", type: "checkpoint", difficulty: "hard", xpReward: 25, questionCount: 10 },
        ],
      },
      {
        name: "Óptica y física moderna",
        description: "Luz, lentes y una introducción a la física cuántica.",
        lessons: [
          { name: "Reflexión y refracción", type: "lesson", difficulty: "easy", aiTopicHint: "leyes de reflexión y refracción de la luz" },
          { name: "Lentes y espejos", type: "lesson", difficulty: "medium", aiTopicHint: "lentes convergentes y divergentes, espejos cóncavos y convexos" },
          { name: "Introducción a la física cuántica", type: "lesson", difficulty: "hard", aiTopicHint: "dualidad onda-corpúsculo, efecto fotoeléctrico y principio de incertidumbre" },
          { name: "Checkpoint: óptica", type: "checkpoint", difficulty: "hard", xpReward: 20, questionCount: 10 },
        ],
      },
    ],
  },
  {
    name: "Química",
    description: "Átomos, enlaces, reacciones y química orgánica básica.",
    icon: "🧪",
    color: "#EF4444",
    aiPromptContext: "Materia de química para nivel secundario.",
    units: [
      {
        name: "Materia y átomos",
        description: "Estructura atómica y tabla periódica.",
        lessons: [
          { name: "Estructura del átomo", type: "lesson", difficulty: "easy", aiTopicHint: "protones, neutrones y electrones: modelo atómico de Bohr" },
          { name: "Tabla periódica", type: "lesson", difficulty: "easy", aiTopicHint: "organización de la tabla periódica y propiedades periódicas" },
          { name: "Configuración electrónica", type: "lesson", difficulty: "medium", aiTopicHint: "configuración electrónica y niveles de energía" },
          { name: "Checkpoint: átomo", type: "checkpoint", difficulty: "medium", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Enlace químico",
        description: "Cómo se unen los átomos para formar moléculas.",
        lessons: [
          { name: "Enlace iónico", type: "lesson", difficulty: "medium", aiTopicHint: "formación de enlace iónico y propiedades de compuestos iónicos" },
          { name: "Enlace covalente", type: "lesson", difficulty: "medium", aiTopicHint: "enlace covalente simple, doble y triple; polaridad" },
          { name: "Enlace metálico y fuerzas intermoleculares", type: "lesson", difficulty: "medium", aiTopicHint: "enlace metálico y fuerzas de Van der Waals" },
          { name: "Repaso de enlaces", type: "review", difficulty: "medium", xpReward: 15 },
        ],
      },
      {
        name: "Reacciones químicas",
        description: "Tipos de reacciones, balanceo y estequiometría.",
        lessons: [
          { name: "Tipos de reacciones", type: "lesson", difficulty: "easy", aiTopicHint: "síntesis, descomposición, sustitución y doble sustitución" },
          { name: "Balanceo de ecuaciones", type: "lesson", difficulty: "medium", aiTopicHint: "balanceo de ecuaciones químicas por tanteo" },
          { name: "Estequiometría", type: "lesson", difficulty: "hard", aiTopicHint: "cálculos estequiométricos con mol y masa molar" },
          { name: "Velocidad de reacción", type: "lesson", difficulty: "hard", aiTopicHint: "factores que afectan la velocidad de una reacción química" },
          { name: "Checkpoint: reacciones", type: "checkpoint", difficulty: "hard", xpReward: 25, questionCount: 10 },
        ],
      },
      {
        name: "Química orgánica básica",
        description: "Introducción a los compuestos del carbono.",
        lessons: [
          { name: "Hidrocarburos", type: "lesson", difficulty: "medium", aiTopicHint: "alcanos, alquenos y alquinos: nomenclatura básica" },
          { name: "Grupos funcionales", type: "lesson", difficulty: "medium", aiTopicHint: "alcoholes, ácidos carboxílicos, éteres y aminas" },
          { name: "Reacciones orgánicas esenciales", type: "lesson", difficulty: "hard", aiTopicHint: "sustitución, adición y eliminación en química orgánica" },
          { name: "Checkpoint: orgánica", type: "checkpoint", difficulty: "hard", xpReward: 20, questionCount: 10 },
        ],
      },
    ],
  },
  {
    name: "Geografía",
    description: "Geografía física, humana y geopolítica mundial.",
    icon: "🌍",
    color: "#84CC16",
    aiPromptContext: "Materia de geografía para nivel secundario.",
    units: [
      {
        name: "Geografía física",
        description: "Relieve, hidrografía y climas del planeta.",
        lessons: [
          { name: "Relieve y formaciones terrestres", type: "lesson", difficulty: "easy", aiTopicHint: "montañas, valles, mesetas, llanuras y formaciones costeras" },
          { name: "Hidrografía: ríos, mares y océanos", type: "lesson", difficulty: "easy", aiTopicHint: "principales ríos, mares y océanos del mundo" },
          { name: "Climas y zonas climáticas", type: "lesson", difficulty: "medium", aiTopicHint: "tipos de clima: tropical, templado, árido, polar" },
          { name: "Desastres naturales", type: "lesson", difficulty: "medium", aiTopicHint: "terremotos, erupciones, tsunamis e inundaciones" },
          { name: "Checkpoint: geografía física", type: "checkpoint", difficulty: "medium", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Geografía humana",
        description: "Población, migraciones y economía mundial.",
        lessons: [
          { name: "Demografía y migraciones", type: "lesson", difficulty: "medium", aiTopicHint: "crecimiento poblacional, natalidad, mortalidad y migraciones" },
          { name: "Urbanización y ciudades", type: "lesson", difficulty: "medium", aiTopicHint: "proceso de urbanización y megalópolis mundiales" },
          { name: "Economía mundial", type: "lesson", difficulty: "medium", aiTopicHint: "países desarrollados y en desarrollo, bloques económicos" },
          { name: "Repaso geografía humana", type: "review", difficulty: "medium", xpReward: 15 },
        ],
      },
      {
        name: "Geopolítica",
        description: "Regiones del mundo, organismos internacionales y conflictos.",
        lessons: [
          { name: "Continentes y regiones del mundo", type: "lesson", difficulty: "easy", aiTopicHint: "división regional del mundo y características de cada continente" },
          { name: "Organismos internacionales (ONU, UE...)", type: "lesson", difficulty: "medium", aiTopicHint: "ONU, Unión Europea, OTAN y otros organismos internacionales" },
          { name: "Conflictos territoriales modernos", type: "lesson", difficulty: "medium", aiTopicHint: "principales conflictos geopolíticos del siglo XXI" },
          { name: "Checkpoint: geopolítica", type: "checkpoint", difficulty: "medium", xpReward: 20, questionCount: 10 },
        ],
      },
    ],
  },
  {
    name: "Filosofía y Ética",
    description: "Historia del pensamiento, lógica y ética aplicada.",
    icon: "🧠",
    color: "#8B5CF6",
    aiPromptContext: "Materia de filosofía y ética para nivel secundario.",
    units: [
      {
        name: "Historia de la filosofía",
        description: "Los grandes pensadores desde la Antigua Grecia hasta hoy.",
        lessons: [
          { name: "Filósofos presocráticos", type: "lesson", difficulty: "easy", aiTopicHint: "Tales, Heráclito, Parménides y los primeros filósofos griegos" },
          { name: "Sócrates, Platón y Aristóteles", type: "lesson", difficulty: "medium", aiTopicHint: "teorías y métodos de Sócrates, Platón y Aristóteles" },
          { name: "Filosofía moderna: Descartes y Kant", type: "lesson", difficulty: "hard", aiTopicHint: "racionalismo de Descartes y filosofía crítica de Kant" },
          { name: "Existencialismo y filosofía contemporánea", type: "lesson", difficulty: "hard", aiTopicHint: "existencialismo de Sartre, Camus y filosofía del siglo XX" },
          { name: "Checkpoint: historia filosófica", type: "checkpoint", difficulty: "hard", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Lógica y argumentación",
        description: "Herramientas para pensar y argumentar con rigor.",
        lessons: [
          { name: "Proposiciones y conectores lógicos", type: "lesson", difficulty: "medium", aiTopicHint: "proposiciones, negación, conjunción, disyunción e implicación lógica" },
          { name: "Falacias argumentativas", type: "lesson", difficulty: "medium", aiTopicHint: "principales falacias lógicas y cómo identificarlas" },
          { name: "Pensamiento crítico", type: "lesson", difficulty: "medium", aiTopicHint: "habilidades de pensamiento crítico: análisis, evaluación y síntesis" },
          { name: "Repaso lógica", type: "review", difficulty: "medium", xpReward: 15 },
        ],
      },
      {
        name: "Ética y ciudadanía",
        description: "Teorías éticas, derechos humanos y ética aplicada.",
        lessons: [
          { name: "Teorías éticas: utilitarismo y deontología", type: "lesson", difficulty: "medium", aiTopicHint: "utilitarismo de Mill vs deontología de Kant" },
          { name: "Derechos humanos", type: "lesson", difficulty: "easy", aiTopicHint: "historia y declaración universal de los derechos humanos" },
          { name: "Ética ambiental", type: "lesson", difficulty: "medium", aiTopicHint: "ética ecológica, cambio climático y responsabilidad ambiental" },
          { name: "Bioética", type: "lesson", difficulty: "hard", aiTopicHint: "dilemas bioéticos: eutanasia, aborto, ingeniería genética" },
          { name: "Checkpoint: ética", type: "checkpoint", difficulty: "hard", xpReward: 20, questionCount: 10 },
        ],
      },
    ],
  },
  {
    name: "Informática",
    description: "Fundamentos de computación, programación y seguridad digital.",
    icon: "💻",
    color: "#0EA5E9",
    aiPromptContext: "Materia de informática y pensamiento computacional para secundaria.",
    units: [
      {
        name: "Fundamentos de computación",
        description: "Historia, hardware, software y redes.",
        lessons: [
          { name: "Historia de la computación", type: "lesson", difficulty: "easy", aiTopicHint: "historia de los computadores desde los años 40 hasta hoy" },
          { name: "Hardware y software", type: "lesson", difficulty: "easy", aiTopicHint: "componentes de hardware y tipos de software" },
          { name: "Sistemas operativos", type: "lesson", difficulty: "medium", aiTopicHint: "funciones del sistema operativo y tipos: Windows, Linux, macOS" },
          { name: "Redes e Internet", type: "lesson", difficulty: "medium", aiTopicHint: "topologías de red, protocolos TCP/IP y funcionamiento de Internet" },
          { name: "Checkpoint: fundamentos", type: "checkpoint", difficulty: "medium", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Pensamiento computacional",
        description: "Algoritmos, lógica y estructuras de control.",
        lessons: [
          { name: "Algoritmos y diagramas de flujo", type: "lesson", difficulty: "easy", aiTopicHint: "concepto de algoritmo y representación con diagramas de flujo" },
          { name: "Variables, datos y operadores", type: "lesson", difficulty: "easy", aiTopicHint: "tipos de datos, variables y operadores en programación" },
          { name: "Condicionales y bucles", type: "lesson", difficulty: "medium", aiTopicHint: "estructuras if/else y bucles for/while en pseudocódigo" },
          { name: "Funciones y modularidad", type: "lesson", difficulty: "medium", aiTopicHint: "concepto de función, parámetros y retorno de valores" },
          { name: "Checkpoint: lógica de programación", type: "checkpoint", difficulty: "medium", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Programación básica",
        description: "Introducción práctica a Python.",
        lessons: [
          { name: "Introducción a Python", type: "lesson", difficulty: "easy", aiTopicHint: "sintaxis básica de Python: print, variables y tipos de datos" },
          { name: "Listas y estructuras de datos", type: "lesson", difficulty: "medium", aiTopicHint: "listas, tuplas y diccionarios en Python" },
          { name: "Funciones y módulos", type: "lesson", difficulty: "medium", aiTopicHint: "definición de funciones y uso de módulos en Python" },
          { name: "Manejo de archivos", type: "lesson", difficulty: "hard", aiTopicHint: "lectura y escritura de archivos con Python" },
          { name: "Repaso programación", type: "review", difficulty: "medium", xpReward: 15 },
        ],
      },
      {
        name: "Seguridad y sociedad digital",
        description: "Ciberseguridad, privacidad e impacto social de la tecnología.",
        lessons: [
          { name: "Ciberseguridad básica", type: "lesson", difficulty: "medium", aiTopicHint: "amenazas comunes en Internet: phishing, malware y contraseñas seguras" },
          { name: "Privacidad y datos personales", type: "lesson", difficulty: "medium", aiTopicHint: "privacidad digital, RGPD y huella digital" },
          { name: "Inteligencia artificial y sociedad", type: "lesson", difficulty: "medium", aiTopicHint: "impacto de la IA en el trabajo, educación y ética" },
          { name: "Checkpoint: seguridad digital", type: "checkpoint", difficulty: "medium", xpReward: 20, questionCount: 10 },
        ],
      },
    ],
  },

  // ── MATERIA 11: Mecanografía ─────────────────────────────────────────────
  {
    name: "Mecanografía",
    description: "Aprende a escribir con todos los dedos sin mirar el teclado, ganando velocidad y precisión.",
    icon: "⌨️",
    color: "#64748B",
    aiPromptContext: "Materia de mecanografía: postura, técnica dactilar, velocidad y precisión al escribir en teclado QWERTY.",
    units: [
      {
        name: "Fundamentos y postura",
        description: "Configuración del entorno, postura ergonómica y conocimiento del teclado.",
        lessons: [
          { name: "Ergonomía: postura y posición de manos", type: "lesson", difficulty: "easy", aiTopicHint: "postura correcta frente al teclado, distancia a la pantalla y posición de muñecas" },
          { name: "Zonas del teclado: fila guía", type: "lesson", difficulty: "easy", aiTopicHint: "fila guía ASDF JKL; y asignación de dedos en mecanografía" },
          { name: "Distribución QWERTY: todas las filas", type: "lesson", difficulty: "easy", aiTopicHint: "distribución de letras en fila superior, guía e inferior del teclado QWERTY" },
          { name: "Teclas especiales: Shift, Enter, Backspace", type: "lesson", difficulty: "easy", aiTopicHint: "uso de Shift, Enter, Backspace y Tab en mecanografía" },
          { name: "Checkpoint: postura y teclado", type: "checkpoint", difficulty: "easy", xpReward: 15, questionCount: 8 },
        ],
      },
      {
        name: "Fila guía: ASDF JKL;",
        description: "Dominio de la fila central del teclado con ambas manos.",
        lessons: [
          { name: "Mano izquierda: A S D F", type: "lesson", difficulty: "easy", aiTopicHint: "ejercicios de mecanografía con los dedos de la mano izquierda en fila guía" },
          { name: "Mano derecha: J K L ;", type: "lesson", difficulty: "easy", aiTopicHint: "ejercicios de mecanografía con los dedos de la mano derecha en fila guía" },
          { name: "Combinaciones con ambas manos", type: "lesson", difficulty: "easy", aiTopicHint: "ejercicios combinados con toda la fila guía del teclado" },
          { name: "Palabras solo con fila guía", type: "lesson", difficulty: "easy", aiTopicHint: "palabras formables con letras de la fila guía para práctica de mecanografía" },
          { name: "Checkpoint: fila guía", type: "checkpoint", difficulty: "easy", xpReward: 15, questionCount: 8 },
        ],
      },
      {
        name: "Fila superior: QWERTY UIOP",
        description: "Extensión de dedos hacia la fila superior del teclado.",
        lessons: [
          { name: "Teclas Q W E R T (mano izquierda)", type: "lesson", difficulty: "medium", aiTopicHint: "ejercicios de mecanografía con la fila superior mano izquierda: Q W E R T" },
          { name: "Teclas Y U I O P (mano derecha)", type: "lesson", difficulty: "medium", aiTopicHint: "ejercicios de mecanografía con la fila superior mano derecha: Y U I O P" },
          { name: "Palabras y frases con filas guía + superior", type: "lesson", difficulty: "medium", aiTopicHint: "palabras combinando fila guía y fila superior del teclado" },
          { name: "Checkpoint: fila superior", type: "checkpoint", difficulty: "medium", xpReward: 15, questionCount: 8 },
        ],
      },
      {
        name: "Fila inferior: ZXCV BNM",
        description: "Control de los dedos en la fila inferior y cobertura total del teclado.",
        lessons: [
          { name: "Teclas Z X C V (mano izquierda)", type: "lesson", difficulty: "medium", aiTopicHint: "ejercicios con la fila inferior mano izquierda: Z X C V" },
          { name: "Teclas B N M , . (mano derecha)", type: "lesson", difficulty: "medium", aiTopicHint: "ejercicios con la fila inferior mano derecha: B N M , ." },
          { name: "Texto completo: las tres filas", type: "lesson", difficulty: "medium", aiTopicHint: "frases y párrafos usando las tres filas del teclado" },
          { name: "Checkpoint: teclado completo", type: "checkpoint", difficulty: "medium", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Números y símbolos",
        description: "Fila numérica y símbolos frecuentes en texto profesional.",
        lessons: [
          { name: "Fila de números 1 al 5 (mano izquierda)", type: "lesson", difficulty: "medium", aiTopicHint: "mecanografía de números 1 2 3 4 5 con la mano izquierda" },
          { name: "Fila de números 6 al 0 (mano derecha)", type: "lesson", difficulty: "medium", aiTopicHint: "mecanografía de números 6 7 8 9 0 con la mano derecha" },
          { name: "Símbolos frecuentes: arroba, numeral, signo de dólar, porcentaje", type: "lesson", difficulty: "hard", aiTopicHint: "mecanografía de símbolos especiales con Shift y fila numérica" },
          { name: "Repaso: números y símbolos", type: "review", difficulty: "medium", xpReward: 15 },
        ],
      },
      {
        name: "Velocidad y precisión",
        description: "Métricas PPM, técnicas para aumentar velocidad sin perder precisión.",
        lessons: [
          { name: "Qué son PPM y precisión", type: "lesson", difficulty: "easy", aiTopicHint: "palabras por minuto, pulsaciones y porcentaje de precisión en mecanografía" },
          { name: "Técnicas para aumentar velocidad", type: "lesson", difficulty: "medium", aiTopicHint: "rutinas y ejercicios para mejorar la velocidad de escritura" },
          { name: "Errores comunes y cómo corregirlos", type: "lesson", difficulty: "medium", aiTopicHint: "errores frecuentes en mecanografía y técnicas de corrección" },
          { name: "Práctica con textos reales", type: "lesson", difficulty: "hard", aiTopicHint: "mecanografía de párrafos de texto real para alcanzar fluidez" },
          { name: "Checkpoint final: velocidad", type: "checkpoint", difficulty: "hard", xpReward: 25, questionCount: 10 },
        ],
      },
    ],
  },

  // ── MATERIA 12: Python ───────────────────────────────────────────────────
  {
    name: "Python",
    description: "Programación en Python desde cero: sintaxis, estructuras de datos, POO, APIs y proyectos reales.",
    icon: "🐍",
    color: "#F59E0B",
    aiPromptContext: "Materia de programación en Python para principiantes y nivel intermedio. Python 3.",
    units: [
      {
        name: "Primeros pasos en Python",
        description: "Instalación, entorno y conceptos básicos del lenguaje.",
        lessons: [
          { name: "Instalación de Python y VS Code", type: "lesson", difficulty: "easy", aiTopicHint: "instalación de Python 3 y configuración de VS Code para desarrollo" },
          { name: "Hola Mundo y sintaxis básica", type: "lesson", difficulty: "easy", aiTopicHint: "primer programa en Python: print, comentarios y ejecución de scripts" },
          { name: "Variables y tipos de datos", type: "lesson", difficulty: "easy", aiTopicHint: "int, float, str, bool en Python: declaración y asignación de variables" },
          { name: "Operadores aritméticos y lógicos", type: "lesson", difficulty: "easy", aiTopicHint: "operadores suma, resta, multiplicación, división, módulo, potencia y operadores lógicos en Python" },
          { name: "Input y output con input() y print()", type: "lesson", difficulty: "easy", aiTopicHint: "lectura de datos con input() y formateo de salida con print() y f-strings en Python" },
          { name: "Checkpoint: bases de Python", type: "checkpoint", difficulty: "easy", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Control de flujo",
        description: "Condicionales, bucles y manejo de la lógica del programa.",
        lessons: [
          { name: "Condicionales: if, elif, else", type: "lesson", difficulty: "easy", aiTopicHint: "estructura if, elif y else en Python con ejemplos prácticos" },
          { name: "Bucle while", type: "lesson", difficulty: "medium", aiTopicHint: "bucle while en Python: condición, break y continue" },
          { name: "Bucle for y range()", type: "lesson", difficulty: "medium", aiTopicHint: "bucle for con range() e iteración sobre listas en Python" },
          { name: "Comprensión de listas", type: "lesson", difficulty: "medium", aiTopicHint: "list comprehension en Python: sintaxis y casos de uso" },
          { name: "Manejo de excepciones: try y except", type: "lesson", difficulty: "medium", aiTopicHint: "manejo de errores con try, except, else y finally en Python" },
          { name: "Checkpoint: control de flujo", type: "checkpoint", difficulty: "medium", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Funciones",
        description: "Definición, parámetros, retorno y funciones avanzadas.",
        lessons: [
          { name: "Definir y llamar funciones", type: "lesson", difficulty: "easy", aiTopicHint: "def, parámetros y return en Python" },
          { name: "Parámetros por defecto y args kwargs", type: "lesson", difficulty: "medium", aiTopicHint: "parámetros con valor por defecto, *args y **kwargs en Python" },
          { name: "Alcance de variables: local y global", type: "lesson", difficulty: "medium", aiTopicHint: "scope local y global de variables en Python" },
          { name: "Funciones lambda", type: "lesson", difficulty: "medium", aiTopicHint: "funciones anónimas lambda en Python: sintaxis y usos" },
          { name: "Funciones map, filter y reduce", type: "lesson", difficulty: "hard", aiTopicHint: "map(), filter() y functools.reduce() en Python con ejemplos" },
          { name: "Checkpoint: funciones", type: "checkpoint", difficulty: "hard", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Estructuras de datos",
        description: "Listas, tuplas, diccionarios y conjuntos en profundidad.",
        lessons: [
          { name: "Listas: métodos y operaciones", type: "lesson", difficulty: "medium", aiTopicHint: "listas en Python: append, pop, sort, slice y métodos principales" },
          { name: "Tuplas e inmutabilidad", type: "lesson", difficulty: "medium", aiTopicHint: "tuplas en Python: creación, inmutabilidad y cuándo usarlas" },
          { name: "Diccionarios: claves y valores", type: "lesson", difficulty: "medium", aiTopicHint: "diccionarios en Python: creación, acceso, iteración y métodos" },
          { name: "Conjuntos (sets)", type: "lesson", difficulty: "medium", aiTopicHint: "sets en Python: operaciones de unión, intersección y diferencia" },
          { name: "Repaso: estructuras de datos", type: "review", difficulty: "medium", xpReward: 15 },
        ],
      },
      {
        name: "Programación Orientada a Objetos",
        description: "Clases, objetos, herencia y polimorfismo en Python.",
        lessons: [
          { name: "Clases y objetos", type: "lesson", difficulty: "medium", aiTopicHint: "definición de clases, atributos e instancias en Python" },
          { name: "Constructor __init__ y self", type: "lesson", difficulty: "medium", aiTopicHint: "método __init__, self y atributos de instancia en Python" },
          { name: "Métodos y atributos de clase", type: "lesson", difficulty: "medium", aiTopicHint: "métodos de instancia, de clase y estáticos en Python" },
          { name: "Herencia y sobreescritura", type: "lesson", difficulty: "hard", aiTopicHint: "herencia de clases, super() y sobreescritura de métodos en Python" },
          { name: "Encapsulación y polimorfismo", type: "lesson", difficulty: "hard", aiTopicHint: "encapsulación con _ y __ y polimorfismo en Python" },
          { name: "Checkpoint: POO", type: "checkpoint", difficulty: "hard", xpReward: 25, questionCount: 10 },
        ],
      },
      {
        name: "Módulos, archivos y APIs",
        description: "Importar módulos, trabajar con archivos y consumir APIs REST.",
        lessons: [
          { name: "Módulos estándar: os, sys, math, random", type: "lesson", difficulty: "medium", aiTopicHint: "módulos os, sys, math y random de la biblioteca estándar de Python" },
          { name: "Lectura y escritura de archivos", type: "lesson", difficulty: "medium", aiTopicHint: "open(), read(), write() y manejo de archivos de texto en Python" },
          { name: "JSON: leer y escribir datos", type: "lesson", difficulty: "medium", aiTopicHint: "módulo json en Python: json.loads(), json.dumps(), json.load() y json.dump()" },
          { name: "Consumir una API REST con requests", type: "lesson", difficulty: "hard", aiTopicHint: "librería requests en Python: GET, POST y manejo de respuestas JSON" },
          { name: "Checkpoint: módulos y APIs", type: "checkpoint", difficulty: "hard", xpReward: 25, questionCount: 10 },
        ],
      },
      {
        name: "Proyecto final Python",
        description: "Aplicación de todo lo aprendido en un proyecto completo.",
        lessons: [
          { name: "Planificación de un proyecto Python", type: "lesson", difficulty: "medium", aiTopicHint: "cómo planificar un proyecto en Python: estructura de carpetas y módulos" },
          { name: "CRUD con archivos JSON", type: "lesson", difficulty: "hard", aiTopicHint: "crear un sistema CRUD usando archivos JSON en Python" },
          { name: "CLI: argumentos con argparse", type: "lesson", difficulty: "hard", aiTopicHint: "crear herramientas de línea de comandos con argparse en Python" },
          { name: "Testing básico con unittest", type: "lesson", difficulty: "hard", aiTopicHint: "pruebas unitarias en Python con el módulo unittest" },
          { name: "Checkpoint final Python", type: "checkpoint", difficulty: "hard", xpReward: 30, questionCount: 10 },
        ],
      },
    ],
  },

  // ── MATERIA 13: Project Moon Trivia ─────────────────────────────────────
  {
    name: "Project Moon Trivia",
    description: "Trivia definitiva del universo Project Moon: Lobotomy Corporation, Library of Ruina, Limbus Company y los lore mas oscuros de la Ciudad.",
    icon: "🌙",
    color: "#7C3AED",
    aiPromptContext: "Materia de trivia y lore del universo Project Moon (Lobotomy Corporation, Library of Ruina, Limbus Company). Preguntas sobre personajes, abnormalities, sinners, facciones y eventos del lore.",
    units: [
      {
        name: "Lobotomy Corporation",
        description: "La corporación, sus trabajadores, y los Abnormalities que gestiona.",
        lessons: [
          { name: "Que es Lobotomy Corporation", type: "lesson", difficulty: "easy", aiTopicHint: "lore de Lobotomy Corporation: qué es, su propósito y el rol de Angela y el Manager" },
          { name: "Clases de Abnormalities: ZAYIN a ALEPH", type: "lesson", difficulty: "easy", aiTopicHint: "clasificación de Abnormalities por letras hebreas en Lobotomy Corporation: ZAYIN, TETH, HE, WAW, ALEPH" },
          { name: "Abnormalities icónicos: One Sin, CENSORED, Árbol de Ceniza", type: "lesson", difficulty: "medium", aiTopicHint: "lore de One Sin and Hundreds of Good Deeds, CENSORED y Burning Branch of Truth en Lobotomy Corporation" },
          { name: "Los trabajadores y los departamentos", type: "lesson", difficulty: "medium", aiTopicHint: "departamentos y agentes de Lobotomy Corporation: roles, Clerks y Agents" },
          { name: "Meltdowns, Breaches y Ordeals", type: "lesson", difficulty: "medium", aiTopicHint: "meltdowns de Abnormalities y los Ordeals (Dawn, Noon, Dusk, Midnight) en Lobotomy Corporation" },
          { name: "El final de Lobotomy Corporation y la Luz", type: "lesson", difficulty: "hard", aiTopicHint: "eventos finales de Lobotomy Corporation: los 10 Sefirot, Angela, Carmen y la recolección de la Luz" },
          { name: "Checkpoint: Lobotomy Corporation", type: "checkpoint", difficulty: "hard", xpReward: 25, questionCount: 10 },
        ],
      },
      {
        name: "Library of Ruina",
        description: "La Biblioteca, sus huéspedes y la historia de Angela y Roland.",
        lessons: [
          { name: "La Biblioteca de Ruina: concepto y reglas", type: "lesson", difficulty: "easy", aiTopicHint: "qué es la Library of Ruina, las invitaciones, los Reishim y la dinámica de combate por libros" },
          { name: "Angela y su transformación", type: "lesson", difficulty: "medium", aiTopicHint: "arco narrativo de Angela en Library of Ruina: su humanización, dolor y objetivo" },
          { name: "Roland y los recuerdos de la Ciudad", type: "lesson", difficulty: "medium", aiTopicHint: "historia de Roland en Library of Ruina: su pasado, Kali y su conexión con Charon" },
          { name: "Los Jefes de Piso y sus facciones", type: "lesson", difficulty: "medium", aiTopicHint: "Floor Leaders de Library of Ruina: Urban Nightmare, Zwei, Malkuth, Keter Reishim y sus equipos" },
          { name: "Las Facciones de la Ciudad invitadas", type: "lesson", difficulty: "hard", aiTopicHint: "facciones invitadas a la biblioteca: Jefe de la Calle, Salud, Tiphereth, Hokma y demás" },
          { name: "El final de Library of Ruina", type: "lesson", difficulty: "hard", aiTopicHint: "conclusión de Library of Ruina: la decisión de Angela, la apertura y el destino de los personajes" },
          { name: "Checkpoint: Library of Ruina", type: "checkpoint", difficulty: "hard", xpReward: 25, questionCount: 10 },
        ],
      },
      {
        name: "La Ciudad",
        description: "Geografía, facciones y política del mundo distópico de Project Moon.",
        lessons: [
          { name: "Estructura de la Ciudad: capas y Nests", type: "lesson", difficulty: "easy", aiTopicHint: "estructura vertical de la Ciudad en Project Moon: Surface, Upper, Middle, Lower, Backstreets y Abyss" },
          { name: "Las Corporaciones de los 10 Sefirot", type: "lesson", difficulty: "medium", aiTopicHint: "las 10 corporaciones Sefirot de la Ciudad en Project Moon y su rol en el lore" },
          { name: "Facciones callejeras y Fixers", type: "lesson", difficulty: "medium", aiTopicHint: "Fixers, oficinas de Fixers y facciones callejeras del mundo de Project Moon" },
          { name: "El Color: EGO y Luz", type: "lesson", difficulty: "hard", aiTopicHint: "concepto de Luz, Distorsión y EGO en el universo Project Moon" },
          { name: "Checkpoint: La Ciudad", type: "checkpoint", difficulty: "hard", xpReward: 20, questionCount: 10 },
        ],
      },
      {
        name: "Limbus Company",
        description: "Los Sinners, Dante, y la búsqueda del Hueso Dorado.",
        lessons: [
          { name: "Que es Limbus Company", type: "lesson", difficulty: "easy", aiTopicHint: "premisa de Limbus Company: Dante, los Sinners y la misión de encontrar el Hueso Dorado" },
          { name: "Los 12 Sinners: perfiles y habilidades", type: "lesson", difficulty: "medium", aiTopicHint: "los 12 Pecadores de Limbus Company: Yi Sang, Faust, Don Quijote, Ryoshu, Meursault, Hong Lu, Heathcliff, Ishmael, Rodion, Sinclair, Outis y Gregor" },
          { name: "Dante y el Pasajero", type: "lesson", difficulty: "medium", aiTopicHint: "lore de Dante en Limbus Company: su origen, su relación con los Sinners y el Pasajero" },
          { name: "El sistema de IDs y EGOs", type: "lesson", difficulty: "medium", aiTopicHint: "sistema de IDs y EGOs en Limbus Company: clases de EGO, afinidades y distorsión" },
          { name: "Cantos: historia por capítulos", type: "lesson", difficulty: "hard", aiTopicHint: "resumen de los Cantos principales de Limbus Company: tramas, antagonistas y revelaciones de lore" },
          { name: "Conexiones con Lobotomy Corp y Library of Ruina", type: "lesson", difficulty: "hard", aiTopicHint: "referencias y continuidad de lore entre los tres juegos de Project Moon" },
          { name: "Checkpoint: Limbus Company", type: "checkpoint", difficulty: "hard", xpReward: 25, questionCount: 10 },
        ],
      },
      {
        name: "Personajes y lore profundo",
        description: "Personajes clave, filosofía y misterios del universo Project Moon.",
        lessons: [
          { name: "Carmen: la primera Gerente y su legado", type: "lesson", difficulty: "hard", aiTopicHint: "quién es Carmen en Project Moon: su rol en Lobotomy Corporation, su relación con Angela y su destino" },
          { name: "Vergilius y su verdadera identidad", type: "lesson", difficulty: "hard", aiTopicHint: "misterios y revelaciones sobre Vergilius en el lore de Project Moon" },
          { name: "Abnormalities inspirados en literatura", type: "lesson", difficulty: "medium", aiTopicHint: "Abnormalities de Lobotomy Corporation inspirados en cuentos y obras literarias" },
          { name: "La filosofía del sufrimiento en Project Moon", type: "lesson", difficulty: "hard", aiTopicHint: "temas filosóficos del universo Project Moon: sufrimiento, redención, humanidad y distorsión" },
          { name: "Repaso: lore y conexiones", type: "review", difficulty: "hard", xpReward: 20 },
          { name: "Checkpoint final: Project Moon Master", type: "checkpoint", difficulty: "hard", xpReward: 30, questionCount: 15 },
        ],
      },
    ],
  },
];

// ─── Función principal ────────────────────────────────────────────────────────

// ─── Función principal ────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Conectado a MongoDB");

  let totalSubjects = 0, totalUnits = 0, totalLessons = 0;

  for (const [si, subjData] of CURRICULUM.entries()) {
    // Crear o recuperar materia
    let subject = await Subject.findOne({ name: subjData.name });
    if (!subject) {
      subject = new Subject({
        name: subjData.name,
        description: subjData.description,
        icon: subjData.icon,
        color: subjData.color,
        order: si + 1,
        aiPromptContext: subjData.aiPromptContext,
      });
      await subject.save();
      totalSubjects++;
      console.log(`  📚 Materia creada: ${subject.name}`);
    } else {
      console.log(`  ⏭️  Materia ya existe: ${subject.name}`);
    }

    for (const [ui, unitData] of subjData.units.entries()) {
      // Crear o recuperar unidad
      let unit = await Unit.findOne({ subject: subject._id, order: ui + 1 });
      if (!unit) {
        unit = new Unit({
          subject: subject._id,
          name: unitData.name,
          description: unitData.description || "",
          order: ui + 1,
        });
        await unit.save();
        totalUnits++;
        console.log(`    📖 Unidad creada: ${unit.name}`);
      } else {
        console.log(`    ⏭️  Unidad ya existe: ${unit.name}`);
      }

      for (const [li, lessonData] of unitData.lessons.entries()) {
        const exists = await Lesson.findOne({ unit: unit._id, order: li + 1 });
        if (!exists) {
          await Lesson.create({
            unit: unit._id,
            name: lessonData.name,
            order: li + 1,
            type: lessonData.type || "lesson",
            difficulty: lessonData.difficulty || "easy",
            xpReward: lessonData.xpReward || (lessonData.type === "checkpoint" ? 20 : 10),
            gemsReward: lessonData.type === "checkpoint" ? 2 : 0,
            questionCount: lessonData.questionCount || 5,
            aiTopicHint: lessonData.aiTopicHint || "",
          });
          totalLessons++;
        }
      }
      console.log(`      ✏️  ${unitData.lessons.length} lecciones cargadas en "${unitData.name}"`);
    }
  }

  console.log("\n🎉 Seed completado:");
  console.log(`   Materias nuevas : ${totalSubjects}`);
  console.log(`   Unidades nuevas : ${totalUnits}`);
  console.log(`   Lecciones nuevas: ${totalLessons}`);

  await mongoose.disconnect();
  console.log("🔌 Desconectado de MongoDB");
}

seed().catch((err) => {
  console.error("❌ Error en el seed:", err);
  process.exit(1);
});
