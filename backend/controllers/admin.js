const User = require("../models/user");
const UserProgress = require("../models/userProgress");
const { Subject, Unit, Lesson, Question } = require("../models");
const mongoose = require("mongoose");
const { exportToCSV } = require("../services/csv.service");
const { generateQuestions } = require("../services/ai.service");

// ── USUARIOS ──────────────────────────────────────────────────

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const query = search
      ? { $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { displayName: { $regex: search, $options: "i" } },
        ]}
      : {};

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ ok: true, data: { users, total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const getUserProgress = async (req, res) => {
  try {
    const progress = await UserProgress.find({ user: req.params.id })
      .populate("lesson", "name xpReward")
      .sort({ updatedAt: -1 });
    res.json({ ok: true, data: progress });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { isActive, displayName, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        ...(isActive !== undefined && { isActive }),
        ...(displayName && { displayName }),
        ...(email && { email }),
      },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    res.json({ ok: true, data: user });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["student", "admin", "superadmin"].includes(role)) {
      return res.status(400).json({ ok: false, message: "Rol inválido" });
    }

    // Prevent a superadmin from accidentally demoting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ ok: false, message: "No puedes cambiar tu propio rol" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    res.json({ ok: true, data: user });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    }
    user.isActive = !user.isActive;
    
    await user.save();
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ ok: true, data: userResponse });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await UserProgress.deleteMany({ user: req.params.id });
    res.json({ ok: true, message: "Usuario eliminado" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// ── CONTENIDO ─────────────────────────────────────────────────

const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ order: 1 });
    res.json({ ok: true, data: subjects });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ ok: true, data: subject });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ok: true, data: subject });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const deleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: "Materia eliminada" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};


