require("dotenv").config();
const mongoose = require("mongoose");

const Subject = require("./models/subject");
const Unit = require("./models/unit");
const Lesson = require("./models/lesson");
const Question = require("./models/question");
const Achievement = require("./models/achievement");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Conectado a MongoDB");
};

// ── DATA ──────────────────────────────────────────────────────

const subjectsData = [
  {
    name: "Matemática",
    description: "Números, operaciones, álgebra y geometría para todos los niveles.",
    icon: "🔢",
    color: "#6366F1",
    order: 1,
    aiPromptContext: "Eres un profesor de matemática para nivel secundario. Usá ejemplos cotidianos y concretos.",
  },
  {
    name: "Historia",
    description: "Civilizaciones, revoluciones y eventos que cambiaron el mundo.",
    icon: "🏛️",
    color: "#F59E0B",
    order: 2,
    aiPromptContext: "Eres un profesor de historia. Contextualizá los eventos y relacionalos con causas y consecuencias.",
  },
  {
    name: "Lengua",
    description: "Gramática, comprensión lectora y escritura en español.",
    icon: "📝",
    color: "#10B981",
    order: 3,
    aiPromptContext: "Eres un profesor de lengua española. Usá ejemplos claros y oraciones simples.",
  },
  {
    name: "Ciencias Naturales",
    description: "Biología, física y química del mundo que nos rodea.",
    icon: "🔬",
    color: "#3B82F6",
    order: 4,
    aiPromptContext: "Eres un profesor de ciencias naturales. Explicá los fenómenos con analogías simples.",
  },
];

