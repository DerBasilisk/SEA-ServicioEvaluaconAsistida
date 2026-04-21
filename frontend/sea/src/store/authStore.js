// frontend/sea/src/store/authStore.js
import { create } from "zustand";
import api from "../api/axios";

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem("sea_token") || null,
  loading: true, 
  error: null,

  // 👇 1. ESTA ES LA FUNCIÓN QUE TE FALTABA
  setUser: (userData) => set({ user: userData }),

  // ==================== CARGAR USUARIO ====================
  // (Dejé la versión más completa de tu fetchMe y borré la duplicada)
  fetchMe: async () => {
    const token = localStorage.getItem("sea_token");
    if (!token) {
      set({ user: null, loading: false });
      return;
    }

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    // No seteamos loading en true aquí si ya arranca en true por defecto,
    // pero si lo llamas manualmente después, es buena idea.

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

  // ==================== LOGIN NORMAL ====================
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
        user: null 
      });
      return { ok: false, message: errorMsg };
    }
  },

  // ==================== REGISTRO ====================
  register: async (username, email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/users/register", { username, email, password });
      const { token, user } = data.data || data;

      localStorage.setItem("sea_token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      set({ user, token, loading: false });
      return { ok: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Error al crear la cuenta";
      set({ error: msg, loading: false });
      return { ok: false, message: msg };
    }
  },

  // ==================== LOGIN CON TOKEN ====================
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
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),

  // ==================== HELPERS ====================
  isAdmin: () => ["admin", "superadmin"].includes(get().user?.role),
  isSuperAdmin: () => get().user?.role === "superadmin",
  isAuthenticated: () => !!get().user,
}));

export default useAuthStore;