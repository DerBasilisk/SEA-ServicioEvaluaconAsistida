import { create } from 'zustand';

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
};

const applyColorblind = (enabled, type = "deuteranopia") => {
  document.documentElement.setAttribute("data-colorblind", enabled ? "true" : "false");
  document.documentElement.setAttribute("data-colorblind-type", enabled ? type : "none");
};

const useThemeStore = create((set) => ({
  theme: localStorage.getItem("sea_theme") || "light",
  colorblind: localStorage.getItem("sea_colorblind") === "true",
  colorblindType: localStorage.getItem("sea_colorblind_type") || "deuteranopia",

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
    applyColorblind(next, state.colorblindType);
    return { colorblind: next };
  }),

  setColorblindType: (type) => set((state) => {
    localStorage.setItem("sea_colorblind_type", type);
    if (state.colorblind) applyColorblind(true, type);
    return { colorblindType: type };
  }),
}));

const initialTheme = localStorage.getItem("sea_theme") || "light";
const initialColorblind = localStorage.getItem("sea_colorblind") === "true";
const initialType = localStorage.getItem("sea_colorblind_type") || "deuteranopia";
applyTheme(initialTheme);
applyColorblind(initialColorblind, initialType);

export default useThemeStore;