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

// CORREGIDO: Eliminamos 'next' de los argumentos
unitSchema.pre("findOneAndDelete", async function () {
  const unitId = this.getQuery()._id;
  
  try {
    const Lesson = mongoose.model("Lesson");
    const Question = mongoose.model("Question");

    console.log(`[Cascada] Limpiando contenido de la unidad: ${unitId}`);

    // 1. Encontrar lecciones de esta unidad
    const lessons = await Lesson.find({ unit: unitId });
    const lessonIds = lessons.map((l) => l._id);

    if (lessonIds.length > 0) {
      // 2. Borrar preguntas vinculadas a esas lecciones
      await Question.deleteMany({ lesson: { $in: lessonIds } });
      // 3. Borrar las lecciones
      await Lesson.deleteMany({ unit: unitId });
    }
    
    // Al ser async, Mongoose sabe que terminó cuando la promesa se resuelve.
  } catch (err) {
    console.error("❌ Error en cascada de Unit:", err);
    // Lanzamos el error para que el controlador lo capture
    throw err; 
  }
});

module.exports = mongoose.model("Unit", unitSchema);
