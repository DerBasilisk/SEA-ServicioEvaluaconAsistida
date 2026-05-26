const mongoose = require("mongoose");

const userInventorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopItem",
      required: true,
    },
    isEquipped: {
      type: Boolean,
      default: false,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Un usuario no puede tener el mismo item dos veces
userInventorySchema.index({ userId: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model("UserInventory", userInventorySchema);