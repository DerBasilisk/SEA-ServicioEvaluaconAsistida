// ─── AGREGAR dentro de tu models/index.js existente ───────────────────────────
//
// 1. Importa los nuevos modelos junto a los demás:
const ShopItem     = require("./shopItem")(sequelize);
const UserInventory = require("./userInventory")(sequelize);

// 2. Agrégalos al objeto db:
db.ShopItem      = ShopItem;
db.UserInventory = UserInventory;

// 3. Asegúrate de que el bloque de asociaciones los incluya.
//    Si tu index.js ya hace:
//      Object.keys(db).forEach(modelName => {
//        if (db[modelName].associate) db[modelName].associate(db);
//      });
//    entonces no necesitas hacer nada más — las asociaciones se corren solas.
//
// ──────────────────────────────────────────────────────────────────────────────

// 4. Agrega en models/user.js los campos de equipamiento activo:
//
//    activeFrameId: {
//      type: DataTypes.INTEGER,
//      allowNull: true,
//      defaultValue: null,
//    },
//    activeBackgroundId: {
//      type: DataTypes.INTEGER,
//      allowNull: true,
//      defaultValue: null,
//    },
//
//    Y en User.associate:
//      User.hasMany(models.UserInventory, { foreignKey: "userId", as: "inventory" });
//      User.belongsTo(models.ShopItem, { foreignKey: "activeFrameId",      as: "activeFrame" });
//      User.belongsTo(models.ShopItem, { foreignKey: "activeBackgroundId", as: "activeBackground" });
