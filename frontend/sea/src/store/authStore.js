import { create } from "zustand";
import api from "../api/axios";

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("sea_token") || null,
  loading: false,
  error: null,

  register: async (username, email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/users/register", { username, email, password });
      localStorage.setItem("sea_token", data.token);
      set({ user: data.data, token: data.token, loading: false });
      return { ok: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Error al registrarse";
      set({ error: msg, loading: false });
      return { ok: false, message: msg };
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/users/login", { email, password });
      localStorage.setItem("sea_token", data.token);
      set({ user: data.data, token: data.token, loading: false });
      return { ok: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Error al iniciar sesión";
      set({ error: msg, loading: false });
      return { ok: false, message: msg };
    }
  },

  loginWithToken: async (token) => {
    localStorage.setItem("sea_token", token);
    set({ token });
    try {
      const { data } = await api.get("/users/me");
      set({ user: data.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("sea_token");
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/users/me");
      set({ user: data.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
