const Conversation = require("../models/conversation");
const Message = require("../models/message");

const MESSAGES_PER_PAGE = 30;

// ── Conversaciones ─────────────────────────────────────────────

/**
 * Obtiene o crea una conversación directa entre dos usuarios.
 * Garantiza que no existan duplicados.
 */
async function getOrCreateDirect(userIdA, userIdB) {
  const existing = await Conversation.findOne({
    type: "direct",
    participants: { $all: [userIdA, userIdB], $size: 2 },
  })
    .populate("participants", "username displayName avatar")
    .populate({ path: "lastMessage", populate: { path: "sender", select: "username avatar" } });

  if (existing) return existing;

  const conversation = await Conversation.create({
    type: "direct",
    participants: [userIdA, userIdB],
  });

  return conversation.populate("participants", "username displayName avatar");
}

/**
 * Crea un grupo con nombre, participantes y creador.
 */
async function createGroup({ name, participantIds, creatorId }) {
  // El creador siempre está incluido
  const allParticipants = [...new Set([creatorId, ...participantIds])];

  if (allParticipants.length < 2) {
    throw new Error("Un grupo necesita al menos 2 participantes");
  }
  if (allParticipants.length > 50) {
    throw new Error("Un grupo no puede tener más de 50 participantes");
  }

  const conversation = await Conversation.create({
    type: "group",
    name,
    participants: allParticipants,
    createdBy: creatorId,
  });

  return conversation.populate("participants", "username displayName avatar");
}

/**
 * Lista todas las conversaciones de un usuario, ordenadas por actividad reciente.
 */
async function getUserConversations(userId) {
  return Conversation.find({ participants: userId })
    .sort({ lastActivity: -1 })
    .populate("participants", "username displayName avatar")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username avatar" },
    });
}

/**
 * Agrega un participante a un grupo.
 */
async function addParticipant(conversationId, userId, requesterId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error("Conversación no encontrada");
  if (conversation.type !== "group") throw new Error("Solo se pueden agregar participantes a grupos");
  if (!conversation.participants.map(String).includes(requesterId)) {
    throw new Error("No eres participante de este grupo");
  }
  if (conversation.participants.length >= 50) {
    throw new Error("El grupo ya tiene el máximo de participantes");
  }

  conversation.participants.addToSet(userId);
  await conversation.save();
  return conversation.populate("participants", "username displayName avatar");
}

/**
 * Elimina a un participante de un grupo (o se sale solo).
 */
async function removeParticipant(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error("Conversación no encontrada");
  if (conversation.type !== "group") throw new Error("Solo aplica a grupos");

  conversation.participants.pull(userId);

  // Si queda vacío, eliminar
  if (conversation.participants.length === 0) {
    await conversation.deleteOne();
    return null;
  }

  // Si el creador se fue, pasar el rol al primer participante restante
  if (String(conversation.createdBy) === String(userId)) {
    conversation.createdBy = conversation.participants[0];
  }

  await conversation.save();
  return conversation;
}

// ── Mensajes ───────────────────────────────────────────────────

/**
 * Guarda un mensaje nuevo y actualiza lastMessage / lastActivity en la conversación.
 */
async function saveMessage({ conversationId, senderId, type = "text", content }) {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: senderId,
  });
  if (!conversation) throw new Error("Conversación no encontrada o no eres participante");

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    type,
    content,
    readBy: [senderId], // el remitente ya lo "leyó"
  });

  // Actualizar preview de la conversación
  conversation.lastMessage = message._id;
  conversation.lastActivity = new Date();
  await conversation.save();

  return message.populate("sender", "username displayName avatar");
}

/**
 * Obtiene mensajes de una conversación con paginación por cursor (más eficiente que offset).
 * @param {string} before - _id del mensaje más antiguo ya cargado (cursor)
 */
async function getMessages(conversationId, userId, { before = null, limit = MESSAGES_PER_PAGE } = {}) {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });
  if (!conversation) throw new Error("Conversación no encontrada o no eres participante");

  const query = {
    conversation: conversationId,
    deletedAt: null,
  };

  if (before) {
    const pivot = await Message.findById(before).select("createdAt");
    if (pivot) query.createdAt = { $lt: pivot.createdAt };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender", "username displayName avatar");

  return messages.reverse(); // devolver en orden cronológico
}

/**
 * Marca como leídos todos los mensajes no leídos de una conversación para un usuario.
 * Devuelve la cantidad de mensajes actualizados.
 */
async function markAsRead(conversationId, userId) {
  const result = await Message.updateMany(
    {
      conversation: conversationId,
      readBy: { $ne: userId },
      deletedAt: null,
    },
    { $addToSet: { readBy: userId } }
  );
  return result.modifiedCount;
}

/**
 * Cuenta los mensajes no leídos del usuario en todas sus conversaciones.
 * Útil para badges de notificación.
 */
async function getUnreadCounts(userId) {
  const conversations = await Conversation.find({ participants: userId }).select("_id");
  const conversationIds = conversations.map((c) => c._id);

  const pipeline = [
    {
      $match: {
        conversation: { $in: conversationIds },
        readBy: { $ne: userId },
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: "$conversation",
        count: { $sum: 1 },
      },
    },
  ];

  const results = await Message.aggregate(pipeline);
  // Convertir array a objeto { conversationId: count }
  return results.reduce((acc, { _id, count }) => {
    acc[_id.toString()] = count;
    return acc;
  }, {});
}

/**
 * Soft-delete de un mensaje (solo el remitente puede hacerlo).
 */
async function deleteMessage(messageId, userId) {
  const message = await Message.findOne({ _id: messageId, sender: userId });
  if (!message) throw new Error("Mensaje no encontrado o no eres el autor");
  message.deletedAt = new Date();
  await message.save();
  return message;
}

async function sendDuelResultMessage({ conversationId, duelId, winner, loser, totalQuestions, duration }) {
  if (!conversationId) return null;

  // Construir el resumen para mostrar en el frontend
  const resultSummary = {
    winnerName: winner.userName,
    loserName: loser.userName,
    winnerCorrect: winner.correct,
    loserCorrect: loser.correct,
    totalQuestions,
    duration, // segundos
  };

  const message = new Message({
    conversation: conversationId,
    sender: winner.userId, // el ganador aparece como "remitente" del mensaje de sistema (opcional)
    type: "duel_result",
    content: `⚔️ Duelo finalizado: ${winner.userName} venció a ${loser.userName} (${winner.correct}/${totalQuestions} vs ${loser.correct}/${totalQuestions})`,
    duelData: {
      duelId,
      resultSummary,
    },
    readBy: [], // nadie lo ha leído aún
  });

  await message.save();

  // Actualizar el campo lastMessage y lastActivity de la conversación
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
    lastActivity: new Date(),
  });

  // Poblar el sender para devolverlo con datos de usuario
  await message.populate("sender", "name avatar");

  return message;
}

module.exports = {
  getOrCreateDirect,
  createGroup,
  getUserConversations,
  addParticipant,
  removeParticipant,
  saveMessage,
  getMessages,
  markAsRead,
  getUnreadCounts,
  deleteMessage,
  sendDuelResultMessage,
};