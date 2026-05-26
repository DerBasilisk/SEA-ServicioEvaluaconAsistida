const ShopItem = require("../models/shopItem");
const UserInventory = require("../models/userInventory");
const User = require("../models/user");

// ─── GET /api/shop/items ───────────────────────────────────────────────────────
// Devuelve todos los items activos, marcando cuáles ya compró el usuario
exports.getItems = async (req, res) => {
  try {
    const userId = req.user.id;

    const [items, owned] = await Promise.all([
      ShopItem.find({ isActive: true }).sort({ price: 1 }),
      UserInventory.find({ userId }).select("itemId"),
    ]);

    const ownedIds = new Set(owned.map((e) => e.itemId.toString()));

    const result = items.map((item) => ({
      ...item.toObject(),
      owned: ownedIds.has(item._id.toString()),
    }));

    res.json(result);
  } catch (err) {
    console.error("getItems error:", err);
    res.status(500).json({ message: "Error al obtener la tienda" });
  }
};

// ─── GET /api/shop/inventory ───────────────────────────────────────────────────
// Devuelve el inventario completo del usuario con detalle de cada item
exports.getInventory = async (req, res) => {
  try {
    const userId = req.user.id;

    const inventory = await UserInventory.find({ userId })
      .populate("itemId")
      .sort({ purchasedAt: -1 });

    res.json(inventory);
  } catch (err) {
    console.error("getInventory error:", err);
    res.status(500).json({ message: "Error al obtener el inventario" });
  }
};

// ─── POST /api/shop/buy/:itemId ────────────────────────────────────────────────
// Compra un item: verifica gemas, descuenta y agrega al inventario
exports.buyItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const [item, user] = await Promise.all([
      ShopItem.findOne({ _id: itemId, isActive: true }),
      User.findById(userId),
    ]);

    if (!item) {
      return res.status(404).json({ message: "Item no encontrado" });
    }

    const alreadyOwned = await UserInventory.findOne({ userId, itemId });
    if (alreadyOwned) {
      return res.status(400).json({ message: "Ya tienes este item" });
    }

    // Ajusta "gems" al nombre real del campo en tu modelo User
    if (user.gems < item.price) {
      return res.status(400).json({ message: "No tienes suficientes gemas" });
    }

    // Descontar gemas y crear entrada en inventario
    await User.findByIdAndUpdate(userId, { $inc: { gems: -item.price } });
    const inventoryEntry = await UserInventory.create({ userId, itemId });

    res.status(201).json({
      message: "Item comprado exitosamente",
      gemsRemaining: user.gems - item.price,
      inventoryEntry,
    });
  } catch (err) {
    console.error("buyItem error:", err);
    res.status(500).json({ message: "Error al comprar el item" });
  }
};

// ─── PUT /api/shop/equip/:itemId ───────────────────────────────────────────────
// Equipa un item (desequipa el anterior del mismo tipo automáticamente)
exports.equipItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const entry = await UserInventory.findOne({ userId, itemId }).populate("itemId");

    if (!entry) {
      return res.status(404).json({ message: "No tienes ese item en tu inventario" });
    }

    const itemType = entry.itemId.type; // "frame" | "background"

    // Obtener los ids de los items del mismo tipo que el usuario tiene equipados
    const sameTypeOwned = await UserInventory.find({ userId, isEquipped: true })
      .populate({ path: "itemId", match: { type: itemType } });

    // Desequipar los del mismo tipo
    const toUnequip = sameTypeOwned
      .filter((e) => e.itemId !== null)
      .map((e) => e._id);

    if (toUnequip.length > 0) {
      await UserInventory.updateMany(
        { _id: { $in: toUnequip } },
        { isEquipped: false }
      );
    }

    // Equipar el nuevo
    entry.isEquipped = true;
    await entry.save();

    // Guardar referencia activa en el usuario
    const activeField =
      itemType === "frame" ? "activeFrame" : "activeBackground";
    await User.findByIdAndUpdate(userId, { [activeField]: itemId });

    res.json({ message: "Item equipado", item: entry.itemId });
  } catch (err) {
    console.error("equipItem error:", err);
    res.status(500).json({ message: "Error al equipar el item" });
  }
};

// ─── PUT /api/shop/unequip/:type ───────────────────────────────────────────────
// Desequipa el item activo de un tipo ("frame" | "background")
exports.unequipItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.params;

    if (!["frame", "background"].includes(type)) {
      return res.status(400).json({ message: "Tipo invalido. Usa 'frame' o 'background'" });
    }

    // Encontrar items equipados del tipo indicado
    const equipped = await UserInventory.find({ userId, isEquipped: true }).populate({
      path: "itemId",
      match: { type },
    });

    const toUnequip = equipped.filter((e) => e.itemId !== null).map((e) => e._id);

    if (toUnequip.length > 0) {
      await UserInventory.updateMany(
        { _id: { $in: toUnequip } },
        { isEquipped: false }
      );
    }

    // Limpiar referencia en usuario
    const activeField = type === "frame" ? "activeFrame" : "activeBackground";
    await User.findByIdAndUpdate(userId, { [activeField]: null });

    res.json({ message: "Item desequipado" });
  } catch (err) {
    console.error("unequipItem error:", err);
    res.status(500).json({ message: "Error al desequipar el item" });
  }
};