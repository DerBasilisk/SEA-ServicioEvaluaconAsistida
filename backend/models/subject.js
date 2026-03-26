const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre de la materia es obligatorio"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: [300, "Máximo 300 caracteres"],
    },
    icon: {
      type: String, 
      default: "📚",
    },
    color: {
      type: String, 
      default: "#4F46E5",
    },
    order: {
      type: Number, 
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    aiPromptContext: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- MIDDLEWARES ---

// 1. Generar slug automáticamente
subjectSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }
});

// --- MIDDLEWARE DE ELIMINACIÓN EN CASCADA ---
subjectSchema.pre("findOneAndDelete", async function () {
  // En middlewares de query, 'this' es la Query. 
  // Obtenemos el ID del filtro que se pasó (ej: desde findByIdAndDelete)
  const subjectId = this.getQuery()._id;

  try {
    const Unit = mongoose.model("Unit");
    const Lesson = mongoose.model("Lesson");
    const Question = mongoose.model("Question");

    console.log(`[Cascada] Iniciando limpieza para materia: ${subjectId}`);

    // 1. Buscar todas las unidades de esta materia
    const units = await Unit.find({ subject: subjectId });
    const unitIds = units.map((u) => u._id);

    if (unitIds.length > 0) {
      // 2. Buscar todas las lecciones de esas unidades
      const lessons = await Lesson.find({ unit: { $in: unitIds } });
      const lessonIds = lessons.map((l) => l._id);

      // 3. Borrar en cadena descendente (Preguntas -> Lecciones -> Unidades)
      if (lessonIds.length > 0) {
        await Question.deleteMany({ lesson: { $in: lessonIds } });
      }
      
      await Lesson.deleteMany({ unit: { $in: unitIds } });
      await Unit.deleteMany({ subject: subjectId });
      
      console.log(`[Cascada] Limpieza completada con éxito.`);
    }
  } catch (err) {
    console.error("❌ Error en el middleware de eliminación en cascada:", err);
    // Al lanzar el error aquí, Mongoose detendrá la eliminación de la Materia
    // y tu controlador recibirá este error en el bloque 'catch'.
    throw err; 
  }
});

// --- VIRTUALS ---

subjectSchema.virtual("units", {
  ref: "Unit",
  localField: "_id",
  foreignField: "subject",
});

module.exports = mongoose.model("Subject", subjectSchema);