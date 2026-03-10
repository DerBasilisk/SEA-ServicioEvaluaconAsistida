const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    name: {
      type: String,
      required: [true, "El nombre de la lección es obligatorio"],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, "Máximo 500 caracteres"],
    },
    order: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "lesson",    // lección normal con preguntas
        "checkpoint", // evaluación de cierre de unidad (más difícil)
        "review",     // repaso espaciado automático
        "ai_generated", // generada por IA on-demand
      ],
      default: "lesson",
    },

    // ── Configuración de la lección ───────────────────────────
    xpReward: {
      type: Number,
      default: 10, // XP que otorga completar la lección
    },
    gemsReward: {
      type: Number,
      default: 0,
    },
    questionCount: {
      type: Number,
      default: 5, // cuántas preguntas se presentan por sesión
      min: 3,
      max: 20,
    },
    timeLimit: {
      type: Number,
      default: null, // segundos (null = sin límite)
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    // ── Contenido teórico (opcional, mini-lectura antes de ejercicios) ──
    theory: {
      title: String,
      content: String, // markdown
      imageUrl: String,
    },

    // ── IA ────────────────────────────────────────────────────
    aiTopicHint: {
      // Tema específico para que la IA genere preguntas relevantes
      type: String,
      default: "",
      // ej: "ecuaciones de primer grado con una incógnita"
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: preguntas de esta lección
lessonSchema.virtual("questions", {
  ref: "Question",
  localField: "_id",
  foreignField: "lesson",
});

lessonSchema.index({ unit: 1, order: 1 }, { unique: true });

module.exports = mongoose.model("Lesson", lessonSchema);