// Unidades y lecciones por materia (índice)
const unitsData = [
  // ── Matemática ──
  [
    {
      name: "Números y operaciones",
      description: "Fundamentos de la aritmética",
      icon: "➕",
      order: 1,
      lessons: [
        { name: "Suma y resta", aiTopicHint: "suma y resta de números enteros", difficulty: "beginner", xpReward: 10 },
        { name: "Multiplicación", aiTopicHint: "multiplicación de números enteros y tablas", difficulty: "beginner", xpReward: 10 },
        { name: "División", aiTopicHint: "división exacta e inexacta de números enteros", difficulty: "beginner", xpReward: 10 },
        { name: "Checkpoint ✓", aiTopicHint: "operaciones básicas mezcladas", difficulty: "intermediate", xpReward: 20, type: "checkpoint" },
      ],
    },
    {
      name: "Álgebra básica",
      description: "Variables y ecuaciones simples",
      icon: "📐",
      order: 2,
      lessons: [
        { name: "Variables", aiTopicHint: "concepto de variable y expresiones algebraicas", difficulty: "beginner", xpReward: 10 },
        { name: "Ecuaciones 1er grado", aiTopicHint: "ecuaciones de primer grado con una incógnita", difficulty: "intermediate", xpReward: 15 },
        { name: "Sistemas de ecuaciones", aiTopicHint: "sistemas de 2 ecuaciones con 2 incógnitas", difficulty: "advanced", xpReward: 20 },
      ],
    },
  ],
  // ── Historia ──
  [
    {
      name: "Edad Antigua",
      description: "Las primeras civilizaciones de la humanidad",
      icon: "🏺",
      order: 1,
      lessons: [
        { name: "Mesopotamia", aiTopicHint: "civilización mesopotámica: sumerios, babilonios y asirios", difficulty: "beginner", xpReward: 10 },
        { name: "Egipto Antiguo", aiTopicHint: "el antiguo Egipto: faraones, pirámides y cultura", difficulty: "beginner", xpReward: 10 },
        { name: "Grecia Clásica", aiTopicHint: "la Grecia clásica: democracia, filosofía y cultura", difficulty: "intermediate", xpReward: 15 },
        { name: "Imperio Romano", aiTopicHint: "el Imperio Romano: expansión, estructura y caída", difficulty: "intermediate", xpReward: 15 },
      ],
    },
    {
      name: "Edad Moderna",
      description: "Renacimiento, Revolución y nuevos mundos",
      icon: "🗺️",
      order: 2,
      lessons: [
        { name: "El Renacimiento", aiTopicHint: "el Renacimiento europeo: arte, ciencia y humanismo", difficulty: "beginner", xpReward: 10 },
        { name: "Descubrimiento de América", aiTopicHint: "el descubrimiento y conquista de América", difficulty: "beginner", xpReward: 10 },
        { name: "Revolución Francesa", aiTopicHint: "causas, desarrollo y consecuencias de la Revolución Francesa", difficulty: "intermediate", xpReward: 15 },
      ],
    },
  ],
  // ── Lengua ──
  [
    {
      name: "Gramática",
      description: "Clases de palabras y estructura oracional",
      icon: "📖",
      order: 1,
      lessons: [
        { name: "Sustantivos", aiTopicHint: "clases de sustantivos: propios, comunes, concretos, abstractos", difficulty: "beginner", xpReward: 10 },
        { name: "Verbos", aiTopicHint: "conjugación verbal: tiempos y modos verbales en español", difficulty: "beginner", xpReward: 10 },
        { name: "Adjetivos", aiTopicHint: "tipos de adjetivos y concordancia con el sustantivo", difficulty: "beginner", xpReward: 10 },
        { name: "La oración", aiTopicHint: "sujeto y predicado: estructura de la oración simple", difficulty: "intermediate", xpReward: 15 },
      ],
    },
    {
      name: "Ortografía",
      description: "Reglas de escritura del español",
      icon: "✏️",
      order: 2,
      lessons: [
        { name: "Uso de B y V", aiTopicHint: "reglas de uso de B y V en español", difficulty: "beginner", xpReward: 10 },
        { name: "Uso de H", aiTopicHint: "reglas de uso de la H muda en español", difficulty: "beginner", xpReward: 10 },
        { name: "Acentuación", aiTopicHint: "reglas de acentuación: agudas, graves y esdrújulas", difficulty: "intermediate", xpReward: 15 },
      ],
    },
  ],
  // ── Ciencias Naturales ──
  [
    {
      name: "Biología",
      description: "La vida y los seres vivos",
      icon: "🌱",
      order: 1,
      lessons: [
        { name: "La célula", aiTopicHint: "estructura y función de la célula: partes y tipos", difficulty: "beginner", xpReward: 10 },
        { name: "Sistemas del cuerpo", aiTopicHint: "sistemas del cuerpo humano: digestivo, circulatorio y respiratorio", difficulty: "intermediate", xpReward: 15 },
        { name: "Ecosistemas", aiTopicHint: "ecosistemas: cadenas alimentarias y equilibrio ecológico", difficulty: "intermediate", xpReward: 15 },
      ],
    },
    {
      name: "Física básica",
      description: "Fuerzas, movimiento y energía",
      icon: "⚡",
      order: 2,
      lessons: [
        { name: "Movimiento", aiTopicHint: "conceptos de velocidad, aceleración y movimiento rectilíneo", difficulty: "beginner", xpReward: 10 },
        { name: "Fuerzas", aiTopicHint: "tipos de fuerzas: gravedad, fricción y normal. Leyes de Newton", difficulty: "intermediate", xpReward: 15 },
        { name: "Energía", aiTopicHint: "tipos de energía: cinética, potencial y transformaciones", difficulty: "intermediate", xpReward: 15 },
      ],
    },
  ],
];

