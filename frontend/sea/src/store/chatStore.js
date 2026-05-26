// src/store/chatStore.js
import { create } from "zustand";
import { io } from "socket.io-client";
import api from "../api/axios";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

const useChatStore = create((set, get) => ({
  // ── Socket ──────────────────────────────────────────────────
  socket: null,
  connected: false,

  // ── Estado ──────────────────────────────────────────────────
  conversations: [],         // lista de conversaciones del usuario
  activeConvId: null,        // conversación actualmente abierta
  messages: {},              // { [convId]: Message[] }
  hasMore: {},               // { [convId]: boolean } paginación
  typing: {},                // { [convId]: string[] } userIds escribiendo
  unread: {},                // { [convId]: number }

  // ── Socket lifecycle ─────────────────────────────────────────
  connect: (token) => {
    if (get().socket) return; // ya conectado

    const socket = io(`${SOCKET_URL}/chat`, {
      auth: { token },
      path: "/socket.io",
    });

    socket.on("connect", () => {
      set({ connected: true });
    });

    socket.on("disconnect", () => {
      set({ connected: false });
    });

  socket.on("chat:message", ({ conversationId, message }) => {
  set((state) => {
    const prev = state.messages[conversationId] || [];
    if (prev.find((m) => m._id === message._id)) return state;

    const convExists = state.conversations.find(c => c._id === conversationId);

    // Siempre recarga si la conv no existe O si no tiene participantes cargados
    if (!convExists || !convExists.participants?.length) {
      get().loadConversations();
    }

    const updatedConvs = convExists
      ? state.conversations
          .map(c => c._id === conversationId
            ? { ...c, lastMessage: message, lastActivity: message.createdAt }
            : c
          )
          .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
      : state.conversations; // se actualiza cuando llegue loadConversations

    const newUnread = { ...state.unread };
    if (state.activeConvId !== conversationId) {
      newUnread[conversationId] = (newUnread[conversationId] || 0) + 1;
    }

    return {
      messages: { ...state.messages, [conversationId]: [...prev, message] },
      conversations: updatedConvs,
      unread: newUnread,
    };
  });
});

    // Indicador de escritura
    socket.on("chat:typing", ({ conversationId, userId, isTyping }) => {
      set((state) => {
        const current = state.typing[conversationId] || [];
        const updated = isTyping
          ? [...new Set([...current, userId])]
          : current.filter((id) => id !== userId);
        return { typing: { ...state.typing, [conversationId]: updated } };
      });
    });

    // Otro usuario leyó mensajes
    socket.on("chat:read", ({ conversationId, userId }) => {
      set((state) => {
        const msgs = (state.messages[conversationId] || []).map((m) => ({
          ...m,
          readBy: m.readBy?.includes(userId) ? m.readBy : [...(m.readBy || []), userId],
        }));
        return { messages: { ...state.messages, [conversationId]: msgs } };
      });
    });

    // Confirmación de que yo leí (limpiar badge)
    socket.on("chat:read_confirmed", ({ conversationId }) => {
      set((state) => ({
        unread: { ...state.unread, [conversationId]: 0 },
      }));
    });

    // Conversación directa creada/encontrada via socket
    socket.on("chat:conversation_ready", ({ conversation }) => {
      set((state) => {
        const exists = state.conversations.find((c) => c._id === conversation._id);
        return {
          conversations: exists
            ? state.conversations
            : [conversation, ...state.conversations],
        };
      });
    });

    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, connected: false });
  },

  refreshMessages: async (convId) => {
    const { messages } = get();
    const cached = messages[convId] || [];
    try {
      const { data } = await api.get(`/chat/conversations/${convId}/messages`);
      const fresh = data.messages || [];
      // Merge: mantén los del cache que no estén en fresh (optimistas), agrega los nuevos
      const merged = fresh.map(m => {
        const cached = (messages[convId] || []).find(c => c._id === m._id);
        return cached || m;
      });
      // Agrega cualquier mensaje del cache que no esté en fresh (enviados offline)
      const freshIds = new Set(fresh.map(m => m._id));
      const extra = cached.filter(m => !freshIds.has(m._id));
      set((state) => ({
        messages: { ...state.messages, [convId]: [...merged, ...extra].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)) },
      }));
    } catch (err) {
      console.error("[Chat] refreshMessages:", err);
    }
  },

  // ── REST: cargar conversaciones ──────────────────────────────
  loadConversations: async () => {
    try {
      const [convRes, unreadRes] = await Promise.all([
        api.get("/chat/conversations"),
        api.get("/chat/unread"),
      ]);
      set({
        conversations: convRes.data.conversations || [],
        unread: unreadRes.data.unread || {},
      });
    } catch (err) {
      console.error("[Chat] loadConversations:", err);
    }
  },

  // ── Abrir conversación ───────────────────────────────────────
  openConversation: async (convId) => {
    const { socket, activeConvId, messages } = get();

    // Salir de la anterior
    if (activeConvId && activeConvId !== convId) {
      socket?.emit("chat:leave", { conversationId: activeConvId });
    }

    set({ activeConvId: convId });
    socket?.emit("chat:join", { conversationId: convId });

    if (!messages[convId]) {
      try {
        const { data } = await api.get(`/chat/conversations/${convId}/messages`);
        set((state) => ({
          messages: { ...state.messages, [convId]: data.messages || [] },
          hasMore: { ...state.hasMore, [convId]: (data.messages || []).length === 30 },
          unread: { ...state.unread, [convId]: 0 },
        }));
      } catch (err) {
        console.error("[Chat] loadMessages:", err);
      }
    } else {
      // Ya estaba cacheado, solo limpiar badge
      set((state) => ({ unread: { ...state.unread, [convId]: 0 } }));
      socket?.emit("chat:mark_read", { conversationId: convId });
    }
  },

  closeConversation: () => {
    const { socket, activeConvId } = get();
    if (activeConvId) socket?.emit("chat:leave", { conversationId: activeConvId });
    set({ activeConvId: null });
  },

  // ── Mensajes ─────────────────────────────────────────────────
  loadMoreMessages: async (convId) => {
    const msgs = get().messages[convId] || [];
    if (!msgs.length) return;
    try {
      const { data } = await api.get(
        `/chat/conversations/${convId}/messages?before=${msgs[0]._id}`
      );
      set((state) => ({
        messages: {
          ...state.messages,
          [convId]: [...(data.messages || []), ...msgs],
        },
        hasMore: { ...state.hasMore, [convId]: (data.messages || []).length === 30 },
      }));
    } catch (err) {
      console.error("[Chat] loadMoreMessages:", err);
    }
  },

  sendMessage: (convId, content) => {
    const { socket } = get();
    if (!socket || !content?.trim()) return;
    socket.emit("chat:send", { conversationId: convId, content: content.trim() });
  },

  editMessage: async (msgId, convId, newContent) => {
    // Actualización optimista
    get().updateMessageLocally(convId, msgId, { content: newContent, edited: true });
    get().socket?.emit("chat:edit", { messageId: msgId, content: newContent });
  },

  sendImage: async (convId, file) => {
    const formData = new FormData();
    formData.append("image", file);
    const { data } = await api.post("/chat/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    get().socket?.emit("chat:send_image", {
      conversationId: convId,
      imageUrl: data.url,
    });
  },

  deleteMessage: async (messageId, convId) => {
    await api.delete(`/chat/messages/${messageId}`);
    set((state) => ({
      messages: {
        ...state.messages,
        [convId]: (state.messages[convId] || []).map((m) =>
          m._id === messageId ? { ...m, deletedAt: new Date().toISOString() } : m
        ),
      },
    }));
  },

  // ── Typing ───────────────────────────────────────────────────
  _typingTimer: null,
  emitTyping: (convId) => {
    const { socket, _typingTimer } = get();
    if (!socket) return;
    if (_typingTimer) clearTimeout(_typingTimer);
    socket.emit("chat:typing", { conversationId: convId, isTyping: true });
    const timer = setTimeout(() => {
      socket.emit("chat:typing", { conversationId: convId, isTyping: false });
      set({ _typingTimer: null });
    }, 2000);
    set({ _typingTimer: timer });
  },

  // ── Conversaciones ───────────────────────────────────────────
  openDirect: async (targetUserId) => {
    const { data } = await api.post("/chat/conversations/direct", { targetUserId });
    set((state) => {
      const exists = state.conversations.find((c) => c._id === data.conversation._id);
      return {
        conversations: exists
          ? state.conversations
          : [data.conversation, ...state.conversations],
      };
    });
    return data.conversation;
  },

  createGroup: async ({ name, participantIds }) => {
    const { data } = await api.post("/chat/conversations/group", {
      name,
      participantIds,
    });
    set((state) => ({
      conversations: [data.conversation, ...state.conversations],
    }));
    return data.conversation;
  },

  leaveGroup: async (convId) => {
    await api.delete(`/chat/conversations/${convId}/participants/me`);
    set((state) => ({
      conversations: state.conversations.filter((c) => c._id !== convId),
      activeConvId: state.activeConvId === convId ? null : state.activeConvId,
    }));
  },

  // ── Selector helpers ─────────────────────────────────────────
  getUnreadTotal: () =>
    Object.values(get().unread).reduce((sum, n) => sum + n, 0),

  getActiveConversation: () =>
    get().conversations.find((c) => c._id === get().activeConvId) || null,
}));

export default useChatStore;