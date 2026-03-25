const User = require("../models/user");
const UserProgress = require("../models/userProgress");
const { Subject, Unit, Lesson, Question } = require("../models");

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
    const { role, isActive, displayName, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...(role && { role }), ...(isActive !== undefined && { isActive }), ...(displayName && { displayName }), ...(email && { email }) },
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

const getUnits = async (req, res) => {
  try {
    const units = await Unit.find({ subject: req.params.subjectId }).sort({ order: 1 });
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

const getLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find({ unit: req.params.unitId }).sort({ order: 1 });
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

const getQuestions = async (req, res) => {
  try {
    const { lessonId, reviewed, page = 1, limit = 20 } = req.query;
    const query = {};
    if (lessonId) query.lesson = lessonId;
    if (reviewed !== undefined) query.isReviewed = reviewed === "true";

    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .populate("lesson", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ ok: true, data: { questions, total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
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

// ── STATS ─────────────────────────────────────────────────────

const getStats = async (req, res) => {
  try {
    const [totalUsers, totalSubjects, totalLessons, totalQuestions, pendingQuestions] = await Promise.all([
      User.countDocuments(),
      Subject.countDocuments(),
      Lesson.countDocuments(),
      Question.countDocuments(),
      Question.countDocuments({ isReviewed: false }),
    ]);
    res.json({ ok: true, data: { totalUsers, totalSubjects, totalLessons, totalQuestions, pendingQuestions } });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

module.exports = {
  getUsers, getUserProgress, updateUser, banUser, deleteUser,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getUnits, createUnit, updateUnit, deleteUnit,
  getLessons, createLesson, updateLesson, deleteLesson,
  getQuestions, updateQuestion, reviewQuestion, deleteQuestion,
  getStats,
};