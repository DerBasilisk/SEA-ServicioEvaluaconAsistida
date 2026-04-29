const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
    },
    // Solo para grupos
    name: {
      type: String,
      trim: true,
      maxlength: [50, "Máximo 50 caracteres"],
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Referencia al último mensaje (para preview en lista de chats)
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índice para buscar conversaciones directas entre dos usuarios rápido
conversationSchema.index({ participants: 1, type: 1 });
conversationSchema.index({ lastActivity: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);