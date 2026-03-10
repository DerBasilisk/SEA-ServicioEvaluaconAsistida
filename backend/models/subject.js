const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre de la materia es obligatorio"],
      unique: true,
      trim: true,
      // ej: "Matemática", "Historia", "Lengua", "Ciencias"
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      // ej: "matematica", "historia"
    },
    description: {
      type: String,
      required: true,
      maxlength: [300, "Máximo 300 caracteres"],
    },
    icon: {
      type: String, // nombre del emoji o URL de ícono
      default: "📚",
    },
    color: {
      type: String, // color hex para la UI
      default: "#4F46E5",
    },
    order: {
      type: Number, // orden de aparición en el mapa
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    aiPromptContext: {
      // Contexto base que se le da a la IA para generar preguntas
      type: String,
      default: "",
      // ej: "Eres un profesor de matemática para nivel secundario argentino..."
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Genera slug automáticamente desde el nombre
subjectSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // elimina acentos
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }
  next();
});

// Virtual: cantidad de unidades (se usa con populate)
subjectSchema.virtual("units", {
  ref: "Unit",
  localField: "_id",
  foreignField: "subject",
});

module.exports = mongoose.model("Subject", subjectSchema);
