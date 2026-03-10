const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    name: {
      type: String,
      required: [true, "El nombre de la unidad es obligatorio"],
      trim: true,
      // ej: "Álgebra básica", "Segunda Guerra Mundial"
    },
    description: {
      type: String,
      maxlength: [500, "Máximo 500 caracteres"],
    },
    icon: {
      type: String,
      default: "📖",
    },
    order: {
      type: Number,
      required: true, // posición en el mapa de la materia
    },
    requiredXP: {
      type: Number,
      default: 0, // XP mínimo en la materia para desbloquear esta unidad
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

// Virtual: lecciones de esta unidad
unitSchema.virtual("lessons", {
  ref: "Lesson",
  localField: "_id",
  foreignField: "unit",
});

// Índice compuesto: no puede haber dos unidades en el mismo orden dentro de la misma materia
unitSchema.index({ subject: 1, order: 1 }, { unique: true });

module.exports = mongoose.model("Unit", unitSchema);
