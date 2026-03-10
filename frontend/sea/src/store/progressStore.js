import { create } from "zustand";
import api from "../api/axios";

const useProgressStore = create((set) => ({
  progress: null,
  leaderboard: null,
  achievements: [],
  loading: false,

  fetchProgress: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/progress/me");
      set({ progress: data.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchLeaderboard: async () => {
    try {
      const { data } = await api.get("/progress/leaderboard");
      set({ leaderboard: data.data });
    } catch {}
  },

  fetchAchievements: async () => {
    try {
      const { data } = await api.get("/progress/achievements");
      set({ achievements: data.data });
    } catch {}
  },

  refillHearts: async () => {
    try {
      const { data } = await api.post("/progress/refill-hearts");
      return { ok: true, data: data.data };
    } catch (err) {
      return { ok: false, message: err.response?.data?.message };
    }
  },
}));

export default useProgressStore;
