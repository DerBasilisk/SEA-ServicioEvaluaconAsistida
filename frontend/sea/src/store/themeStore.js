import { create } from 'zustand';

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
};

const applyColorblind = (enabled) => {
  document.documentElement.setAttribute("data-colorblind", enabled ? "true" : "false");
};

const useThemeStore = create((set) => ({
  theme: localStorage.getItem("sea_theme") || "light",
  colorblind: localStorage.getItem("sea_colorblind") === "true",

  setTheme: (newTheme) => {
    localStorage.setItem("sea_theme", newTheme);
    applyTheme(newTheme);
    set({ theme: newTheme });
  },

  cycleTheme: () => set((state) => {
    const themes = ['light', 'dark', 'high-contrast'];
    const next = themes[(themes.indexOf(state.theme) + 1) % themes.length];
    localStorage.setItem("sea_theme", next);
    applyTheme(next);
    return { theme: next };
  }),

  toggleColorblind: () => set((state) => {
    const next = !state.colorblind;
    localStorage.setItem("sea_colorblind", String(next));
    applyColorblind(next);
    return { colorblind: next };
  }),
}));

// Aplicar al cargar
const initialTheme = localStorage.getItem("sea_theme") || "light";
const initialColorblind = localStorage.getItem("sea_colorblind") === "true";
applyTheme(initialTheme);
applyColorblind(initialColorblind);

export default useThemeStore;