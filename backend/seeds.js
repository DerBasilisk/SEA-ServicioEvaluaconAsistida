require("dotenv").config();
const mongoose = require("mongoose");
const { User, Subject, Unit, Lesson, Question, Achievement } = require("./models");

const DB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/sea";

async function seed() {
  await mongoose.connect(DB_URI);
  console.log("✅ Conectado a MongoDB");

  // Limpiar colecciones
  await Promise.all([
    Subject.deleteMany({}),
    Unit.deleteMany({}),
    Lesson.deleteMany({}),
    Question.deleteMany({}),
    Achievement.deleteMany({}),
  ]);
  console.log("🗑️  Colecciones limpiadas");

  // ── MATEMÁTICAS ──────────────────────────────────────────────
  const matematica = await Subject.create({
    name: "Matemática",
    slug: "matematica",
    description: "Operaciones básicas y razonamiento numérico",
    icon: "🔢",
    color: "#6366f1",
    order: 1,
    aiPromptContext: "Materia de matemática para niños de primaria. Las preguntas deben usar números concretos y situaciones cotidianas. Evitá abstracciones.",
  });

  // Unidad 1 — Matemáticas Básicas 1
  const matUnit1 = await Unit.create({ subject: matematica._id, name: "Matemáticas Básicas 1", icon: "➕", order: 1, requiredXP: 0 });
  const matU1Lessons = await Lesson.insertMany([
    { unit: matUnit1._id, name: "Suma de un dígito",           order: 1, type: "lesson",      xpReward: 10, questionCount: 5, difficulty: "beginner", aiTopicHint: "Sumas simples con números del 1 al 9, ej: 3+4, 2+7" },
    { unit: matUnit1._id, name: "Resta de un dígito",          order: 2, type: "lesson",      xpReward: 10, questionCount: 5, difficulty: "beginner", aiTopicHint: "Restas simples con números del 1 al 9, ej: 7-3, 9-5" },
    { unit: matUnit1._id, name: "Suma y Resta de un dígito",   order: 3, type: "lesson",      xpReward: 15, questionCount: 5, difficulty: "beginner", aiTopicHint: "Mezcla de sumas y restas con números del 1 al 9" },
    { unit: matUnit1._id, name: "Checkpoint",                  order: 4, type: "checkpoint",  xpReward: 25, questionCount: 8, difficulty: "beginner", aiTopicHint: "Repaso de sumas y restas de un dígito" },
  ]);

  // Preguntas seed para "Suma de un dígito"
  await Question.insertMany([
    { lesson: matU1Lessons[0]._id, type: "multiple_choice", prompt: "¿Cuánto es 3 + 4?", difficulty: "easy", xpValue: 2, explanation: "3 + 4 = 7. Contá 3 y seguí 4 más: 4, 5, 6, 7.", tags: ["suma", "un dígito"],
      options: [{ text: "6", isCorrect: false }, { text: "7", isCorrect: true }, { text: "8", isCorrect: false }, { text: "5", isCorrect: false }] },
    { lesson: matU1Lessons[0]._id, type: "true_false", prompt: "2 + 5 = 8", difficulty: "easy", xpValue: 2, explanation: "2 + 5 = 7, no 8.", tags: ["suma"], correctBoolean: false },
    { lesson: matU1Lessons[0]._id, type: "fill_blank", prompt: "1 + ___ = 9", difficulty: "easy", xpValue: 2, explanation: "9 - 1 = 8, entonces el número faltante es 8.", tags: ["suma"], correctAnswers: ["8", "ocho"] },
    { lesson: matU1Lessons[0]._id, type: "multiple_choice", prompt: "¿Cuánto es 6 + 3?", difficulty: "easy", xpValue: 2, explanation: "6 + 3 = 9.", tags: ["suma"],
      options: [{ text: "8", isCorrect: false }, { text: "10", isCorrect: false }, { text: "9", isCorrect: true }, { text: "7", isCorrect: false }] },
    { lesson: matU1Lessons[0]._id, type: "sentence_builder", prompt: "La suma de 4 + 4 es igual a ___", difficulty: "easy", xpValue: 3, explanation: "4 + 4 = 8.", tags: ["suma"],
      wordBank: ["8", "6", "9", "7"], correctAnswers: ["8"] },
  ]);

  // Unidad 2 — Matemáticas Básicas 2
  const matUnit2 = await Unit.create({ subject: matematica._id, name: "Matemáticas Básicas 2", icon: "🔟", order: 2, requiredXP: 30 });
  await Lesson.insertMany([
    { unit: matUnit2._id, name: "Suma de dos dígitos",          order: 1, type: "lesson",     xpReward: 15, questionCount: 6, difficulty: "beginner", aiTopicHint: "Sumas con números del 10 al 99, ej: 12+23, 34+45" },
    { unit: matUnit2._id, name: "Resta de dos dígitos",         order: 2, type: "lesson",     xpReward: 15, questionCount: 6, difficulty: "beginner", aiTopicHint: "Restas con números del 10 al 99, ej: 45-23, 78-34" },
    { unit: matUnit2._id, name: "Suma y Resta de dos dígitos",  order: 3, type: "lesson",     xpReward: 20, questionCount: 6, difficulty: "beginner", aiTopicHint: "Mezcla de sumas y restas con números de dos dígitos" },
    { unit: matUnit2._id, name: "Checkpoint",                   order: 4, type: "checkpoint", xpReward: 30, questionCount: 8, difficulty: "beginner", aiTopicHint: "Repaso de sumas y restas de dos dígitos" },
  ]);

  // Unidad 3 — Matemáticas Básicas 3
  const matUnit3 = await Unit.create({ subject: matematica._id, name: "Matemáticas Básicas 3", icon: "✖️", order: 3, requiredXP: 80 });
  await Lesson.insertMany([
    { unit: matUnit3._id, name: "Multiplicación de un dígito",           order: 1, type: "lesson",     xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "Tablas del 1 al 9, ej: 3×4, 7×2" },
    { unit: matUnit3._id, name: "División de un dígito",                 order: 2, type: "lesson",     xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "Divisiones exactas simples, ej: 8÷2, 9÷3" },
    { unit: matUnit3._id, name: "Multiplicación y División de un dígito",order: 3, type: "lesson",     xpReward: 20, questionCount: 6, difficulty: "intermediate", aiTopicHint: "Mezcla de multiplicaciones y divisiones de un dígito" },
    { unit: matUnit3._id, name: "Checkpoint",                            order: 4, type: "checkpoint", xpReward: 35, questionCount: 10, difficulty: "intermediate", aiTopicHint: "Repaso de multiplicación y división de un dígito" },
  ]);

  // ── LENGUA ───────────────────────────────────────────────────
  const lengua = await Subject.create({
    name: "Lengua",
    slug: "lengua",
    description: "Lectura, escritura y vocabulario básico",
    icon: "📖",
    color: "#10b981",
    order: 2,
    aiPromptContext: "Materia de lengua para niños de primaria. El foco es el reconocimiento de palabras simples, sílabas y letras. Usá palabras cotidianas y cortas.",
  });

  // Unidad 1 — Lenguaje Común 1
  const lenUnit1 = await Unit.create({ subject: lengua._id, name: "Lenguaje Común 1", icon: "🔤", order: 1, requiredXP: 0 });
  const lenU1Lessons = await Lesson.insertMany([
    { unit: lenUnit1._id, name: "Palabras con M",       order: 1, type: "lesson",     xpReward: 10, questionCount: 5, difficulty: "beginner", aiTopicHint: "Palabras cortas que empiezan o contienen la letra M: mamá, mesa, mano, mono, miel" },
    { unit: lenUnit1._id, name: "Palabras con P",       order: 2, type: "lesson",     xpReward: 10, questionCount: 5, difficulty: "beginner", aiTopicHint: "Palabras cortas que empiezan o contienen la letra P: papá, pato, pala, pelo, piso" },
    { unit: lenUnit1._id, name: "Palabras con S",       order: 3, type: "lesson",     xpReward: 10, questionCount: 5, difficulty: "beginner", aiTopicHint: "Palabras cortas que empiezan o contienen la letra S: sol, sopa, sala, saco, sino" },
    { unit: lenUnit1._id, name: "Palabras con M, P y S",order: 4, type: "lesson",     xpReward: 15, questionCount: 6, difficulty: "beginner", aiTopicHint: "Mezcla de palabras con M, P y S" },
    { unit: lenUnit1._id, name: "Checkpoint",           order: 5, type: "checkpoint", xpReward: 25, questionCount: 8, difficulty: "beginner", aiTopicHint: "Repaso de palabras con M, P y S" },
  ]);

  // Preguntas seed para "Palabras con M"
  await Question.insertMany([
    { lesson: lenU1Lessons[0]._id, type: "multiple_choice", prompt: "¿Cuál de estas palabras empieza con M?", difficulty: "easy", xpValue: 2, explanation: "Mesa empieza con la letra M.", tags: ["letra M", "vocabulario"],
      options: [{ text: "pato", isCorrect: false }, { text: "mesa", isCorrect: true }, { text: "sopa", isCorrect: false }, { text: "taza", isCorrect: false }] },
    { lesson: lenU1Lessons[0]._id, type: "true_false", prompt: "La palabra 'mono' empieza con la letra M", difficulty: "easy", xpValue: 2, explanation: "Sí, mono comienza con M: M-O-N-O.", tags: ["letra M"], correctBoolean: true },
    { lesson: lenU1Lessons[0]._id, type: "fill_blank", prompt: "Ma___ (animal que vuela de noche)", difficulty: "easy", xpValue: 2, explanation: "Mariposa o murciélago. La respuesta es 'mariposa'.", tags: ["letra M"], correctAnswers: ["riposa", "mariposa"] },
    { lesson: lenU1Lessons[0]._id, type: "sentence_builder", prompt: "La ___ está en la cocina", difficulty: "easy", xpValue: 3, explanation: "Mesa es una palabra con M que puede estar en la cocina.", tags: ["letra M"],
      wordBank: ["mesa", "pato", "silla", "sol"], correctAnswers: ["mesa"] },
    { lesson: lenU1Lessons[0]._id, type: "multiple_choice", prompt: "¿Qué letra empieza la palabra 'mamá'?", difficulty: "easy", xpValue: 2, explanation: "Mamá empieza con M.", tags: ["letra M"],
      options: [{ text: "P", isCorrect: false }, { text: "S", isCorrect: false }, { text: "M", isCorrect: true }, { text: "N", isCorrect: false }] },
  ]);

  // Unidad 2 — Lenguaje Común 2
  const lenUnit2 = await Unit.create({ subject: lengua._id, name: "Lenguaje Común 2", icon: "🔡", order: 2, requiredXP: 40 });
  await Lesson.insertMany([
    { unit: lenUnit2._id, name: "Palabras con R",       order: 1, type: "lesson",     xpReward: 10, questionCount: 5, difficulty: "beginner", aiTopicHint: "Palabras cortas con R: ropa, rata, rosa, río, rana" },
    { unit: lenUnit2._id, name: "Palabras con T",       order: 2, type: "lesson",     xpReward: 10, questionCount: 5, difficulty: "beginner", aiTopicHint: "Palabras cortas con T: taza, toro, tela, tipo, tuna" },
    { unit: lenUnit2._id, name: "Palabras con N",       order: 3, type: "lesson",     xpReward: 10, questionCount: 5, difficulty: "beginner", aiTopicHint: "Palabras cortas con N: nido, nota, nube, nariz, niño" },
    { unit: lenUnit2._id, name: "Palabras con R, T y N",order: 4, type: "lesson",     xpReward: 15, questionCount: 6, difficulty: "beginner", aiTopicHint: "Mezcla de palabras con R, T y N" },
    { unit: lenUnit2._id, name: "Checkpoint",           order: 5, type: "checkpoint", xpReward: 25, questionCount: 8, difficulty: "beginner", aiTopicHint: "Repaso de palabras con R, T y N" },
  ]);

  // Unidad 3 — Lenguaje Común 3
  const lenUnit3 = await Unit.create({ subject: lengua._id, name: "Lenguaje Común 3", icon: "📝", order: 3, requiredXP: 90 });
  await Lesson.insertMany([
    { unit: lenUnit3._id, name: "Palabras con M y P",   order: 1, type: "lesson",     xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "Palabras que combinan las letras M y P: campo, mapa, tiempo, ejemplo" },
    { unit: lenUnit3._id, name: "Palabras con R y S",   order: 2, type: "lesson",     xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "Palabras que combinan R y S: rosa, curso, verso, precio" },
    { unit: lenUnit3._id, name: "Palabras con N y T",   order: 3, type: "lesson",     xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "Palabras que combinan N y T: tanto, noche, nata, entre, viento" },
    { unit: lenUnit3._id, name: "Checkpoint",           order: 4, type: "checkpoint", xpReward: 30, questionCount: 10, difficulty: "intermediate", aiTopicHint: "Repaso de combinaciones de letras M+P, R+S, N+T" },
  ]);

  // ── LOGROS ───────────────────────────────────────────────────
  await Achievement.insertMany([
    { key: "first_lesson",   name: "¡Primera lección!",    description: "Completaste tu primera lección",          icon: "🎉", category: "milestone", condition: { type: "lessons_completed", threshold: 1  }, reward: { xp: 10, gems: 5  }, rarity: "common"   },
    { key: "lessons_5",      name: "En racha",             description: "Completaste 5 lecciones",                 icon: "🔥", category: "milestone", condition: { type: "lessons_completed", threshold: 5  }, reward: { xp: 20, gems: 10 }, rarity: "common"   },
    { key: "lessons_10",     name: "Dedicado",             description: "Completaste 10 lecciones",                icon: "💪", category: "milestone", condition: { type: "lessons_completed", threshold: 10 }, reward: { xp: 30, gems: 15 }, rarity: "rare"     },
    { key: "perfect_score",  name: "¡Perfecto!",           description: "Obtuviste 100% en una lección",           icon: "⭐", category: "performance",condition: { type: "perfect_lessons",   threshold: 1  }, reward: { xp: 15, gems: 10 }, rarity: "rare"     },
    { key: "streak_3",       name: "3 días seguidos",      description: "Estudiaste 3 días consecutivos",          icon: "📅", category: "streak",    condition: { type: "streak_days",       threshold: 3  }, reward: { xp: 20, gems: 10 }, rarity: "common"   },
    { key: "streak_7",       name: "Una semana",           description: "Estudiaste 7 días consecutivos",          icon: "🗓️", category: "streak",    condition: { type: "streak_days",       threshold: 7  }, reward: { xp: 50, gems: 25 }, rarity: "epic"     },
    { key: "xp_100",         name: "Centenario",           description: "Acumulaste 100 XP",                       icon: "💯", category: "milestone", condition: { type: "total_xp",          threshold: 100}, reward: { xp: 10, gems: 5  }, rarity: "common"   },
  ]);

  console.log("✅ Seed completado:");
  console.log("   📐 Matemática: 3 unidades, 12 lecciones");
  console.log("   📖 Lengua: 3 unidades, 14 lecciones");
  console.log("   🏆 7 logros");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});