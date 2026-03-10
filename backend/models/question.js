const mongoose = require("mongoose");

// ── Sub-esquemas por tipo de pregunta ──────────────────────────

// Opción para múltiple choice
const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true, default: false },
    explanation: { type: String, default: "" }, // por qué es correcta/incorrecta
  },
  { _id: true }
);

// Par para "relacionar columnas"
const matchPairSchema = new mongoose.Schema(
  {
    left: { type: String, required: true },
    right: { type: String, required: true },
  },
  { _id: true }
);

// ── Esquema principal ──────────────────────────────────────────
const questionSchema = new mongoose.Schema(
  {
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "multiple_choice",  // 4 opciones, 1 correcta
        "true_false",       // Verdadero / Falso
        "fill_blank",       // Completar el espacio en blanco
        "order_items",      // Ordenar elementos en secuencia correcta
        "match_pairs",      // Relacionar columna A con columna B
      ],
    },

    // ── Enunciado ─────────────────────────────────────────────
    prompt: {
      type: String,
      required: [true, "El enunciado es obligatorio"],
      trim: true,
      // Para fill_blank usar ___ como marcador: "La capital de Francia es ___"
    },
    imageUrl: {
      type: String,
      default: null, // imagen opcional en el enunciado
    },
    hint: {
      type: String,
      default: null, // pista que el usuario puede pedir (cuesta gemas)
    },

    // ── Respuestas según tipo ─────────────────────────────────

    // multiple_choice
    options: [optionSchema],

    // true_false
    correctBoolean: {
      type: Boolean,
      default: null,
    },

    // fill_blank
    correctAnswers: {
      type: [String], // acepta variantes: ["Buenos Aires", "buenos aires"]
      default: [],
    },
    caseSensitive: {
      type: Boolean,
      default: false,
    },

    // order_items
    items: {
      type: [String], // los ítems en orden CORRECTO (se muestran mezclados)
      default: [],
    },

    // match_pairs
    pairs: [matchPairSchema],

    // ── Explicación post-respuesta ────────────────────────────
    explanation: {
      type: String,
      default: "", // se muestra después de responder (bien o mal)
    },

    // ── Metadata ──────────────────────────────────────────────
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    xpValue: {
      type: Number,
      default: 2, // XP que da responder correctamente esta pregunta
    },
    tags: {
      type: [String], // ej: ["suma", "fracciones"] — útil para repaso espaciado
      default: [],
    },

    // ── IA ────────────────────────────────────────────────────
    isAIGenerated: {
      type: Boolean,
      default: false,
    },
    aiModel: {
      type: String,
      default: null, // versión del modelo que la generó
    },
    aiGeneratedAt: {
      type: Date,
      default: null,
    },
    isReviewed: {
      // preguntas IA deben ser revisadas por admin antes de activarse
      type: Boolean,
      default: false,
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

// ── Validación: campos requeridos según tipo ───────────────────
questionSchema.pre("validate", function (next) {
  switch (this.type) {
    case "multiple_choice":
      if (!this.options || this.options.length < 2) {
        return next(new Error("multiple_choice necesita al menos 2 opciones"));
      }
      if (!this.options.some((o) => o.isCorrect)) {
        return next(new Error("Debe haber al menos una opción correcta"));
      }
      break;
    case "true_false":
      if (this.correctBoolean === null) {
        return next(new Error("true_false necesita correctBoolean"));
      }
      break;
    case "fill_blank":
      if (!this.correctAnswers || this.correctAnswers.length === 0) {
        return next(new Error("fill_blank necesita al menos una respuesta correcta"));
      }
      break;
    case "order_items":
      if (!this.items || this.items.length < 2) {
        return next(new Error("order_items necesita al menos 2 ítems"));
      }
      break;
    case "match_pairs":
      if (!this.pairs || this.pairs.length < 2) {
        return next(new Error("match_pairs necesita al menos 2 pares"));
      }
      break;
  }
  next();
});

// Índice para búsqueda eficiente al armar sesiones de repaso
questionSchema.index({ lesson: 1, isActive: 1, difficulty: 1 });
questionSchema.index({ tags: 1 });

module.exports = mongoose.model("Question", questionSchema);