// GET /api/admin/subjects/:subjectId/units (anidada)
const getUnits = async (req, res) => {
  try {
    const units = await Unit.find({ subject: req.params.subjectId })
      .sort({ order: 1 });
    res.json({ ok: true, data: units });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const createUnit = async (req, res) => {
  try {
    const unit = await Unit.create({ ...req.body, subject: req.params.subjectId });
    res.status(201).json({ ok: true, data: unit });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

const updateUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ok: true, data: unit });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const deleteUnit = async (req, res) => {
  try {
    await Unit.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: "Unidad eliminada" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// ==================== LECCIONES ====================


// GET /api/admin/units/:unitId/lessons (anidada)
const getLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find({ unit: req.params.unitId })
      .sort({ order: 1 });
    res.json({ ok: true, data: lessons });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const createLesson = async (req, res) => {
  try {
    const lesson = await Lesson.create({ ...req.body, unit: req.params.unitId });
    res.status(201).json({ ok: true, data: lesson });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

const updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ok: true, data: lesson });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const deleteLesson = async (req, res) => {
  try {
    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: "Lección eliminada" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// ── PREGUNTAS ─────────────────────────────────────────────────

// GET /api/admin/questions
const getQuestions = async (req, res) => {
  try {
    const { 
      subjectId, 
      unitId, 
      lessonId, 
      reviewed, 
      search, 
      reported,
      page = 1, 
      limit = 15 
    } = req.query;

    const query = {};

    // Filtros jerárquicos
    if (lessonId) {
      query.lesson = lessonId;
    } else if (unitId) {
      const Lesson = mongoose.model("Lesson");
      const lessons = await Lesson.find({ unit: unitId }).select("_id");
      query.lesson = { $in: lessons.map(l => l._id) };
    } else if (subjectId) {
      const Unit = mongoose.model("Unit");
      const Lesson = mongoose.model("Lesson");
      const units = await Unit.find({ subject: subjectId }).select("_id");
      const lessons = await Lesson.find({ unit: { $in: units.map(u => u._id) } }).select("_id");
      query.lesson = { $in: lessons.map(l => l._id) };
    }

    if (reviewed !== undefined && reviewed !== "all") {
      query.isReviewed = reviewed === "true";
    }

    if (search) {
      query.prompt = { $regex: search, $options: "i" };
    }

    // Filtro de reportadas
    if (reported === "true") {
      query.reports = { $exists: true, $ne: [] };   // solo preguntas que tengan reportes
    }

    // Nuevo: Filtro para preguntas reportadas
    const sort = {};
    if (req.query.reported === "true") {
      query.reports = { $exists: true, $ne: [] };
      sort["reports.0.reportedAt"] = -1;   // más recientes primero
    } else {
      sort.createdAt = -1;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [questions, total] = await Promise.all([
      Question.find(query)
        .populate({
          path: "lesson",
          select: "name",
          populate: { path: "unit", select: "name" }
        })
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Question.countDocuments(query)
    ]);

    res.json({ 
      ok: true, 
      data: { 
        questions, 
        total, 
        page: Number(page), 
        pages: Math.ceil(total / Number(limit)) 
      } 
    });
  } catch (err) {
    console.error("Error en getQuestions:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
};;

const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { 
        new: true,           // ← Esta opción está deprecada
        returnDocument: 'after'   // ← Reemplazo correcto
      }
    );

    if (!question) {
      return res.status(404).json({ ok: false, message: "Pregunta no encontrada" });
    }

    res.json({ ok: true, data: question });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const reviewQuestion = async (req, res) => {
  try {
    const { approved } = req.body;
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { isReviewed: approved, isActive: approved },
      { new: true }
    );
    res.json({ ok: true, data: question });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: "Pregunta eliminada" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// PUT /api/admin/questions/:id/clear-reports
const clearReports = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { $set: { reports: [] } },   // Borra todos los reportes
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ ok: false, message: "Pregunta no encontrada" });
    }

    res.json({ 
      ok: true, 
      message: "Todos los reportes de esta pregunta han sido eliminados.",
      data: question 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
};

// ── STATS ─────────────────────────────────────────────────────

const getStats = async (req, res) => {
  try {
    const [totalUsers, totalSubjects, totalUnits, totalLessons, totalQuestions, pendingQuestions] = await Promise.all([
      User.countDocuments(),
      Subject.countDocuments(),
      Unit.countDocuments(),
      Lesson.countDocuments(),
      Question.countDocuments(),
      Question.countDocuments({ isReviewed: false }),
    ]);
    res.json({ ok: true, data: { totalUsers, totalSubjects, totalUnits, totalLessons, totalQuestions, pendingQuestions } });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// POST /api/admin/questions - Crear pregunta manual
const createQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json({ ok: true, data: question });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

// GET /api/admin/units - Todas las unidades
const getAllUnits = async (req, res) => {
  try {
    const units = await Unit.find()
      .populate("subject", "name icon color")
      .sort({ order: 1 });
    res.json({ ok: true, data: units });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// GET /api/admin/lessons - Todas las lecciones con jerarquía completa
const getAllLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find()
      .populate({
        path: "unit",
        select: "name order",
        populate: {
          path: "subject",
          select: "name icon color"
        }
      })
      .sort({ "unit.order": 1, "order": 1 })   // Orden lógico: por unidad y luego por lección
      .lean();   // ← Muy importante para evitar objetos Mongoose complejos

    res.json({ ok: true, data: lessons });
  } catch (err) {
    console.error("Error en getAllLessons:", err);
    res.status(500).json({ ok: false, message: "Error al obtener las lecciones" });
  }
};

// ==================== GENERACIÓN DE PREGUNTAS CON IA ====================

// POST /api/admin/questions/generate
const generateWithAI = async (req, res) => {
  try {
    const { lessonId, count = 5, difficulty = "medium", allowedTypes } = req.body;

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
      subjectContext: subject.aiPromptContext || "",
      count,
      allowedTypes,
    });

    // Guardar como pendientes de revisión
    const saved = await Question.insertMany(
      generatedQuestions.map((q) => ({ 
        ...q, 
        lesson: lessonId,
        isReviewed: false,
        isActive: false 
      }))
    );

    res.status(201).json({
      ok: true,
      message: `${saved.length} preguntas generadas con IA. Deben ser revisadas antes de activarse.`,
      data: saved,
    });
  } catch (err) {
    console.error("Error generando preguntas con IA:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
};


// ==================== EXPORT CSV (Versión Corregida) ====================

const exportSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ order: 1 }).lean(); // .lean() es clave
    const { csv, filename } = exportToCSV(subjects, 'subjects');
    
    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Error al exportar materias" });
  }
};

const exportUnits = async (req, res) => {
  try {
    const units = await Unit.find()
      .populate("subject", "name")
      .sort({ order: 1 })
      .lean();
    const { csv, filename } = exportToCSV(units, 'units');
    
    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Error al exportar unidades" });
  }
};

const exportLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find()
      .populate("unit", "name")
      .sort({ order: 1 })
      .lean();
    const { csv, filename } = exportToCSV(lessons, 'lessons');
    
    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Error al exportar lecciones" });
  }
};

const exportQuestions = async (req, res) => {
  try {
    const questions = await Question.find()
      .populate("lesson", "name")
      .sort({ createdAt: -1 })
      .lean();   // ← Muy importante

    // Limpiar datos complejos antes de exportar
    const cleanQuestions = questions.map(q => ({
      _id: q._id,
      prompt: q.prompt,
      type: q.type,
      difficulty: q.difficulty,
      xpValue: q.xpValue,
      explanation: q.explanation,
      hint: q.hint,
      conceptExplanation: q.conceptExplanation,
      tags: q.tags ? q.tags.join("; ") : "",
      isAIGenerated: q.isAIGenerated,
      aiModel: q.aiModel,
      isReviewed: q.isReviewed,
      isActive: q.isActive,
      lessonName: q.lesson ? q.lesson.name : "",
      createdAt: q.createdAt,
      updatedAt: q.updatedAt
    }));

    const { csv, filename } = exportToCSV(cleanQuestions, 'questions');
    
    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Error al exportar preguntas" });
  }
};

module.exports = {
  getUsers, 
  getUserProgress, 
  updateUser, 
  updateUserRole,
  banUser, 
  deleteUser,

  getSubjects, 
  createSubject, 
  updateSubject, 
  deleteSubject, 
  
  // Unidades
  getAllUnits,      // ← Importante
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,

  // Lecciones
  getAllLessons,    // ← Importante
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,

  // Preguntas
  getQuestions,
  createQuestion, 
  updateQuestion, 
  reviewQuestion, 
  deleteQuestion,
  clearReports,

  // Export CSV
  exportSubjects,
  exportUnits,
  exportLessons,
  exportQuestions,

  // Generación de preguntas con IA
  generateWithAI,
  exportSubjects,

  getStats,
};