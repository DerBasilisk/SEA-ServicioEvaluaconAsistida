const mongoose = require("mongoose");

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
    // URL de imagen (opcional, para assets externos)
    assetUrl: {
      type: String,
      default: null,
    },
    // Valor CSS directo (gradientes, colores, borders, etc.)
    cssValue: {
      type: String,
      default: null,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShopItem", shopItemSchema);