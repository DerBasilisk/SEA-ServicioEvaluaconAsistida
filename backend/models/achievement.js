const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      // identificador único, ej: "streak_7", "perfect_lesson", "first_subject"
    },
    name: {
      type: String,
      required: true,
      // ej: "Una semana seguida", "Lección perfecta"
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "🏆",
    },
    category: {
      type: String,
      enum: ["streak", "xp", "lessons", "accuracy", "social", "special"],
      required: true,
    },

    // ── Condición de desbloqueo ───────────────────────────────
    condition: {
      type: {
        type: String,
        enum: [
          "streak_days",         // racha de N días
          "total_xp",            // acumular N XP
          "lessons_completed",   // completar N lecciones
          "perfect_lessons",     // N lecciones sin errores
          "subjects_started",    // iniciar N materias distintas
          "daily_goal_days",     // cumplir objetivo diario N días
        ],
        required: true,
      },
      threshold: {
        type: Number,
        required: true, // ej: 7 (para "racha de 7 días")
      },
      subjectId: {
        // opcional: logro específico de una materia
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        default: null,
      },
    },

    // ── Recompensa al desbloquear ─────────────────────────────
    reward: {
      xp: { type: Number, default: 0 },
      gems: { type: Number, default: 0 },
    },

    rarity: {
      type: String,
      enum: ["common", "rare", "epic", "legendary"],
      default: "common",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Seed de logros base ────────────────────────────────────────
achievementSchema.statics.seedDefaults = async function () {
  const defaults = [
    {
      key: "first_lesson",
      name: "¡Primer paso!",
      description: "Completaste tu primera lección",
      icon: "🌟",
      category: "lessons",
      condition: { type: "lessons_completed", threshold: 1 },
      reward: { xp: 10, gems: 5 },
      rarity: "common",
    },
    {
      key: "streak_3",
      name: "En racha",
      description: "3 días seguidos de práctica",
      icon: "🔥",
      category: "streak",
      condition: { type: "streak_days", threshold: 3 },
      reward: { xp: 20, gems: 10 },
      rarity: "common",
    },
    {
      key: "streak_7",
      name: "Semana completa",
      description: "7 días seguidos de práctica",
      icon: "🔥🔥",
      category: "streak",
      condition: { type: "streak_days", threshold: 7 },
      reward: { xp: 50, gems: 20 },
      rarity: "rare",
    },
    {
      key: "streak_30",
      name: "Imparable",
      description: "30 días seguidos de práctica",
      icon: "⚡",
      category: "streak",
      condition: { type: "streak_days", threshold: 30 },
      reward: { xp: 200, gems: 100 },
      rarity: "legendary",
    },
    {
      key: "perfect_lesson",
      name: "Perfección",
      description: "Completaste una lección sin errores",
      icon: "💎",
      category: "accuracy",
      condition: { type: "perfect_lessons", threshold: 1 },
      reward: { xp: 25, gems: 15 },
      rarity: "rare",
    },
    {
      key: "xp_100",
      name: "Estudiante aplicado",
      description: "Acumulaste 100 XP",
      icon: "📚",
      category: "xp",
      condition: { type: "total_xp", threshold: 100 },
      reward: { xp: 0, gems: 10 },
      rarity: "common",
    },
    {
      key: "xp_1000",
      name: "Experto",
      description: "Acumulaste 1000 XP",
      icon: "🎓",
      category: "xp",
      condition: { type: "total_xp", threshold: 1000 },
      reward: { xp: 0, gems: 50 },
      rarity: "epic",
    },
    {
      key: "lessons_10",
      name: "Constante",
      description: "Completaste 10 lecciones",
      icon: "📝",
      category: "lessons",
      condition: { type: "lessons_completed", threshold: 10 },
      reward: { xp: 30, gems: 20 },
      rarity: "common",
    },
  ];

  for (const a of defaults) {
    await this.findOneAndUpdate({ key: a.key }, a, { upsert: true, new: true });
  }
};

module.exports = mongoose.model("Achievement", achievementSchema);
