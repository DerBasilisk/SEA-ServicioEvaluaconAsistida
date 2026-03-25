// frontend/sea/src/store/authStore.js
import { create } from "zustand";
import api from "../api/axios";

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem("sea_token") || null,
  loading: false,
  error: null,

  // ==================== LOGIN NORMAL ====================
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/users/login", { email, password });

      const { token, user } = data.data || data; // por si cambia la estructura

      localStorage.setItem("sea_token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      set({ user, token, loading: false });
      
      // Redirección inteligente según rol
      return { 
        ok: true, 
        isAdmin: user.role === "admin" 
      };
    } catch (err) {
      const msg = err.response?.data?.message || "Error al iniciar sesión";
      set({ error: msg, loading: false });
      return { ok: false, message: msg };
    }
  },

  // ==================== LOGIN CON TOKEN (OAuth, etc) ====================
  loginWithToken: async (token) => {
    if (!token) return;

    localStorage.setItem("sea_token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    set({ token });

    try {
      const { data } = await api.get("/users/me");
      set({ user: data.data || data });
      return { ok: true, isAdmin: (data.data || data).role === "admin" };
    } catch (err) {
      console.error("Error cargando usuario con token", err);
      set({ user: null });
      return { ok: false };
    }
  },

  // ==================== CARGAR USUARIO (al refrescar página) ====================
  fetchMe: async () => {
    const token = localStorage.getItem("sea_token");
    if (!token) return;

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    set({ loading: true });

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

  logout: () => {
    localStorage.removeItem("sea_token");
    delete api.defaults.headers.common["Authorization"];
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),

  // ==================== HELPERS ====================
  isAdmin: () => {
    return get().user?.role === "admin";
  },

  isAuthenticated: () => {
    return !!get().user;
  },
}));

export default useAuthStore;