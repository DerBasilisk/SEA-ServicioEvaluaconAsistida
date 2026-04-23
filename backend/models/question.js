const mongoose = require("mongoose");

// ── Sub-esquemas por tipo de pregunta ──────────────────────────

// Opción para múltiple choice
const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true, default: false },
    explanation: { type: String, default: "" },
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

    wordBank: [String],

    type: {
      type: String,
      required: true,
      enum: [
        "multiple_choice",
        "true_false",
        "fill_blank",
        "order_items",
        "match_pairs",
        "sentence_builder",
        "free_text",
        "typing",
        "code_python",
      ],
    },

    evaluationCriteria: {
      type: String,
      default: null,
    },

    maxScore: {
      type: Number,
      default: 10,
    },

    isCodeExercise: {
      type: Boolean,
      default: false,
    },

    // ── Enunciado ─────────────────────────────────────────────
    prompt: {
      type: String,
      required: [true, "El enunciado es obligatorio"],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    hint: {
      type: String,
      default: null,
    },

    typingText: {
      type: String,
      default: "",
    },

    testCases: [{
      description: String,
      testType: { type: String, enum: ["stdout", "return"], default: "stdout" },
      expectedOutput: String,
      callCode: { type: String, default: "" },
    }],

    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },

    // multiple_choice
    options: [optionSchema],

    // true_false
    correctBoolean: {
      type: Boolean,
      default: null,
    },

    // fill_blank
    correctAnswers: {
      type: [String],
      default: [],
    },
    caseSensitive: {
      type: Boolean,
      default: false,
    },

    // order_items
    items: {
      type: [String],
      default: [],
    },

    // match_pairs
    pairs: [matchPairSchema],

    conceptExplanation: {
      type: String,
      default: null,
    },

    // ── Explicación post-respuesta ────────────────────────────
    explanation: {
      type: String,
      default: "",
    },

    // ── Metadata ──────────────────────────────────────────────
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    xpValue: {
      type: Number,
      default: 2,
    },
    tags: {
      type: [String],
      default: [],
    },

    // ── IA ────────────────────────────────────────────────────
    isAIGenerated: {
      type: Boolean,
      default: false,
    },
    aiModel: {
      type: String,
      default: null,
    },
    aiGeneratedAt: {
      type: Date,
      default: null,
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    reports: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      reason: {
        type: String,
        enum: ["wrong_answer", "unclear", "typo", "too_hard", "other"],
        required: true
      },
      comment: {
        type: String,
        maxlength: 300
      },
      reportedAt: {
        type: Date,
        default: Date.now
      }
    }]

  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PARCHE APLICADO: Normalización, pre-save y métodos de validación mejorados
// ─────────────────────────────────────────────────────────────────────────────

// Helper de normalización (sin tildes y minúsculas)
const normalizeAnswer = (str = '') =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// Pre-save: enriquecer correctAnswers con variantes (con y sin tilde)
questionSchema.pre('save', function () {
  if (this.type === 'fill_blank' && Array.isArray(this.correctAnswers)) {
    const extended = new Set();
    for (const ans of this.correctAnswers) {
      const trimmed = ans.trim();
      extended.add(trimmed);
      extended.add(trimmed.toLowerCase());
      const norm = normalizeAnswer(trimmed);
      extended.add(norm);
      extended.add(norm.charAt(0).toUpperCase() + norm.slice(1));
    }
    this.correctAnswers = [...extended].filter(Boolean);
  }
});

// Métodos de instancia (útiles en controllers)
questionSchema.methods.checkFillBlank = function (userAnswer) {
  if (this.type !== 'fill_blank') return false;
  const userNorm = normalizeAnswer(userAnswer);
  return this.correctAnswers.some(ans => normalizeAnswer(ans) === userNorm);
};

questionSchema.methods.checkTrueFalse = function (userAnswer) {
  if (this.type !== 'true_false') return false;
  const userBool = typeof userAnswer === 'boolean'
    ? userAnswer
    : String(userAnswer).toLowerCase() === 'true';
  return userBool === this.correctBoolean;
};

questionSchema.methods.checkMultipleChoice = function (selectedOptionId) {
  if (this.type !== 'multiple_choice') return false;
  const option = this.options.id(selectedOptionId);
  return option ? option.isCorrect : false;
};

// ── Validación mejorada (reemplaza el pre("validate") anterior) ──
questionSchema.pre('validate', function () {
  switch (this.type) {
    case 'multiple_choice':
      if (!this.options || this.options.length < 2)
        throw new Error('multiple_choice necesita al menos 2 opciones');
      if (!this.options.some(o => o.isCorrect))
        throw new Error('Debe haber al menos una opción correcta');
      {
        const texts = this.options.map(o => normalizeAnswer(o.text));
        if (new Set(texts).size !== texts.length)
          throw new Error('multiple_choice tiene opciones con texto duplicado');
      }
      break;

    case 'true_false':
      if (this.correctBoolean === null || this.correctBoolean === undefined)
        throw new Error('true_false necesita correctBoolean');
      break;

    case 'fill_blank':
      if (!this.correctAnswers || this.correctAnswers.length === 0)
        throw new Error('fill_blank necesita al menos una respuesta correcta');
      break;

    case 'order_items':
      if (!this.items || this.items.length < 2)
        throw new Error('order_items necesita al menos 2 ítems');
      break;

    case 'match_pairs':
      if (!this.pairs || this.pairs.length < 2)
        throw new Error('match_pairs necesita al menos 2 pares');
      {
        const rights = this.pairs.map(p => normalizeAnswer(p.right));
        if (new Set(rights).size !== rights.length)
          throw new Error('match_pairs tiene valores duplicados en la columna derecha');
      }
      break;

    case "sentence_builder":
      if (!this.wordBank || this.wordBank.length < 2)
        throw new Error('sentence_builder necesita al menos 2 palabras en el wordBank');
      
      // Normalizar el prompt: asegurar que los espacios estén correctos
      if (this.prompt) {
        // Reemplazar "___" con " ___ " para asegurar espacios
        this.prompt = this.prompt.replace(/___/g, " ___ ");
        // Limpiar espacios múltiples
        this.prompt = this.prompt.replace(/\s+/g, ' ').trim();
      }
      break;

    case 'typing':
      if (!this.typingText || !this.typingText.trim())
        throw new Error('typing necesita un typingText');
      break;

    case 'code_python':
      if (!this.testCases || this.testCases.length === 0)
        throw new Error('code_python necesita al menos un caso de prueba');
      if (this.testCases.some(tc => !tc.expectedOutput || !tc.expectedOutput.trim()))
        throw new Error('Todos los casos de prueba necesitan expectedOutput');
      break;
  }
});

// Índices
questionSchema.index({ lesson: 1, isActive: 1, difficulty: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ "reports.0": 1 });

module.exports = mongoose.model("Question", questionSchema);