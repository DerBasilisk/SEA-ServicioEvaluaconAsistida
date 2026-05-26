// scripts/seedShop.js
// Ejecutar con: node scripts/seedShop.js

require("dotenv").config();
const mongoose = require("mongoose");
const ShopItem = require("../models/shopItem");

const items = [
  // ── MARCOS
  {
    name: "Marco Plata",
    description: "Un marco plateado clásico.",
    type: "frame",
    price: 100,
    cssValue: "2px solid silver",
    rarity: "common",
  },
  {
    name: "Marco Dorado",
    description: "Un elegante marco dorado.",
    type: "frame",
    price: 200,
    cssValue: "2px solid gold",
    rarity: "rare",
  },
  {
    name: "Marco Neon",
    description: "Marco con efecto de brillo neon.",
    type: "frame",
    price: 350,
    cssValue: "3px solid #00ffff",
    rarity: "epic",
  },
  {
    name: "Marco Arcoiris",
    description: "Marco animado con gradiente arcoiris.",
    type: "frame",
    price: 600,
    cssValue: "linear-gradient(45deg, red, orange, yellow, green, blue, violet)",
    rarity: "legendary",
  },
  // ── FONDOS
  {
    name: "Fondo Oceano",
    description: "Fondo azul degradado inspirado en el oceano.",
    type: "background",
    price: 150,
    cssValue: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
    rarity: "common",
  },
  {
    name: "Fondo Atardecer",
    description: "Calido degradado de atardecer.",
    type: "background",
    price: 150,
    cssValue: "linear-gradient(135deg, #f83600, #f9d423)",
    rarity: "common",
  },
  {
    name: "Fondo Galaxia",
    description: "Fondo oscuro con efecto estelar.",
    type: "background",
    price: 300,
    cssValue: "linear-gradient(135deg, #0d0d1a, #1a1a4e, #0d0d1a)",
    rarity: "rare",
  },
  {
    name: "Fondo Aurora",
    description: "Efecto aurora boreal.",
    type: "background",
    price: 500,
    cssValue: "linear-gradient(45deg, #43e97b, #38f9d7, #4facfe, #f093fb)",
    rarity: "epic",
  },
  {
    name: "Fondo Diamante",
    description: "Fondo exclusivo con textura de diamante.",
    type: "background",
    price: 800,
    cssValue: "linear-gradient(135deg, #a8edea, #fed6e3, #a8edea)",
    rarity: "legendary",
  },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.DB_URI);
    console.log("Conectado a MongoDB.");

    for (const item of items) {
      await ShopItem.findOneAndUpdate(
        { name: item.name },
        item,
        { upsert: true, new: true }
      );
    }

    console.log("Items de la tienda insertados/actualizados correctamente.");
    process.exit(0);
  } catch (err) {
    console.error("Error en seed:", err);
    process.exit(1);
  }
})();