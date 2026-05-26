const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shop");
const { verifyToken } = require("../middlewares/auth.middleware");

// Todas las rutas de tienda requieren autenticación
router.use(verifyToken);

// Tienda pública (con info de "owned" por usuario)
router.get("/items", shopController.getItems);

// Inventario del usuario autenticado
router.get("/inventory", shopController.getInventory);

// Comprar un item
router.post("/buy/:itemId", shopController.buyItem);

// Equipar un item del inventario
router.put("/equip/:itemId", shopController.equipItem);

// Desequipar — body: { type: "frame" | "background" }
router.put("/unequip/:type", shopController.unequipItem);

module.exports = router;