// Preguntas de ejemplo por lección (se cargan para las primeras lecciones)
const questionsData = {
  "Suma y resta": [
    {
      type: "multiple_choice",
      prompt: "¿Cuánto es 347 + 256?",
      difficulty: "easy",
      xpValue: 2,
      explanation: "347 + 256 = 603. Sumamos unidades: 7+6=13 (llevamos 1), decenas: 4+5+1=10 (llevamos 1), centenas: 3+2+1=6.",
      tags: ["suma", "números enteros"],
      options: [
        { text: "503", isCorrect: false, explanation: "Revisá la suma de las centenas." },
        { text: "593", isCorrect: false, explanation: "Revisá el acarreo en las decenas." },
        { text: "603", isCorrect: true, explanation: "¡Correcto! 347 + 256 = 603." },
        { text: "613", isCorrect: false, explanation: "Revisá la suma de las unidades." },
      ],
    },
    {
      type: "true_false",
      prompt: "¿Es verdad que 500 - 237 = 263?",
      difficulty: "easy",
      xpValue: 2,
      explanation: "500 - 237 = 263. Podés verificar sumando: 237 + 263 = 500.",
      tags: ["resta", "números enteros"],
      correctBoolean: true,
    },
    {
      type: "fill_blank",
      prompt: "Si tenés $150 y gastás $87, te quedan $___ pesos.",
      difficulty: "easy",
      xpValue: 2,
      explanation: "150 - 87 = 63 pesos.",
      tags: ["resta", "problemas"],
      correctAnswers: ["63", "$ 63", "$63"],
    },
    {
      type: "multiple_choice",
      prompt: "¿Cuál es el resultado de (-5) + (-3)?",
      difficulty: "medium",
      xpValue: 3,
      explanation: "Cuando sumamos dos números negativos, sumamos sus valores absolutos y el resultado es negativo: (-5) + (-3) = -8.",
      tags: ["suma", "números negativos"],
      options: [
        { text: "-8", isCorrect: true, explanation: "¡Correcto! La suma de negativos da negativo." },
        { text: "8", isCorrect: false, explanation: "Ambos números son negativos, el resultado también lo es." },
        { text: "-2", isCorrect: false, explanation: "Confundiste suma con resta." },
        { text: "2", isCorrect: false, explanation: "Ambos números son negativos." },
      ],
    },
    {
      type: "order_items",
      prompt: "Ordená estos pasos para resolver 234 + 189:",
      difficulty: "easy",
      xpValue: 2,
      explanation: "Se suman primero las unidades, luego las decenas (con el acarreo) y finalmente las centenas.",
      tags: ["suma", "algoritmo"],
      items: ["Sumar las unidades: 4+9=13, escribir 3 y llevar 1", "Sumar las decenas: 3+8+1=12, escribir 2 y llevar 1", "Sumar las centenas: 2+1+1=4", "Resultado: 423"],
    },
  ],
  "Mesopotamia": [
    {
      type: "multiple_choice",
      prompt: "¿Entre qué ríos se desarrolló la civilización mesopotámica?",
      difficulty: "easy",
      xpValue: 2,
      explanation: "Mesopotamia significa 'tierra entre ríos' en griego, refiriéndose al Tigris y el Éufrates.",
      tags: ["mesopotamia", "geografía"],
      options: [
        { text: "Nilo y Congo", isCorrect: false, explanation: "El Nilo corresponde a Egipto." },
        { text: "Tigris y Éufrates", isCorrect: true, explanation: "¡Correcto! Mesopotamia = tierra entre ríos." },
        { text: "Indo y Ganges", isCorrect: false, explanation: "Esos ríos corresponden a la civilización del Indo." },
        { text: "Amazonas y Orinoco", isCorrect: false, explanation: "Esos ríos están en América del Sur." },
      ],
    },
    {
      type: "true_false",
      prompt: "Los sumerios inventaron uno de los primeros sistemas de escritura llamado cuneiforme.",
      difficulty: "easy",
      xpValue: 2,
      explanation: "Verdadero. La escritura cuneiforme sumeria es una de las más antiguas de la humanidad (aprox. 3200 a.C.).",
      tags: ["sumerios", "escritura"],
      correctBoolean: true,
    },
    {
      type: "match_pairs",
      prompt: "Relacioná cada pueblo con su aporte principal:",
      difficulty: "medium",
      xpValue: 3,
      explanation: "Cada civilización mesopotámica hizo aportes únicos a la humanidad.",
      tags: ["mesopotamia", "civilizaciones"],
      pairs: [
        { left: "Sumerios", right: "Escritura cuneiforme" },
        { left: "Babilonios", right: "Código de Hammurabi" },
        { left: "Asirios", right: "Primer ejército profesional" },
      ],
    },
    {
      type: "fill_blank",
      prompt: "El rey babilónico ___ creó uno de los primeros códigos legales de la historia.",
      difficulty: "medium",
      xpValue: 3,
      explanation: "Hammurabi (1792-1750 a.C.) creó el famoso código con 282 leyes grabadas en piedra.",
      tags: ["babilonia", "hammurabi"],
      correctAnswers: ["Hammurabi", "hammurabi"],
    },
    {
      type: "multiple_choice",
      prompt: "¿Cómo se llamaban las construcciones religiosas en forma de pirámide escalonada en Mesopotamia?",
      difficulty: "easy",
      xpValue: 2,
      explanation: "Los zigurats eran templos escalonados que servían como centros religiosos y administrativos.",
      tags: ["mesopotamia", "arquitectura"],
      options: [
        { text: "Pirámides", isCorrect: false, explanation: "Las pirámides son características de Egipto." },
        { text: "Zigurats", isCorrect: true, explanation: "¡Correcto! Los zigurats eran los templos mesopotámicos." },
        { text: "Ágoras", isCorrect: false, explanation: "Las ágoras son espacios públicos griegos." },
        { text: "Foros", isCorrect: false, explanation: "Los foros son plazas públicas romanas." },
      ],
    },
  ],
  "La célula": [
    {
      type: "multiple_choice",
      prompt: "¿Cuál es la estructura que controla todas las funciones de la célula?",
      difficulty: "easy",
      xpValue: 2,
      explanation: "El núcleo contiene el ADN y controla todas las actividades celulares.",
      tags: ["célula", "núcleo"],
      options: [
        { text: "Membrana celular", isCorrect: false, explanation: "La membrana regula el paso de sustancias." },
        { text: "Citoplasma", isCorrect: false, explanation: "El citoplasma es el medio donde ocurren las reacciones." },
        { text: "Núcleo", isCorrect: true, explanation: "¡Correcto! El núcleo es el 'cerebro' de la célula." },
        { text: "Mitocondria", isCorrect: false, explanation: "La mitocondria produce energía (ATP)." },
      ],
    },
    {
      type: "true_false",
      prompt: "Las células vegetales tienen pared celular y cloroplastos, a diferencia de las animales.",
      difficulty: "easy",
      xpValue: 2,
      explanation: "Verdadero. La pared celular da rigidez y los cloroplastos realizan la fotosíntesis.",
      tags: ["células", "diferencias"],
      correctBoolean: true,
    },
    {
      type: "match_pairs",
      prompt: "Relacioná cada organela con su función:",
      difficulty: "medium",
      xpValue: 3,
      explanation: "Cada organela tiene una función específica dentro de la célula.",
      tags: ["organelas", "funciones"],
      pairs: [
        { left: "Mitocondria", right: "Producción de energía" },
        { left: "Ribosoma", right: "Síntesis de proteínas" },
        { left: "Vacuola", right: "Almacenamiento de agua" },
        { left: "Membrana", right: "Controla el ingreso y egreso" },
      ],
    },
    {
      type: "fill_blank",
      prompt: "La teoría ___ establece que todos los seres vivos están formados por células.",
      difficulty: "easy",
      xpValue: 2,
      explanation: "La Teoría Celular, formulada en 1839 por Schleiden y Schwann, es uno de los pilares de la biología.",
      tags: ["teoría celular"],
      correctAnswers: ["celular", "Celular"],
    },
  ],
  "Sustantivos": [
    {
      type: "multiple_choice",
      prompt: "¿Cuál de estas palabras es un sustantivo propio?",
      difficulty: "easy",
      xpValue: 2,
      explanation: "Los sustantivos propios nombran personas, lugares o instituciones específicas y se escriben con mayúscula.",
      tags: ["sustantivos", "propios"],
      options: [
        { text: "ciudad", isCorrect: false, explanation: "Ciudad es un sustantivo común." },
        { text: "Buenos Aires", isCorrect: true, explanation: "¡Correcto! Buenos Aires es el nombre de una ciudad específica." },
        { text: "río", isCorrect: false, explanation: "Río es un sustantivo común." },
        { text: "perro", isCorrect: false, explanation: "Perro es un sustantivo común." },
      ],
    },
    {
      type: "true_false",
      prompt: "La palabra 'amor' es un sustantivo abstracto porque no se puede percibir con los sentidos.",
      difficulty: "easy",
      xpValue: 2,
      explanation: "Verdadero. Los sustantivos abstractos nombran sentimientos, ideas o conceptos que no podemos tocar o ver.",
      tags: ["sustantivos", "abstractos"],
      correctBoolean: true,
    },
    {
      type: "order_items",
      prompt: "Clasificá estos sustantivos de más concreto a más abstracto:",
      difficulty: "medium",
      xpValue: 3,
      explanation: "Los sustantivos van de lo más tangible (mesa) a lo más intangible (libertad).",
      tags: ["sustantivos", "clasificación"],
      items: ["mesa", "agua", "música", "libertad"],
    },
    {
      type: "fill_blank",
      prompt: "Los sustantivos ___ nombran a todos los seres de una misma especie, como 'perro' o 'montaña'.",
      difficulty: "easy",
      xpValue: 2,
      explanation: "Los sustantivos comunes nombran seres o cosas de forma genérica, sin distinguir uno en particular.",
      tags: ["sustantivos", "comunes"],
      correctAnswers: ["comunes", "Comunes"],
    },
  ],
};

