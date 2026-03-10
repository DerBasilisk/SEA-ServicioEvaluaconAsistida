const { Question, Lesson } = require("../models");
const { generateQuestions } = require("../services/ai.service");

// GET /api/questions?lesson=:lessonId  (admin)
const getQuestions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.lesson) filter.lesson = req.query.lesson;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.isReviewed !== undefined)
      filter.isReviewed = req.query.isReviewed === "true";

    const questions = await Question.find(filter)
      .populate("lesson", "name")
      .sort("-createdAt");

    res.json({ ok: true, data: questions, total: questions.length });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// POST /api/questions  (admin)
const createQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json({ ok: true, data: question });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

// PUT /api/questions/:id  (admin)
const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!question) return res.status(404).json({ ok: false, message: "No encontrada" });
    res.json({ ok: true, data: question });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

// DELETE /api/questions/:id  (admin) — soft delete
const deleteQuestion = async (req, res) => {
  try {
    await Question.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ ok: true, message: "Pregunta desactivada" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// PUT /api/questions/:id/review  (admin)
// Aprobar o rechazar una pregunta generada por IA
const reviewQuestion = async (req, res) => {
  try {
    const { approved, editedData } = req.body;

    const update = {
      isReviewed: true,
      isActive: approved,
      ...(editedData || {}),
    };

    const question = await Question.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!question) return res.status(404).json({ ok: false, message: "No encontrada" });

    res.json({ ok: true, data: question });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

// POST /api/questions/generate  (admin)
// Genera preguntas con IA para una lección específica
const generateWithAI = async (req, res) => {
  try {
    const { lessonId, count = 5, difficulty = "easy", allowedTypes } = req.body;

    const lesson = await Lesson.findById(lessonId).populate({
      path: "unit",
      populate: { path: "subject" },
    });

    if (!lesson) {
      return res.status(404).json({ ok: false, message: "Lección no encontrada" });
    }

    const subject = lesson.unit.subject;
    const unit = lesson.unit;

    const generatedQuestions = await generateQuestions({
      subjectName: subject.name,
      unitName: unit.name,
      lessonName: lesson.name,
      topicHint: lesson.aiTopicHint || lesson.name,
      difficulty,
      subjectContext: subject.aiPromptContext,
      count,
      allowedTypes,
    });

    // Guardar como pendientes de revisión
    const saved = await Question.insertMany(
      generatedQuestions.map((q) => ({ ...q, lesson: lessonId }))
    );

    res.status(201).json({
      ok: true,
      message: `${saved.length} preguntas generadas. Deben ser revisadas antes de activarse.`,
      data: saved,
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

module.exports = {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reviewQuestion,
  generateWithAI,
};
