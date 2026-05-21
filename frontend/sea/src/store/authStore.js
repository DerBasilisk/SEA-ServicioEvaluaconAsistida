// frontend/sea/src/store/authStore.js
import { create } from "zustand";
import api from "../api/axios";
import { disconnectDuelSocket } from "../api/duelSocket";

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem("sea_token") || null,
  loading: true,
  error: null,

  setUser: (userData) => set({ user: userData }),

  fetchMe: async () => {
    const token = localStorage.getItem("sea_token");
    if (!token) {
      set({ user: null, loading: false });
      return;
    }
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    try {
      const { data } = await api.get("/users/me");
      set({ user: data.data || data, loading: false });
    } catch (err) {
      console.error("fetchMe failed", err);
      localStorage.removeItem("sea_token");
      delete api.defaults.headers.common["Authorization"];
      set({ user: null, token: null, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/users/login", { email, password });
      const token = res.data.token;
      const user = res.data.data;

      if (!token) throw new Error("No se recibió un token del servidor");

      localStorage.setItem("sea_token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      set({ user, token, loading: false });
      return { ok: true, isAdmin: ["admin", "superadmin"].includes(user?.role) };
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.message || "Error al iniciar sesión",
        user: null,
      });
      return { ok: false, message: err.response?.data?.message || "Error al iniciar sesión" };
    }
  },

  // ✅ REGISTRO ACTUALIZADO (sin autenticación automática)
  register: async (username, email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/users/register", { username, email, password });
      set({ loading: false });
      return { ok: true, message: data.message, email: data.data?.email };
    } catch (err) {
      const msg = err.response?.data?.message || "Error al crear la cuenta";
      set({ error: msg, loading: false });
      return { ok: false, message: msg };
    }
  },

  // ✅ REENVÍO DE VERIFICACIÓN
  resendVerification: async (email) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/users/resend-verification", { email });
      set({ loading: false });
      return { ok: true, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || "Error al reenviar verificación";
      set({ error: msg, loading: false });
      return { ok: false, message: msg };
    }
  },

  loginWithToken: async (token) => {
    if (!token) return;
    localStorage.setItem("sea_token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    set({ token });
    try {
      const { data } = await api.get("/users/me");
      set({ user: data.data || data });
      return { ok: true, isAdmin: ["admin", "superadmin"].includes((data.data || data).role) };
    } catch (err) {
      console.error("Error cargando usuario con token", err);
      set({ user: null });
      return { ok: false };
    }
  },

  logout: () => {
    localStorage.removeItem("sea_token");
    delete api.defaults.headers.common["Authorization"];
    disconnectDuelSocket();
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),

  isAdmin: () => ["admin", "superadmin"].includes(get().user?.role),
  isSuperAdmin: () => get().user?.role === "superadmin",
  isAuthenticated: () => !!get().user,
}));

export default useAuthStore;