// ── SEED FUNCTION ─────────────────────────────────────────────

async function seed() {
  try {
    await connectDB();

    // Limpiar colecciones
    console.log("🗑️  Limpiando datos anteriores...");
    await Promise.all([
      Subject.deleteMany({}),
      Unit.deleteMany({}),
      Lesson.deleteMany({}),
      Question.deleteMany({}),
    ]);

    // Seed achievements
    console.log("🏆 Cargando logros...");
    await Achievement.seedDefaults();

    // Seed subjects, units, lessons, questions
    for (let si = 0; si < subjectsData.length; si++) {
      const subjectData = subjectsData[si];
      console.log(`\n📚 Creando materia: ${subjectData.name}`);

      const subject = await Subject.create(subjectData);

      const units = unitsData[si];
      for (const unitData of units) {
        const { lessons: lessonsData, ...unitFields } = unitData;
        const unit = await Unit.create({ ...unitFields, subject: subject._id });
        console.log(`  📖 Unidad: ${unit.name}`);

        for (let li = 0; li < lessonsData.length; li++) {
          const lessonData = lessonsData[li];
          const lesson = await Lesson.create({
            ...lessonData,
            unit: unit._id,
            order: li + 1,
            questionCount: 5,
          });

          // Cargar preguntas si existen para esta lección
          const questions = questionsData[lessonData.name];
          if (questions) {
            await Question.insertMany(
              questions.map((q) => ({
                ...q,
                lesson: lesson._id,
                isActive: true,
                isReviewed: true,
              }))
            );
            console.log(`    ✅ ${lesson.name} (${questions.length} preguntas)`);
          } else {
            console.log(`    ⚠️  ${lesson.name} (sin preguntas — usará IA)`);
          }
        }
      }
    }

    console.log("\n🎉 Seed completado exitosamente!");
    console.log("📊 Resumen:");
    console.log(`   Materias: ${await Subject.countDocuments()}`);
    console.log(`   Unidades: ${await Unit.countDocuments()}`);
    console.log(`   Lecciones: ${await Lesson.countDocuments()}`);
    console.log(`   Preguntas: ${await Question.countDocuments()}`);
    console.log(`   Logros: ${await Achievement.countDocuments()}`);

  } catch (err) {
    console.error("❌ Error en seed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Desconectado de MongoDB");
  }
}

seed();