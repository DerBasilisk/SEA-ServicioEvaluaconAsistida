require("dotenv").config();
const mongoose = require("mongoose");
const { User, Subject, Unit, Lesson, Question, Achievement } = require("./models");

const DB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/sea";

async function seed() {
  await mongoose.connect(DB_URI);
  console.log("✅ Conectado a MongoDB");

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
    aiPromptContext: "Materia de matemática para niños de primaria. Las preguntas deben usar números concretos y situaciones cotidianas. Evitá abstracciones. Usá artículos gramaticalmente correctos en español.",
  });

  const matUnit1 = await Unit.create({ subject: matematica._id, name: "Matemáticas Básicas 1", icon: "➕", order: 1, requiredXP: 0 });
  const matU1Lessons = await Lesson.insertMany([
    { unit: matUnit1._id, name: "Suma de un dígito",          order: 1, type: "lesson",     xpReward: 10, questionCount: 5, difficulty: "beginner",     aiTopicHint: "Sumas simples con números del 1 al 9, ej: 3+4, 2+7" },
    { unit: matUnit1._id, name: "Resta de un dígito",         order: 2, type: "lesson",     xpReward: 10, questionCount: 5, difficulty: "beginner",     aiTopicHint: "Restas simples con números del 1 al 9, ej: 7-3, 9-5" },
    { unit: matUnit1._id, name: "Suma y Resta de un dígito",  order: 3, type: "lesson",     xpReward: 15, questionCount: 5, difficulty: "beginner",     aiTopicHint: "Mezcla de sumas y restas con números del 1 al 9" },
    { unit: matUnit1._id, name: "Checkpoint",                 order: 4, type: "checkpoint", xpReward: 25, questionCount: 8, difficulty: "beginner",     aiTopicHint: "Repaso de sumas y restas de un dígito" },
  ]);

  await Question.insertMany([
    { lesson: matU1Lessons[0]._id, type: "multiple_choice", prompt: "¿Cuánto es 3 + 4?", difficulty: "easy", xpValue: 2, explanation: "3 + 4 = 7. Contá 3 y seguí 4 más: 4, 5, 6, 7.", hint: "Contá desde el número más grande y agregá el otro de a uno.", conceptExplanation: "La suma une dos grupos. Si tenés 2 objetos y agregás 3 más, contás todos juntos. Por ejemplo: 2 + 3 = 5.", tags: ["suma", "un dígito"],
      options: [{ text: "6", isCorrect: false }, { text: "7", isCorrect: true }, { text: "8", isCorrect: false }, { text: "5", isCorrect: false }] },
    { lesson: matU1Lessons[0]._id, type: "true_false", prompt: "2 + 5 = 8", difficulty: "easy", xpValue: 2, explanation: "2 + 5 = 7, no 8.", hint: "Contá desde el 5 y agregá 2 más.", conceptExplanation: "Para verificar una suma, podés contar con los dedos o dibujar puntos. Suma los dos grupos y contá el total.", tags: ["suma"], correctBoolean: false },
    { lesson: matU1Lessons[0]._id, type: "fill_blank", prompt: "1 + ___ = 9", difficulty: "easy", xpValue: 2, explanation: "9 - 1 = 8, entonces el número faltante es 8.", hint: "Pensá cuánto le falta al 1 para llegar al 9.", conceptExplanation: "Cuando falta un número en una suma, restá el número conocido al resultado. Ejemplo: si 2 + ___ = 6, entonces 6 - 2 = 4.", tags: ["suma"], correctAnswers: ["8", "ocho"] },
    { lesson: matU1Lessons[0]._id, type: "multiple_choice", prompt: "¿Cuánto es 6 + 3?", difficulty: "easy", xpValue: 2, explanation: "6 + 3 = 9.", hint: "Partí del 6 y contá 3 números más hacia adelante.", conceptExplanation: "La suma es contar hacia adelante. Empezá desde el número más grande para que sea más fácil.", tags: ["suma"],
      options: [{ text: "8", isCorrect: false }, { text: "10", isCorrect: false }, { text: "9", isCorrect: true }, { text: "7", isCorrect: false }] },
    { lesson: matU1Lessons[0]._id, type: "sentence_builder", prompt: "La suma de 4 + 4 es igual a ___", difficulty: "easy", xpValue: 3, explanation: "4 + 4 = 8.", hint: "Cuatro más cuatro: contá cuatro dos veces.", conceptExplanation: "Sumar un número consigo mismo es lo mismo que multiplicarlo por 2. Ejemplo: 3 + 3 = 6.", tags: ["suma"],
      wordBank: ["8", "6", "9", "7"], correctAnswers: ["8"] },
  ]);

  const matUnit2 = await Unit.create({ subject: matematica._id, name: "Matemáticas Básicas 2", icon: "🔟", order: 2, requiredXP: 30 });
  await Lesson.insertMany([
    { unit: matUnit2._id, name: "Suma de dos dígitos",         order: 1, type: "lesson",     xpReward: 15, questionCount: 6, difficulty: "beginner",     aiTopicHint: "Sumas con números del 10 al 99, ej: 12+23, 34+45" },
    { unit: matUnit2._id, name: "Resta de dos dígitos",        order: 2, type: "lesson",     xpReward: 15, questionCount: 6, difficulty: "beginner",     aiTopicHint: "Restas con números del 10 al 99, ej: 45-23, 78-34" },
    { unit: matUnit2._id, name: "Suma y Resta de dos dígitos", order: 3, type: "lesson",     xpReward: 20, questionCount: 6, difficulty: "beginner",     aiTopicHint: "Mezcla de sumas y restas con números de dos dígitos" },
    { unit: matUnit2._id, name: "Checkpoint",                  order: 4, type: "checkpoint", xpReward: 30, questionCount: 8, difficulty: "beginner",     aiTopicHint: "Repaso de sumas y restas de dos dígitos" },
  ]);

  const matUnit3 = await Unit.create({ subject: matematica._id, name: "Matemáticas Básicas 3", icon: "✖️", order: 3, requiredXP: 80 });
  await Lesson.insertMany([
    { unit: matUnit3._id, name: "Multiplicación de un dígito",            order: 1, type: "lesson",     xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "Tablas del 1 al 9, ej: 3×4, 7×2" },
    { unit: matUnit3._id, name: "División de un dígito",                  order: 2, type: "lesson",     xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "Divisiones exactas simples, ej: 8÷2, 9÷3" },
    { unit: matUnit3._id, name: "Multiplicación y División de un dígito", order: 3, type: "lesson",     xpReward: 20, questionCount: 6, difficulty: "intermediate", aiTopicHint: "Mezcla de multiplicaciones y divisiones de un dígito" },
    { unit: matUnit3._id, name: "Checkpoint",                             order: 4, type: "checkpoint", xpReward: 35, questionCount: 10, difficulty: "intermediate", aiTopicHint: "Repaso de multiplicación y división de un dígito" },
  ]);

  // ── LENGUA BÁSICA ────────────────────────────────────────────
  const lenguaBasica = await Subject.create({
    name: "Lengua Básica",
    slug: "lengua-basica",
    description: "Método fonético-silábico completo basado en la Cartilla Nacho.",
    icon: "📚",
    color: "#10b981",
    order: 2,
    aiPromptContext: "Materia de alfabetización inicial para niños. Sigue la progresión de la Cartilla Nacho. Usá palabras simples, cotidianas y apropiadas para niños. Usá artículos gramaticalmente correctos en español (la miel, el mono, la mano, el mapa). Las preguntas deben ayudar a reconocer letras, sílabas y palabras.",
  });

  // Unidad 1
  const lenUnit1 = await Unit.create({ subject: lenguaBasica._id, name: "Mis Primeras Letras", icon: "🅰️", order: 1, requiredXP: 0 });
  const lenU1Lessons = await Lesson.insertMany([
    { unit: lenUnit1._id, name: "Las Vocales",    order: 1, type: "lesson",     xpReward: 10, questionCount: 5, difficulty: "beginner", aiTopicHint: "a, e, i, o, u. Palabras: ala, eje, imán, oso, uva." },
    { unit: lenUnit1._id, name: "La letra M",     order: 2, type: "lesson",     xpReward: 10, questionCount: 5, difficulty: "beginner", aiTopicHint: "ma, me, mi, mo, mu. Frase: Mi mamá me mima." },
    { unit: lenUnit1._id, name: "La letra P",     order: 3, type: "lesson",     xpReward: 10, questionCount: 5, difficulty: "beginner", aiTopicHint: "pa, pe, pi, po, pu. Palabras: papá, pipa, pomo, mapa." },
    { unit: lenUnit1._id, name: "La letra S",     order: 4, type: "lesson",     xpReward: 10, questionCount: 5, difficulty: "beginner", aiTopicHint: "sa, se, si, so, su. Palabras: sapo, sopa, esa mesa." },
    { unit: lenUnit1._id, name: "Checkpoint 1",   order: 5, type: "checkpoint", xpReward: 25, questionCount: 8, difficulty: "beginner", aiTopicHint: "Repaso M, P, S." },
  ]);

  // Preguntas seed "Las Vocales"
  await Question.insertMany([
    { lesson: lenU1Lessons[0]._id, type: "multiple_choice", prompt: "¿Cuál de estas es una vocal?", difficulty: "easy", xpValue: 2,
      explanation: "La A es una vocal. Las vocales son: a, e, i, o, u.", hint: "Las vocales se pueden pronunciar solas, sin necesidad de otra letra.", conceptExplanation: "Las vocales son las letras más importantes del español: A, E, I, O, U. Con ellas se forman todas las palabras.", tags: ["vocales", "letras"],
      options: [{ text: "M", isCorrect: false }, { text: "A", isCorrect: true }, { text: "P", isCorrect: false }, { text: "S", isCorrect: false }] },
    { lesson: lenU1Lessons[0]._id, type: "true_false", prompt: "La letra O es una vocal.", difficulty: "easy", xpValue: 2,
      explanation: "Sí, la O es una de las 5 vocales: a, e, i, o, u.", hint: "Recordá las 5 vocales: a, e, i, o, u.", conceptExplanation: "Hay 5 vocales en el español: A, E, I, O, U. Todas las demás letras son consonantes.", tags: ["vocales"], correctBoolean: true },
    { lesson: lenU1Lessons[0]._id, type: "sentence_builder", prompt: "Las vocales son: a, e, ___, o, u", difficulty: "easy", xpValue: 3,
      explanation: "La vocal que falta es la I.", hint: "Recitá las vocales en orden para encontrar la que falta.", conceptExplanation: "Las 5 vocales en orden son: A - E - I - O - U. Cada una tiene un sonido distinto.", tags: ["vocales"],
      wordBank: ["i", "m", "p", "s"], correctAnswers: ["i"] },
    { lesson: lenU1Lessons[0]._id, type: "fill_blank", prompt: "La palabra 'oso' tiene ___ vocales.", difficulty: "easy", xpValue: 2,
      explanation: "O-S-O tiene dos vocales: O y O.", hint: "Contá solo las letras a, e, i, o, u en la palabra.", conceptExplanation: "Para contar vocales en una palabra, buscá solo las letras: a, e, i, o, u. El resto son consonantes.", tags: ["vocales"], correctAnswers: ["2", "dos"] },
    { lesson: lenU1Lessons[0]._id, type: "multiple_choice", prompt: "¿Qué vocal suena en la palabra 'uva'?", difficulty: "easy", xpValue: 2,
      explanation: "Uva empieza con la vocal U.", hint: "Pronunciá la palabra lentamente y escuchá el primer sonido.", conceptExplanation: "Cada palabra empieza con una letra. Para saber cuál es, pronunciá la palabra despacio y escuchá el primer sonido.", tags: ["vocales"],
      options: [{ text: "A", isCorrect: false }, { text: "E", isCorrect: false }, { text: "I", isCorrect: false }, { text: "U", isCorrect: true }] },
  ]);

  // Unidad 2
  const lenUnit2 = await Unit.create({ subject: lenguaBasica._id, name: "Pequeños Lectores", icon: "📝", order: 2, requiredXP: 100 });
  await Lesson.insertMany([
    { unit: lenUnit2._id, name: "La letra L", order: 1, type: "lesson",     xpReward: 10, questionCount: 5, difficulty: "beginner",     aiTopicHint: "la, le, li, lo, lu. Palabras: loma, lupa, paloma." },
    { unit: lenUnit2._id, name: "La letra T", order: 2, type: "lesson",     xpReward: 10, questionCount: 5, difficulty: "beginner",     aiTopicHint: "ta, te, ti, to, tu. Palabras: tomate, tela, moto." },
    { unit: lenUnit2._id, name: "La letra N", order: 3, type: "lesson",     xpReward: 10, questionCount: 5, difficulty: "beginner",     aiTopicHint: "na, ne, ni, no, nu. Palabras: nene, pino, luna, niña." },
    { unit: lenUnit2._id, name: "La letra D", order: 4, type: "lesson",     xpReward: 10, questionCount: 5, difficulty: "beginner",     aiTopicHint: "da, de, di, do, du. Palabras: dedo, dama, duda, todo." },
    { unit: lenUnit2._id, name: "Checkpoint 2", order: 5, type: "checkpoint", xpReward: 25, questionCount: 8, difficulty: "beginner",  aiTopicHint: "Repaso de L, T, N, D." },
  ]);

  // Unidad 3
  const lenUnit3 = await Unit.create({ subject: lenguaBasica._id, name: "Sonidos Fuertes y Suaves", icon: "🔔", order: 3, requiredXP: 250 });
  await Lesson.insertMany([
    { unit: lenUnit3._id, name: "La letra R (Fuerte)",   order: 1, type: "lesson", xpReward: 15, questionCount: 6, difficulty: "beginner",     aiTopicHint: "ra, re, ri, ro, ru al inicio. Rosa, ropa, rata." },
    { unit: lenUnit3._id, name: "La RR y R suave",       order: 2, type: "lesson", xpReward: 15, questionCount: 6, difficulty: "beginner",     aiTopicHint: "perro, carro vs pera, loro, mora." },
    { unit: lenUnit3._id, name: "La letra B",             order: 3, type: "lesson", xpReward: 15, questionCount: 6, difficulty: "beginner",     aiTopicHint: "ba, be, bi, bo, bu. Palabras: bota, lobo, nube." },
    { unit: lenUnit3._id, name: "La letra V",             order: 4, type: "lesson", xpReward: 15, questionCount: 6, difficulty: "beginner",     aiTopicHint: "va, ve, vi, vo, vu. Palabras: vaso, uva, vela, vino." },
  ]);

  // Unidad 4
  const lenUnit4 = await Unit.create({ subject: lenguaBasica._id, name: "Letras Mágicas", icon: "🪄", order: 4, requiredXP: 450 });
  await Lesson.insertMany([
    { unit: lenUnit4._id, name: "La letra C (ca, co, cu)", order: 1, type: "lesson", xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "casa, coco, cuna, cama." },
    { unit: lenUnit4._id, name: "La letra Q (que, qui)",   order: 2, type: "lesson", xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "queso, quitasol, paquete." },
    { unit: lenUnit4._id, name: "La letra G (ga, go, gu)", order: 3, type: "lesson", xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "gato, gota, gusano, mago." },
    { unit: lenUnit4._id, name: "La letra J",              order: 4, type: "lesson", xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "ja, je, ji, jo, ju. Palabras: jarra, jefe, ojo." },
  ]);

  // Unidad 5
  const lenUnit5 = await Unit.create({ subject: lenguaBasica._id, name: "Sonidos del Corazón", icon: "❤️", order: 5, requiredXP: 700 });
  await Lesson.insertMany([
    { unit: lenUnit5._id, name: "La letra H (Muda)", order: 1, type: "lesson", xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "ha, he, hi, ho, hu. Helado, hoja, humo." },
    { unit: lenUnit5._id, name: "La letra Ch",       order: 2, type: "lesson", xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "cha, che, chi, cho, chu. Chupete, choza, leche." },
    { unit: lenUnit5._id, name: "La letra Ll",       order: 3, type: "lesson", xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "lla, lle, lli, llo, llu. Llave, silla, pollo." },
    { unit: lenUnit5._id, name: "La letra Ñ",        order: 4, type: "lesson", xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "ña, ñe, ñi, ño, ñu. Piña, niña, año, puño." },
  ]);

  // Unidad 6
  const lenUnit6 = await Unit.create({ subject: lenguaBasica._id, name: "Tesoro de Palabras", icon: "💎", order: 6, requiredXP: 1000 });
  await Lesson.insertMany([
    { unit: lenUnit6._id, name: "La letra F",         order: 1, type: "lesson", xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "fa, fe, fi, fo, fu. Foca, café, sofá, fino." },
    { unit: lenUnit6._id, name: "La Z y C (ce, ci)",  order: 2, type: "lesson", xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "zapato, taza, cena, cine." },
    { unit: lenUnit6._id, name: "La letra Y",         order: 3, type: "lesson", xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "ya, ye, yi, yo, yu. Yate, raya, yema." },
    { unit: lenUnit6._id, name: "Letras X, K, W",     order: 4, type: "lesson", xpReward: 15, questionCount: 6, difficulty: "intermediate", aiTopicHint: "examen, taxi, kilo, karate, waterpolo." },
  ]);

  // Unidad 7
  const lenUnit7 = await Unit.create({ subject: lenguaBasica._id, name: "Palabras Saltimbanquis", icon: "🤸", order: 7, requiredXP: 1400 });
  await Lesson.insertMany([
    { unit: lenUnit7._id, name: "Combinaciones con L (Bl, Cl, Fl)", order: 1, type: "lesson", xpReward: 20, questionCount: 6, difficulty: "advanced", aiTopicHint: "blanco, clavo, flaco." },
    { unit: lenUnit7._id, name: "Combinaciones con L (Gl, Pl)",     order: 2, type: "lesson", xpReward: 20, questionCount: 6, difficulty: "advanced", aiTopicHint: "globo, regla, plato, pluma." },
    { unit: lenUnit7._id, name: "Oraciones Complejas",              order: 3, type: "lesson", xpReward: 20, questionCount: 6, difficulty: "advanced", aiTopicHint: "El clavo es de hierro. La blusa es blanca." },
  ]);

  // Unidad 8
  const lenUnit8 = await Unit.create({ subject: lenguaBasica._id, name: "Maestro de la Lectura", icon: "🎓", order: 8, requiredXP: 1800 });
  await Lesson.insertMany([
    { unit: lenUnit8._id, name: "Combinaciones con R (Br, Cr, Fr)",    order: 1, type: "lesson",     xpReward: 20, questionCount: 6, difficulty: "advanced", aiTopicHint: "brazo, crema, fresa." },
    { unit: lenUnit8._id, name: "Combinaciones con R (Gr, Pr, Tr, Dr)",order: 2, type: "lesson",     xpReward: 20, questionCount: 6, difficulty: "advanced", aiTopicHint: "grillo, prado, tren, dragón." },
    { unit: lenUnit8._id, name: "Comprensión Lectora Final",           order: 3, type: "lesson",     xpReward: 25, questionCount: 8, difficulty: "advanced", aiTopicHint: "Textos cortos de la parte final de Nacho." },
    { unit: lenUnit8._id, name: "EXAMEN FINAL",                       order: 4, type: "checkpoint", xpReward: 50, questionCount: 15, difficulty: "advanced", aiTopicHint: "Repaso de toda la cartilla." },
  ]);

  // ── LOGROS ───────────────────────────────────────────────────
  await Achievement.insertMany([
    { key: "first_lesson",  name: "¡Primera lección!", description: "Completaste tu primera lección",       icon: "🎉", category: "milestone",   condition: { type: "lessons_completed", threshold: 1   }, reward: { xp: 10, gems: 5  }, rarity: "common"   },
    { key: "lessons_5",     name: "En racha",           description: "Completaste 5 lecciones",              icon: "🔥", category: "milestone",   condition: { type: "lessons_completed", threshold: 5   }, reward: { xp: 20, gems: 10 }, rarity: "common"   },
    { key: "lessons_10",    name: "Dedicado",            description: "Completaste 10 lecciones",             icon: "💪", category: "milestone",   condition: { type: "lessons_completed", threshold: 10  }, reward: { xp: 30, gems: 15 }, rarity: "rare"     },
    { key: "perfect_score", name: "¡Perfecto!",          description: "Obtuviste 100% en una lección",        icon: "⭐", category: "performance", condition: { type: "perfect_lessons",   threshold: 1   }, reward: { xp: 15, gems: 10 }, rarity: "rare"     },
    { key: "streak_3",      name: "3 días seguidos",     description: "Estudiaste 3 días consecutivos",       icon: "📅", category: "streak",      condition: { type: "streak_days",       threshold: 3   }, reward: { xp: 20, gems: 10 }, rarity: "common"   },
    { key: "streak_7",      name: "Una semana",           description: "Estudiaste 7 días consecutivos",       icon: "🗓️", category: "streak",      condition: { type: "streak_days",       threshold: 7   }, reward: { xp: 50, gems: 25 }, rarity: "epic"     },
    { key: "xp_100",        name: "Centenario",           description: "Acumulaste 100 XP",                    icon: "💯", category: "milestone",   condition: { type: "total_xp",          threshold: 100 }, reward: { xp: 10, gems: 5  }, rarity: "common"   },
    { key: "nacho_start",   name: "Cartilla Nacho",       description: "Completaste tu primera lección de Lengua Básica", icon: "📚", category: "milestone", condition: { type: "lessons_completed", threshold: 1 }, reward: { xp: 15, gems: 8 }, rarity: "common" },
  ]);

  console.log("✅ Seed completado:");
  console.log("   📐 Matemática: 3 unidades, 12 lecciones");
  console.log("   📚 Lengua Básica: 8 unidades, 27 lecciones (Cartilla Nacho)");
  console.log("   🏆 8 logros");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});