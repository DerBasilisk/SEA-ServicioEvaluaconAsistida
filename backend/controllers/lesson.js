const { Lesson, Question, UserProgress, User, Streak, Leaderboard } = require("../models");
const { generateQuestions, evaluateFillBlankAnswer } = require("../services/ai.service");
const { checkAndGrantAchievements } = require("../services/achievement.service");
const { getAdaptiveConfig, selectQuestions, getAdaptiveXPReward } = require("../services/adaptive.service");
const { refreshStaleQuestions, recordShownQuestions } = require("../services/questionrefresh.service");

const unlockNextLesson = async (userId, completedLesson) => {
  // Verificar cuántas veces completó esta lección
  const currentProgress = await UserProgress.findOne({
    user: userId,
    lesson: completedLesson._id,
  });

  if (!currentProgress || currentProgress.completions < 4) return;

  const nextLesson = await Lesson.findOne({
    unit: completedLesson.unit,
    order: completedLesson.order + 1,
    isActive: true,
  });
  if (nextLesson) {
    await UserProgress.findOneAndUpdate(
      { user: userId, lesson: nextLesson._id },
      { $setOnInsert: { status: "available" } },
      { upsert: true, returnDocument: "after" }
    );
  }
};

const getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate({
      path: "unit",
      populate: { path: "subject", select: "name color icon" },
    });
    if (!lesson || !lesson.isActive) {
      return res.status(404).json({ ok: false, message: "Lección no encontrada" });
    }
    const progress = await UserProgress.findOne({ user: req.usuario._id, lesson: lesson._id });
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

const startLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate({
      path: "unit",
      populate: { path: "subject" },
    });
    if (!lesson || !lesson.isActive) {
      return res.status(404).json({ ok: false, message: "Lección no encontrada" });
    }

    let progress = await UserProgress.findOne({ user: req.usuario._id, lesson: lesson._id });
    if (progress && progress.status === "locked") {
      return res.status(403).json({ ok: false, message: "Lección bloqueada" });
    }
    if (!progress) {
      if (lesson.order !== 1) {
        return res.status(403).json({ ok: false, message: "Lección bloqueada" });
      }
      progress = new UserProgress({ user: req.usuario._id, lesson: lesson._id, status: "available" });
    }

    // Configuración adaptativa
    const adaptiveConfig = await getAdaptiveConfig(req.usuario._id, lesson);

    let questions;

    if (lesson.type === "ai_generated") {
      const aiQuestions = await generateQuestions({
        subjectName: lesson.unit.subject.name,
        unitName: lesson.unit.name,
        lessonName: lesson.name,
        topicHint: lesson.aiTopicHint,
        difficulty: adaptiveConfig.difficulty,
        subjectContext: lesson.unit.subject.aiPromptContext,
        count: adaptiveConfig.questionCount,
      });
      const saved = await Question.insertMany(
        aiQuestions.map((q) => ({ ...q, lesson: lesson._id, isReviewed: true, isActive: true }))
      );
      questions = saved;
    } else {
      let allQuestions = await Question.find({ lesson: lesson._id, isActive: true, isReviewed: true }).select("-__v");

      if (allQuestions.length < adaptiveConfig.questionCount) {
  // Generar las preguntas que faltan
  const needed = adaptiveConfig.questionCount - allQuestions.length;
  try {
    const aiQuestions = await generateQuestions({
      subjectName: lesson.unit.subject.name,
      unitName: lesson.unit.name,
      lessonName: lesson.name,
      topicHint: lesson.aiTopicHint || lesson.name,
      difficulty: adaptiveConfig.difficulty,
      subjectContext: lesson.unit.subject.aiPromptContext,
      count: needed,
    });
    const saved = await Question.insertMany(
      aiQuestions.map((q) => ({ ...q, lesson: lesson._id, isReviewed: true, isActive: true }))
    );
    allQuestions = [...allQuestions, ...saved];
  } catch (err) {
    console.error("Error generando preguntas adicionales:", err.message);
    // Si falla la IA, continuar con las que hay
  }
}

    questions = selectQuestions(allQuestions, adaptiveConfig.questionCount, adaptiveConfig.easyRatio, adaptiveConfig.hardRatio);
    }

    if (questions.length === 0) {
      return res.status(400).json({ ok: false, message: "Esta lección no tiene preguntas" });
    }

    const user = await User.findById(req.usuario._id);
    await UserProgress.findOneAndUpdate(
      { user: req.usuario._id, lesson: lesson._id },
      {
        $set: {
          status: "in_progress",
          "currentSession.startedAt": new Date(),
          "currentSession.heartsAtStart": user.hearts.current,
          "currentSession.attempts": [],
          "currentSession.adaptiveConfig": adaptiveConfig,
        },
      },
      { upsert: true }
    );

    const sanitizedQuestions = questions.map((q) => {
      const obj = q.toJSON ? q.toJSON() : { ...q };
      if (obj.type === "multiple_choice" && obj.options) {
        obj.options = obj.options.map((o) => ({ _id: o._id, text: o.text })).sort(() => Math.random() - 0.5);
      }
      if (obj.type === "order_items" && obj.items) {
        obj.shuffledItems = [...obj.items].sort(() => Math.random() - 0.5);
        delete obj.items;
      }
      if (obj.type === "match_pairs" && obj.pairs) {
        obj.leftItems  = obj.pairs.map((p) => ({ _id: p._id, text: p.left  })).sort(() => Math.random() - 0.5);
        obj.rightItems = obj.pairs.map((p) => ({ _id: p._id, text: p.right })).sort(() => Math.random() - 0.5);
        delete obj.pairs;
      }
      if (obj.type === "sentence_builder" && obj.wordBank) {
        obj.wordBank = obj.wordBank.sort(() => Math.random() - 0.5);
      }
      delete obj.correctBoolean;
      delete obj.correctAnswers;
      delete obj.isCorrect;
      return obj;
    });

    recordShownQuestions(
      req.usuario._id,
      lesson._id,
      sanitizedQuestions.map((q) => q._id)
    ).catch(console.error);

    res.json({
      ok: true,
      data: {
        lesson: { _id: lesson._id, name: lesson.name, xpReward: lesson.xpReward, timeLimit: lesson.timeLimit, type: lesson.type },
        questions: sanitizedQuestions,
        totalQuestions: sanitizedQuestions.length,
        hearts: user.hearts.current,
        adaptive: {
          questionCount: adaptiveConfig.questionCount,
          difficulty: adaptiveConfig.difficulty,
          activityScore: adaptiveConfig.activityScore,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const answerQuestion = async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    if (!questionId || answer === undefined) {
      return res.status(400).json({ ok: false, message: "questionId y answer son requeridos" });
    }

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ ok: false, message: "Pregunta no encontrada" });

    let isCorrect = false;
    let correctAnswer = null;

    switch (question.type) {
      case "sentence_builder": {
        const userWords = Array.isArray(answer) ? answer : [];
        isCorrect = JSON.stringify(userWords) === JSON.stringify(question.correctAnswers);
        correctAnswer = question.correctAnswers;
        break;
      }
      case "multiple_choice": {
        const correctOption = question.options.find((o) => o.isCorrect);
        isCorrect = correctOption?._id.toString() === answer;
        correctAnswer = correctOption ? { id: correctOption._id, text: correctOption.text } : null;
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
        if (!isCorrect) {
          try {
            isCorrect = await evaluateFillBlankAnswer(question.prompt, userAns, question.correctAnswers);
          } catch (err) {
            console.error("Error evaluando con IA:", err.message);
          }
        }
        correctAnswer = question.correctAnswers[0];
        break;
      }
      case "order_items": {
        const userOrder = Array.isArray(answer) ? answer : [];
        isCorrect = JSON.stringify(userOrder) === JSON.stringify(question.items);
        correctAnswer = question.items;
        break;
      }
      case "match_pairs": {
        const userPairs = Array.isArray(answer) ? answer : [];
        
        // Verificar que cada leftId esté correctamente mapeado a su rightId
        isCorrect = userPairs.length === question.pairs.length &&
          userPairs.every((up) => {
            const pair = question.pairs.find((p) => p._id.toString() === up.leftId);
            // El rightId del usuario debe coincidir con el _id del par correcto
            return pair && pair._id.toString() === up.rightId;
          });

        // Si todos los right values son iguales, cualquier combinación es válida
        const rightValues = question.pairs.map((p) => p.right);
        const allSameRight = rightValues.every((v) => v === rightValues[0]);
        if (allSameRight && userPairs.length === question.pairs.length) {
          isCorrect = true;
        }

        correctAnswer = question.pairs;
        break;
      }
    }

    await UserProgress.findOneAndUpdate(
      { user: req.usuario._id, lesson: req.params.id },
      {
        $push: {
          "currentSession.attempts": { question: questionId, isCorrect, answeredAt: new Date() },
        },
      }
    );

    let heartsRemaining = null;
    if (!isCorrect) {
      const user = await User.findById(req.usuario._id);
      heartsRemaining = user.loseHeart();
      await user.save();
    }

    res.json({
      ok: true,
      data: { isCorrect, correctAnswer, explanation: question.explanation, heartsRemaining, xpEarned: isCorrect ? question.xpValue : 0 },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const completeLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate({
      path: "unit",
      populate: { path: "subject" },
    });
    if (!lesson) return res.status(404).json({ ok: false, message: "Lección no encontrada" });

    const progress = await UserProgress.findOne({ user: req.usuario._id, lesson: lesson._id });
    if (!progress || progress.status !== "in_progress") {
      return res.status(400).json({ ok: false, message: "No hay sesión activa para esta lección" });
    }

    const score = progress.calculateSessionScore();
    const isPerfect = score === 100;

    const adaptiveConfig = progress.currentSession?.adaptiveConfig || {
      questionCount: lesson.questionCount,
      difficulty: lesson.difficulty,
    };

    const baseXP = isPerfect ? Math.round(lesson.xpReward * 1.5) : lesson.xpReward;
    const xpEarned = getAdaptiveXPReward(baseXP, adaptiveConfig);

    await UserProgress.findOneAndUpdate(
      { user: req.usuario._id, lesson: lesson._id },
      {
        $set: {
          status: "completed",
          lastScore: score,
          "currentSession.completedAt": new Date(),
        },
        $inc: { completions: 1, totalXPEarned: xpEarned },
        $max: { bestScore: score },
      }
    );

    const user = await User.findById(req.usuario._id);
    const { leveledUp, newLevel } = user.addXP(xpEarned);
    user.gems += isPerfect ? (lesson.gemsReward || 0) + 5 : (lesson.gemsReward || 0);
    await user.save();

    let streak = await Streak.findOne({ user: req.usuario._id });
    if (!streak) streak = new Streak({ user: req.usuario._id });
    streak.recordActivity(xpEarned, user.dailyGoal);
    await streak.save();

    await Leaderboard.addXP(req.usuario._id, xpEarned);
    await unlockNextLesson(req.usuario._id, lesson);

    const newAchievements = await checkAndGrantAchievements(user, streak, progress);

    if (user.hearts.current === 0) {
      const minutesSinceRefill = (Date.now() - user.hearts.lastRefill) / 1000 / 60;
      if (minutesSinceRefill >= 30) { user.refillHearts(); await user.save(); }
    }

    refreshStaleQuestions(
      req.usuario._id,
      lesson,
      lesson.unit,
      lesson.unit.subject
    ).catch(console.error);

    res.json({
      ok: true,
      data: {
        score, isPerfect, xpEarned, leveledUp,
        newLevel: leveledUp ? newLevel : null,
        newStreak: streak.current,
        newAchievements,
        hearts: user.hearts.current,
        totalXP: user.xp,
        gems: user.gems,
        adaptive: {
          questionsAnswered: adaptiveConfig.questionCount,
          difficulty: adaptiveConfig.difficulty,
          activityScore: adaptiveConfig.activityScore,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const abandonLesson = async (req, res) => {
  try {
    await UserProgress.findOneAndUpdate(
      { user: req.usuario._id, lesson: req.params.id, status: "in_progress" },
      { status: "available", "currentSession.startedAt": null, "currentSession.attempts": [] }
    );
    res.json({ ok: true, message: "Lección abandonada" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const getLessonsForReview = async (req, res) => {
  try {
    const today = new Date();
    const reviewProgress = await UserProgress.find({
      user: req.usuario._id,
      status: "completed",
      "spacedRepetition.nextReviewDate": { $lte: today },
    }).populate("lesson", "name xpReward unit").limit(10);

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

module.exports = { getLessonById, startLesson, answerQuestion, completeLesson, abandonLesson, getLessonsForReview };