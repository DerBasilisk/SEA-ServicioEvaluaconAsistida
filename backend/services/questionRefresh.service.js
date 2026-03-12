const Question = require("../models/question");
const UserProgress = require("../models/userProgress");
const { generateQuestions } = require("./ai.service");

const MAX_SHOWN = 3;

/**
 * Revisa las preguntas vistas por el usuario en una lección
 * y regenera las que superaron el límite de apariciones.
 * Se ejecuta en segundo plano — no bloquea la respuesta.
 */
async function refreshStaleQuestions(userId, lesson, unit, subject) {
  try {
    const progress = await UserProgress.findOne({ user: userId, lesson: lesson._id });
    if (!progress) return;

    // IDs de preguntas que ya se mostraron MAX_SHOWN o más veces
    const stale = (progress.seenQuestions || [])
      .filter((sq) => sq.timesShown >= MAX_SHOWN)
      .map((sq) => sq.question.toString());

    if (stale.length === 0) return;

    // Generar 3 preguntas nuevas para reemplazar las viejas
    const toGenerate = Math.min(stale.length, 3);

    const aiQuestions = await generateQuestions({
      subjectName: subject.name,
      unitName: unit.name,
      lessonName: lesson.name,
      topicHint: lesson.aiTopicHint || lesson.name,
      difficulty: lesson.difficulty,
      subjectContext: subject.aiPromptContext,
      count: toGenerate,
    });

    // Guardar nuevas preguntas
    await Question.insertMany(
      aiQuestions.map((q) => ({
        ...q,
        lesson: lesson._id,
        isReviewed: true,
        isActive: true,
      }))
    );

    // Desactivar las preguntas viejas (no borrar, solo ocultar)
    await Question.updateMany(
      { _id: { $in: stale } },
      { isActive: false }
    );

    // Limpiar seenQuestions de las desactivadas
    await UserProgress.updateMany(
      { lesson: lesson._id },
      { $pull: { seenQuestions: { question: { $in: stale } } } }
    );

    console.log(`[questionRefresh] Regeneradas ${toGenerate} preguntas para lección ${lesson.name}`);
  } catch (err) {
    console.error("[questionRefresh] Error:", err.message);
  }
}

/**
 * Registra qué preguntas se mostraron en esta sesión.
 */
async function recordShownQuestions(userId, lessonId, questionIds) {
  try {
    for (const qId of questionIds) {
      // Intentar incrementar si ya existe
      const updated = await UserProgress.findOneAndUpdate(
  { user: userId, lesson: lessonId, "seenQuestions.question": qId },
  { $inc: { "seenQuestions.$.timesShown": 1 } },
  { strict: false }
);

if (!updated) {
  await UserProgress.findOneAndUpdate(
    { user: userId, lesson: lessonId },
    { $push: { seenQuestions: { question: qId, timesShown: 1 } } },
    { strict: false }
  );
}
    }
  } catch (err) {
    console.error("[questionRefresh] Error registrando preguntas:", err.message);
  }
}

module.exports = { refreshStaleQuestions, recordShownQuestions };