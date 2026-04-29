const chatService = require("../services/chat.service");

// ── Conversaciones ─────────────────────────────────────────────

/**
 * GET /api/chat/conversations
 * Lista todas las conversaciones del usuario autenticado.
 */
async function getConversations(req, res) {
  try {
    const conversations = await chatService.getUserConversations(req.usuario._id);
    res.json({ ok: true, conversations });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
}

/**
 * POST /api/chat/conversations/direct
 * Body: { targetUserId }
 * Obtiene o crea una conversación directa.
 */
async function openDirect(req, res) {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ ok: false, message: "targetUserId requerido" });
    if (String(targetUserId) === String(req.usuario._id)) {
      return res.status(400).json({ ok: false, message: "No puedes abrir un chat contigo mismo" });
    }

    const conversation = await chatService.getOrCreateDirect(req.usuario._id, targetUserId);
    res.json({ ok: true, conversation });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
}

/**
 * POST /api/chat/conversations/group
 * Body: { name, participantIds[] }
 * Crea un grupo nuevo.
 */
async function createGroup(req, res) {
  try {
    const { name, participantIds } = req.body;
    if (!name?.trim()) return res.status(400).json({ ok: false, message: "Nombre del grupo requerido" });
    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ ok: false, message: "Se requiere al menos un participante" });
    }

    const conversation = await chatService.createGroup({
      name: name.trim(),
      participantIds,
      creatorId: req.usuario._id,
    });
    res.status(201).json({ ok: true, conversation });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
}

/**
 * POST /api/chat/conversations/:id/participants
 * Body: { userId }
 * Agrega un participante a un grupo.
 */
async function addParticipant(req, res) {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ ok: false, message: "userId requerido" });

    const conversation = await chatService.addParticipant(
      req.params.id,
      userId,
      req.usuario._id
    );
    res.json({ ok: true, conversation });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
}

/**
 * DELETE /api/chat/conversations/:id/participants/me
 * El usuario autenticado sale del grupo.
 */
async function leaveGroup(req, res) {
  try {
    const result = await chatService.removeParticipant(req.params.id, req.usuario._id);
    res.json({ ok: true, deleted: result === null });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
}

// ── Mensajes ───────────────────────────────────────────────────

/**
 * GET /api/chat/conversations/:id/messages?before=<messageId>
 * Historial con paginación por cursor.
 */
async function getMessages(req, res) {
  try {
    const { before } = req.query;
    const messages = await chatService.getMessages(
      req.params.id,
      req.usuario._id,
      { before }
    );
    res.json({ ok: true, messages });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
}

/**
 * GET /api/chat/unread
 * Devuelve objeto { conversationId: count } con mensajes no leídos.
 */
async function getUnread(req, res) {
  try {
    const counts = await chatService.getUnreadCounts(req.usuario._id);
    res.json({ ok: true, unread: counts });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
}

/**
 * DELETE /api/chat/messages/:id
 * Soft-delete de un mensaje propio.
 */
async function deleteMessage(req, res) {
  try {
    await chatService.deleteMessage(req.params.id, req.usuario._id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
}

/**
 * POST /api/chat/upload
 * Sube una imagen de chat a Cloudinary y devuelve la URL.
 * El cliente luego emite chat:send_image con esa URL por socket.
 */
async function uploadChatImage(req, res) {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: "No se recibió imagen" });
    const { uploadChatImage: upload } = require("../services/upload.service");
    const result = await upload(req.file.buffer, req.usuario._id);
    res.json({ ok: true, url: result.secure_url });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
}

module.exports = {
  getConversations,
  openDirect,
  createGroup,
  addParticipant,
  leaveGroup,
  getMessages,
  getUnread,
  deleteMessage,
  uploadChatImage,
};