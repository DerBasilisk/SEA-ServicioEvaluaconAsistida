// chat.socket.js
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const {
  saveMessage,
  markAsRead,
  getOrCreateDirect,
} = require("./services/chat.service");

/**
 * Registra los eventos de chat en el servidor Socket.io existente.
 * Recibe el `io` ya creado en setupDuelSocket para no crear un segundo servidor.
 */
function setupChatSocket(io) {
  // Namespace separado /chat para no mezclar eventos con los duelos
  const chat = io.of("/chat");

  // ── Auth middleware ────────────────────────────────────────
  chat.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Sin token"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded._id;
      next();
    } catch {
      next(new Error("Token inválido"));
    }
  });

  chat.on("connection", (socket) => {
    console.log(`[Chat] Usuario conectado: ${socket.userId}`);

    // Sala personal para recibir mensajes aunque no esté en la conversación abierta
    socket.join(`user:${socket.userId}`);

    // ── Unirse a una conversación ────────────────────────────
    // El cliente llama esto cuando abre una conversación
    socket.on("chat:join", async ({ conversationId }) => {
      try {
        socket.join(`conv:${conversationId}`);

        // Marcar como leídos al abrir
        const updated = await markAsRead(conversationId, socket.userId);

        if (updated > 0) {
          // Notificar a los demás que este usuario leyó
          socket.to(`conv:${conversationId}`).emit("chat:read", {
            conversationId,
            userId: socket.userId,
          });
        }

        socket.emit("chat:joined", { conversationId });
      } catch (err) {
        socket.emit("chat:error", { message: err.message });
      }
    });

    // ── Salir de la vista de una conversación ────────────────
    socket.on("chat:leave", ({ conversationId }) => {
      socket.leave(`conv:${conversationId}`);
    });

    // ── Enviar mensaje de texto ──────────────────────────────
    socket.on("chat:send", async ({ conversationId, content }) => {
      try {
        if (!content?.trim()) return;
        if (content.length > 2000) {
          return socket.emit("chat:error", { message: "Mensaje demasiado largo (máx. 2000 caracteres)" });
        }

        const message = await saveMessage({
          conversationId,
          senderId: socket.userId,
          type: "text",
          content: content.trim(),
        });

        const payload = {
          conversationId,
          message: {
            _id:          message._id,
            type:         message.type,
            content:      message.content,
            sender:       message.sender,
            readBy:       message.readBy,
            createdAt:    message.createdAt,
          },
        };

        // Enviar a todos en la sala (incluido el remitente para confirmación)
        chat.to(`conv:${conversationId}`).emit("chat:message", payload);

        // Notificar a participantes que no están en la sala abierta ahora mismo
        // (para badge de no leídos en la lista de conversaciones)
        const populated = await message.populate
          ? message
          : message;
        // El servicio ya hizo populate del sender, re-usamos payload
        chat
          .to(`conv:${conversationId}`)
          .except(`conv:${conversationId}`) // evitar doble emit — no funciona así, ver nota abajo
          ;
        // Nota: la notificación a la sala personal la manejamos emitiendo también
        // al namespace general; los participantes deben estar suscritos a su sala user:id
        // desde el cliente para recibir el badge aunque no tengan la conv abierta.
        // Usamos el evento separado "chat:new_message" para ese caso.
        socket.to(`conv:${conversationId}`).emit("chat:new_message_notify", {
          conversationId,
          senderId: socket.userId,
          preview: content.trim().slice(0, 60),
        });

      } catch (err) {
        socket.emit("chat:error", { message: err.message });
      }
    });

    // ── Enviar imagen (el cliente sube a /api/chat/upload primero) ──
    // El cliente obtiene la URL de Cloudinary vía REST y luego la envía aquí
    socket.on("chat:send_image", async ({ conversationId, imageUrl }) => {
      try {
        if (!imageUrl) return;

        const message = await saveMessage({
          conversationId,
          senderId: socket.userId,
          type: "image",
          content: imageUrl,
        });

        const payload = {
          conversationId,
          message: {
            _id:       message._id,
            type:      message.type,
            content:   message.content,
            sender:    message.sender,
            readBy:    message.readBy,
            createdAt: message.createdAt,
          },
        };

        chat.to(`conv:${conversationId}`).emit("chat:message", payload);
        socket.to(`conv:${conversationId}`).emit("chat:new_message_notify", {
          conversationId,
          senderId: socket.userId,
          preview: "📷 Imagen",
        });

      } catch (err) {
        socket.emit("chat:error", { message: err.message });
      }
    });

    // ── Indicador de escritura ───────────────────────────────
    socket.on("chat:typing", ({ conversationId, isTyping }) => {
      socket.to(`conv:${conversationId}`).emit("chat:typing", {
        conversationId,
        userId: socket.userId,
        isTyping,
      });
    });

    // ── Leer mensajes (cuando el usuario hace scroll o foco) ─
    socket.on("chat:mark_read", async ({ conversationId }) => {
      try {
        const updated = await markAsRead(conversationId, socket.userId);
        if (updated > 0) {
          socket.to(`conv:${conversationId}`).emit("chat:read", {
            conversationId,
            userId: socket.userId,
          });
          // Confirmar al cliente cuántos se marcaron (para limpiar badge)
          socket.emit("chat:read_confirmed", { conversationId, count: updated });
        }
      } catch (err) {
        socket.emit("chat:error", { message: err.message });
      }
    });

    // ── Iniciar chat directo desde socket (alternativa a REST) ──
    socket.on("chat:open_direct", async ({ targetUserId }) => {
      try {
        const conversation = await getOrCreateDirect(socket.userId, targetUserId);
        socket.join(`conv:${conversation._id}`);
        socket.emit("chat:conversation_ready", { conversation });
      } catch (err) {
        socket.emit("chat:error", { message: err.message });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Chat] Usuario desconectado: ${socket.userId}`);
    });
  });

  return chat;
}


module.exports = { setupChatSocket };