const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "duel_invite", "duel_result"],
      default: "text",
    },
    // Metadata del duelo (opcional)
    duelData: {
      duelId: { type: String },
      resultSummary: { type: mongoose.Schema.Types.Mixed }, // { winnerName, loserName, winnerScore, ... }
      inviteCode: { type: String },
      expiresAt: { type: Date }, // para invitaciones temporales
    },
    // Texto del mensaje o URL de imagen en Cloudinary
    content: {
      type: String,
      default: "",
      maxlength: [2000, "Máximo 2000 caracteres"],
    },
    // IDs de usuarios que ya leyeron el mensaje
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Soft delete: el mensaje no se borra, solo se oculta
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índice principal: obtener mensajes de una conversación ordenados por fecha
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model("Message", messageSchema);