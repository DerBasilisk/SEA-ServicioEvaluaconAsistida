const mongoose = require("mongoose");

/* ── Variantes de color por tema ─────────────────────────────────
   Solo para backgroundType: "gradient"
   Cada campo es un string CSS válido para la propiedad "background"
─────────────────────────────────────────────────────────────────── */
const themeVariantSchema = new mongoose.Schema(
  {
    light:        { type: String, default: null },
    dark:         { type: String, default: null },
    highContrast: { type: String, default: null },
  },
  { _id: false }
);

/* ── Schema principal ────────────────────────────────────────────── */
const shopItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },

    // "frame" | "background"
    type: {
      type: String,
      enum: ["frame", "background"],
      required: true,
    },

    price: {
      type: Number,
      required: true,
      default: 0,
    },

    // "common" | "rare" | "epic" | "legendary"
    rarity: {
      type: String,
      enum: ["common", "rare", "epic", "legendary"],
      default: "common",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // URL de imagen externa (opcional, uso futuro)
    assetUrl: {
      type: String,
      default: null,
    },

    // ── CSS universal ────────────────────────────────────────────
    // Frames   → box-shadow multicapa
    // Fondos   → fallback cuando no hay themeVariants ni patternSvg
    cssValue: {
      type: String,
      default: null,
    },

    // ── Solo para type: "background" ─────────────────────────────

    // Indica cómo se renderiza el fondo:
    //   "gradient" → usa themeVariants (un color distinto por tema)
    //   "svg"      → usa patternSvg como overlay sobre el fondo del tema
    backgroundType: {
      type: String,
      enum: ["gradient", "svg"],
      default: null, // null = solo cssValue (comportamiento original)
    },

    // Gradiente adaptativo — un valor CSS por tema
    // Solo relevante cuando backgroundType === "gradient"
    themeVariants: {
      type: themeVariantSchema,
      default: null,
    },

    // SVG como string completo — se renderiza como overlay
    // Solo relevante cuando backgroundType === "svg"
    // Usa "currentColor" para los trazos; el frontend lo reemplaza
    // por el color del tema activo antes de convertirlo a data URI
    patternSvg: {
      type: String,
      default: null,
    },

    // Opacidad del overlay SVG (0–1)
    patternOpacity: {
      type: Number,
      default: 0.25,
      min: 0,
      max: 1,
    },

    // Tamaño del tile del patrón, ej: "40px 40px", "52px 60px"
    patternSize: {
      type: String,
      default: "40px 40px",
    },
  },
  { timestamps: true }
);

/* ── Virtual: resuelve el tipo real del item ─────────────────────
   Útil para el frontend al decidir cómo renderizar
─────────────────────────────────────────────────────────────────── */
shopItemSchema.virtual("renderMode").get(function () {
  if (this.type === "frame") return "frame";
  if (this.backgroundType === "svg") return "svg";
  if (this.backgroundType === "gradient" && this.themeVariants) return "gradient";
  return "css"; // fallback: usar cssValue directamente
});

module.exports = mongoose.model("ShopItem", shopItemSchema);