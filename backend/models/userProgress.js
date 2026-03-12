const mongoose = require("mongoose");

// Registro de cada intento de respuesta dentro de una sesión
const attemptSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    isCorrect: { type: Boolean, required: true },
    timeSpent: { type: Number, default: 0 }, // segundos
    hintsUsed: { type: Number, default: 0 },
  },
  { _id: false }
);

const userProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },

    // ── Estado de la lección ──────────────────────────────────
    status: {
      type: String,
      enum: ["locked", "available", "in_progress", "completed"],
      default: "locked",
    },
    completions: {
      type: Number,
      default: 0, // cuántas veces la completó (se puede repetir)
    },
    bestScore: {
      type: Number,
      default: 0, // % de aciertos en el mejor intento (0-100)
    },
    lastScore: {
      type: Number,
      default: 0,
    },
    totalXPEarned: {
      type: Number,
      default: 0, // XP total acumulado en esta lección
    },
    lastCompletedAt: {
      type: Date,
      default: null,
    },

    // ── Sesión actual (se limpia al completar) ────────────────
    currentSession: {
      startedAt: { type: Date, default: null },
      attempts: [attemptSchema],
      heartsAtStart: { type: Number, default: 5 },
    },

    // ── Repaso espaciado (Spaced Repetition) ─────────────────
    spacedRepetition: {
      nextReviewDate: { type: Date, default: null },
      interval: { type: Number, default: 1 },    // días hasta próximo repaso
      easeFactor: { type: Number, default: 2.5 }, // factor SM-2
      repetitions: { type: Number, default: 0 },
    },

    // -- preguntas vistas
    seenQuestions: [
    {
      question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
      timesShown: { type: Number, default: 1 },
    },
  ],

  },
  {
    timestamps: true,
  }
);

// ── Métodos de instancia ───────────────────────────────────────

// Inicia una nueva sesión de práctica
userProgressSchema.methods.startSession = function (currentHearts) {
  this.status = "in_progress";
  this.currentSession = {
    startedAt: new Date(),
    attempts: [],
    heartsAtStart: currentHearts,
  };
};

// Registra una respuesta en la sesión activa
userProgressSchema.methods.recordAttempt = function (questionId, isCorrect, timeSpent = 0, hintsUsed = 0) {
  this.currentSession.attempts.push({ question: questionId, isCorrect, timeSpent, hintsUsed });
};

// Calcula el score de la sesión actual (%)
userProgressSchema.methods.calculateSessionScore = function () {
  const attempts = this.currentSession.attempts;
  if (!attempts.length) return 0;
  const correct = attempts.filter((a) => a.isCorrect).length;
  return Math.round((correct / attempts.length) * 100);
};

// Completa la sesión y actualiza estadísticas
userProgressSchema.methods.completeSession = function (xpEarned) {
  const score = this.calculateSessionScore();
  this.status = "completed";
  this.completions += 1;
  this.lastScore = score;
  if (score > this.bestScore) this.bestScore = score;
  this.totalXPEarned += xpEarned;
  this.lastCompletedAt = new Date();

  // Actualizar repaso espaciado (algoritmo SM-2 simplificado)
  this.updateSpacedRepetition(score);

  // Limpiar sesión activa
  this.currentSession = { startedAt: null, attempts: [], heartsAtStart: 5 };
};

// Algoritmo SM-2 simplificado
userProgressSchema.methods.updateSpacedRepetition = function (score) {
  const sr = this.spacedRepetition;
  const quality = score >= 80 ? 4 : score >= 60 ? 3 : score >= 40 ? 2 : 1;

  if (quality >= 3) {
    if (sr.repetitions === 0) sr.interval = 1;
    else if (sr.repetitions === 1) sr.interval = 6;
    else sr.interval = Math.round(sr.interval * sr.easeFactor);

    sr.easeFactor = Math.max(
      1.3,
      sr.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    );
    sr.repetitions += 1;
  } else {
    sr.repetitions = 0;
    sr.interval = 1;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + sr.interval);
  sr.nextReviewDate = nextDate;
};

// Índice único: un registro de progreso por usuario/lección
userProgressSchema.index({ user: 1, lesson: 1 }, { unique: true });
// Índice para buscar lecciones que necesitan repaso
userProgressSchema.index({ user: 1, "spacedRepetition.nextReviewDate": 1 });

module.exports = mongoose.model("UserProgress", userProgressSchema);
