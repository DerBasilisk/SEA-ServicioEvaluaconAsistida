const { Subject, Unit, Lesson, UserProgress } = require("../models");

// GET /api/subjects
// Lista todas las materias activas con progreso del usuario
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true }).sort("order");

    // Para cada materia, calcular progreso del usuario
    const subjectsWithProgress = await Promise.all(
      subjects.map(async (subject) => {
        const units = await Unit.find({ subject: subject._id, isActive: true });
        const unitIds = units.map((u) => u._id);

        const lessons = await Lesson.find({ unit: { $in: unitIds }, isActive: true });
        const lessonIds = lessons.map((l) => l._id);

        const completedCount = await UserProgress.countDocuments({
          user: req.user._id,
          lesson: { $in: lessonIds },
          status: "completed",
        });

        return {
          ...subject.toJSON(),
          totalLessons: lessons.length,
          completedLessons: completedCount,
          progressPercent:
            lessons.length > 0
              ? Math.round((completedCount / lessons.length) * 100)
              : 0,
        };
      })
    );

    res.json({ ok: true, data: subjectsWithProgress });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// GET /api/subjects/:slug
// Detalle de una materia con sus unidades y progreso
const getSubjectBySlug = async (req, res) => {
  try {
    const subject = await Subject.findOne({
      slug: req.params.slug,
      isActive: true,
    });

    if (!subject) {
      return res.status(404).json({ ok: false, message: "Materia no encontrada" });
    }

    const units = await Unit.find({ subject: subject._id, isActive: true }).sort("order");

    const unitsWithProgress = await Promise.all(
      units.map(async (unit) => {
        const lessons = await Lesson.find({ unit: unit._id, isActive: true }).sort("order");
        const lessonIds = lessons.map((l) => l._id);

        const progressRecords = await UserProgress.find({
          user: req.user._id,
          lesson: { $in: lessonIds },
        });

        const progressMap = {};
        progressRecords.forEach((p) => {
          progressMap[p.lesson.toString()] = p;
        });

        const lessonsWithStatus = lessons.map((lesson) => {
          const progress = progressMap[lesson._id.toString()];
          return {
            ...lesson.toJSON(),
            status: progress?.status || "locked",
            bestScore: progress?.bestScore || 0,
            completions: progress?.completions || 0,
            nextReviewDate: progress?.spacedRepetition?.nextReviewDate || null,
          };
        });

        const completedCount = lessonsWithStatus.filter(
          (l) => l.status === "completed"
        ).length;

        return {
          ...unit.toJSON(),
          lessons: lessonsWithStatus,
          completedLessons: completedCount,
          totalLessons: lessons.length,
          progressPercent:
            lessons.length > 0
              ? Math.round((completedCount / lessons.length) * 100)
              : 0,
        };
      })
    );

    res.json({
      ok: true,
      data: { ...subject.toJSON(), units: unitsWithProgress },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// ── Admin ─────────────────────────────────────────────────────

// POST /api/subjects  (admin)
const createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ ok: true, data: subject });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

// PUT /api/subjects/:id  (admin)
const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!subject) return res.status(404).json({ ok: false, message: "No encontrada" });
    res.json({ ok: true, data: subject });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

// DELETE /api/subjects/:id  (admin) — soft delete
const deleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ ok: true, message: "Materia desactivada" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

module.exports = {
  getSubjects,
  getSubjectBySlug,
  createSubject,
  updateSubject,
  deleteSubject,
};
