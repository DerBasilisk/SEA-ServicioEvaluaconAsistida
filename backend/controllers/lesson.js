const { Lesson, Question, UserProgress, User, Streak, Leaderboard, Achievement } = require("../models");
const { generateQuestions } = require("../services/ai.service");
const { checkAndGrantAchievements } = require("../services/achievement.service");

// ── Helpers ────────────────────────────────────────────────────

/**
 * Desbloquea la siguiente lección cuando se completa una
 */
const unlockNextLesson = async (userId, completedLesson) => {
  const nextLesson = await Lesson.findOne({
    unit: completedLesson.unit,
    order: completedLesson.order + 1,
    isActive: true,
  });

  if (nextLesson) {
    await UserProgress.findOneAndUpdate(
      { user: userId, lesson: nextLesson._id },
      { $setOnInsert: { status: "available" } },
      { upsert: true, new: true }
    );
  }
};

// ── Controladores ──────────────────────────────────────────────

// GET /api/lessons/:id
// Detalle de una lección (sin preguntas, solo metadata)
const getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate({
      path: "unit",
      populate: { path: "subject", select: "name color icon" },
    });

    if (!lesson || !lesson.isActive) {
      return res.status(404).json({ ok: false, message: "Lección no encontrada" });
    }

    const progress = await UserProgress.findOne({
      user: req.user._id,
      lesson: lesson._id,
    });

    res.json({
      ok: true,
      data: {
        ...lesson.toJSON(),
        status: progress?.status || "locked",
        bestScore: progress?.bestScore || 0,
        completions: progress?.completions || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// POST /api/lessons/:id/start
// Inicia una sesión de práctica — devuelve las preguntas mezcladas
const startLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate({
      path: "unit",
      populate: { path: "subject" },
    });

    if (!lesson || !lesson.isActive) {
      return res.status(404).json({ ok: false, message: "Lección no encontrada" });
    }

    // Verificar que la lección esté disponible para el usuario
    let progress = await UserProgress.findOne({
      user: req.user._id,
      lesson: lesson._id,
    });

    if (progress && progress.status === "locked") {
      return res.status(403).json({ ok: false, message: "Lección bloqueada" });
    }

    // Si es la primera lección de la unidad, siempre está disponible
    if (!progress) {
      if (lesson.order !== 1) {
        return res.status(403).json({ ok: false, message: "Lección bloqueada" });
      }
      progress = new UserProgress({ user: req.user._id, lesson: lesson._id, status: "available" });
    }

    // Si es lección generada por IA, crear preguntas al vuelo
    let questions;
    if (lesson.type === "ai_generated") {
      const subject = lesson.unit.subject;
      const unit = lesson.unit;

      const aiQuestions = await generateQuestions({
        subjectName: subject.name,
        unitName: unit.name,
        lessonName: lesson.name,
        topicHint: lesson.aiTopicHint,
        difficulty: lesson.difficulty,
        subjectContext: subject.aiPromptContext,
        count: lesson.questionCount,
      });

      // Guardar las preguntas generadas y marcarlas como activas para esta sesión
      const savedQuestions = await Question.insertMany(
        aiQuestions.map((q) => ({ ...q, lesson: lesson._id, isReviewed: true, isActive: true }))
      );
      questions = savedQuestions;
    } else {
      // Obtener preguntas normales (mezcla de dificultades según el tipo de lección)
      questions = await Question.find({
        lesson: lesson._id,
        isActive: true,
        ...(lesson.type === "checkpoint" ? {} : {}),
      }).select("-__v");

      // Mezclar y limitar cantidad
      questions = questions
        .sort(() => Math.random() - 0.5)
        .slice(0, lesson.questionCount);
    }

    if (questions.length === 0) {
      return res.status(400).json({ ok: false, message: "Esta lección no tiene preguntas activas" });
    }

    // Iniciar sesión en el registro de progreso
    const user = await User.findById(req.user._id);
    progress.startSession(user.hearts.current);
    await progress.save();

    // Sanear preguntas para el cliente (ocultar respuestas correctas)
    const sanitizedQuestions = questions.map((q) => {
      const obj = q.toJSON ? q.toJSON() : q;
      // Mezclar opciones de multiple_choice
      if (obj.type === "multiple_choice" && obj.options) {
        obj.options = obj.options
          .map((o) => ({ _id: o._id, text: o.text })) // ocultar isCorrect
          .sort(() => Math.random() - 0.5);
      }
      // Mezclar items de order_items
      if (obj.type === "order_items" && obj.items) {
        obj.shuffledItems = [...obj.items].sort(() => Math.random() - 0.5);
        delete obj.items; // no revelar el orden correcto
      }
      // Mezclar pares de match_pairs
      if (obj.type === "match_pairs" && obj.pairs) {
        obj.leftItems = obj.pairs.map((p) => ({ _id: p._id, text: p.left })).sort(() => Math.random() - 0.5);
        obj.rightItems = obj.pairs.map((p) => ({ _id: p._id, text: p.right })).sort(() => Math.random() - 0.5);
        delete obj.pairs;
      }
      // Eliminar campos con respuestas
      delete obj.correctBoolean;
      delete obj.correctAnswers;
      delete obj.isCorrect;
      return obj;
    });

    res.json({
      ok: true,
      data: {
        lesson: {
          _id: lesson._id,
          name: lesson.name,
          xpReward: lesson.xpReward,
          timeLimit: lesson.timeLimit,
          type: lesson.type,
        },
        questions: sanitizedQuestions,
        totalQuestions: sanitizedQuestions.length,
        hearts: user.hearts.current,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// POST /api/lessons/:id/answer
// Evalúa UNA respuesta y devuelve feedback inmediato (estilo Duolingo)
const answerQuestion = async (req, res) => {
  try {
    const { questionId, answer } = req.body;

    if (!questionId || answer === undefined) {
      return res.status(400).json({ ok: false, message: "questionId y answer son requeridos" });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ ok: false, message: "Pregunta no encontrada" });
    }

    // ── Evaluar respuesta según tipo ──────────────────────────
    let isCorrect = false;
    let correctAnswer = null;

    switch (question.type) {
      case "multiple_choice": {
        const correctOption = question.options.find((o) => o.isCorrect);
        isCorrect = correctOption?._id.toString() === answer;
        correctAnswer = correctOption
          ? { id: correctOption._id, text: correctOption.text }
          : null;
        break;
      }
      case "true_false": {
        isCorrect = question.correctBoolean === (answer === true || answer === "true");
        correctAnswer = question.correctBoolean;
        break;
      }
      case "fill_blank": {
        const userAns = String(answer).trim();
        const accepted = question.caseSensitive
          ? question.correctAnswers
          : question.correctAnswers.map((a) => a.toLowerCase());
        const compare = question.caseSensitive ? userAns : userAns.toLowerCase();
        isCorrect = accepted.includes(compare);
        correctAnswer = question.correctAnswers[0];
        break;
      }
      case "order_items": {
        const userOrder = Array.isArray(answer) ? answer : [];
        isCorrect =
          JSON.stringify(userOrder) === JSON.stringify(question.items);
        correctAnswer = question.items;
        break;
      }
      case "match_pairs": {
        // answer = [{leftId, rightId}, ...]
        const userPairs = Array.isArray(answer) ? answer : [];
        isCorrect = userPairs.every((up) => {
          const pair = question.pairs.find((p) => p._id.toString() === up.leftId);
          return pair && pair._id.toString() === up.rightId;
        }) && userPairs.length === question.pairs.length;
        correctAnswer = question.pairs;
        break;
      }
    }

    // ── Actualizar progreso y vidas ───────────────────────────
    const progress = await UserProgress.findOne({
      user: req.user._id,
      lesson: req.params.id,
    });

    if (progress) {
      progress.recordAttempt(questionId, isCorrect);
      await progress.save();
    }

    let heartsRemaining = null;
    if (!isCorrect) {
      const user = await User.findById(req.user._id);
      heartsRemaining = user.loseHeart();
      await user.save();
    }

    res.json({
      ok: true,
      data: {
        isCorrect,
        correctAnswer,
        explanation: question.explanation,
        heartsRemaining,
        xpEarned: isCorrect ? question.xpValue : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// POST /api/lessons/:id/complete
// Finaliza la sesión, otorga XP, actualiza racha y logros
const completeLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ ok: false, message: "Lección no encontrada" });
    }

    const progress = await UserProgress.findOne({
      user: req.user._id,
      lesson: lesson._id,
    });

    if (!progress || progress.status !== "in_progress") {
      return res.status(400).json({ ok: false, message: "No hay sesión activa para esta lección" });
    }

    const score = progress.calculateSessionScore();
    const isPerfect = score === 100;

    // XP base + bonus por perfección
    const xpEarned = isPerfect
      ? Math.round(lesson.xpReward * 1.5)
      : lesson.xpReward;

    // Completar sesión
    progress.completeSession(xpEarned);
    await progress.save();

    // Actualizar XP y nivel del usuario
    const user = await User.findById(req.user._id);
    const { leveledUp, newLevel } = user.addXP(xpEarned);
    user.gems += isPerfect ? lesson.gemsReward + 5 : lesson.gemsReward;
    await user.save();

    // Actualizar racha
    let streak = await Streak.findOne({ user: req.user._id });
    if (!streak) streak = new Streak({ user: req.user._id });
    streak.recordActivity(xpEarned, user.dailyGoal);
    await streak.save();

    // Actualizar leaderboard
    await Leaderboard.addXP(req.user._id, xpEarned);

    // Desbloquear siguiente lección
    await unlockNextLesson(req.user._id, lesson);

    // Verificar logros
    const newAchievements = await checkAndGrantAchievements(user, streak, progress);

    // Refill de corazones si se vaciaron y pasó suficiente tiempo
    if (user.hearts.current === 0) {
      const minutesSinceRefill =
        (Date.now() - user.hearts.lastRefill) / 1000 / 60;
      if (minutesSinceRefill >= 30) {
        user.refillHearts();
        await user.save();
      }
    }

    res.json({
      ok: true,
      data: {
        score,
        isPerfect,
        xpEarned,
        leveledUp,
        newLevel: leveledUp ? newLevel : null,
        newStreak: streak.current,
        newAchievements,
        hearts: user.hearts.current,
        totalXP: user.xp,
        gems: user.gems,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// POST /api/lessons/:id/abandon
// El usuario abandona la lección a mitad (pierde progreso de la sesión)
const abandonLesson = async (req, res) => {
  try {
    await UserProgress.findOneAndUpdate(
      { user: req.user._id, lesson: req.params.id, status: "in_progress" },
      {
        status: "available",
        "currentSession.startedAt": null,
        "currentSession.attempts": [],
      }
    );
    res.json({ ok: true, message: "Lección abandonada" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// GET /api/lessons/review
// Devuelve lecciones que necesitan repaso espaciado hoy
const getLessonsForReview = async (req, res) => {
  try {
    const today = new Date();
    const reviewProgress = await UserProgress.find({
      user: req.user._id,
      status: "completed",
      "spacedRepetition.nextReviewDate": { $lte: today },
    })
      .populate("lesson", "name xpReward unit")
      .limit(10);

    res.json({
      ok: true,
      data: reviewProgress.map((p) => ({
        lesson: p.lesson,
        nextReviewDate: p.spacedRepetition.nextReviewDate,
        repetitions: p.spacedRepetition.repetitions,
      })),
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

module.exports = {
  getLessonById,
  startLesson,
  answerQuestion,
  completeLesson,
  abandonLesson,
  getLessonsForReview,
};
