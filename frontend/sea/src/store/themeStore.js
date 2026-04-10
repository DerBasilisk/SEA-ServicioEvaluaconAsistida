import { create } from 'zustand';

const useThemeStore = create((set) => ({
  // Soporta: 'light', 'dark', 'high-contrast'
  theme: localStorage.getItem("sea_theme") || "light",
  
  setTheme: (newTheme) => {
    localStorage.setItem("sea_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    set({ theme: newTheme });
  },

  // Función para rotar entre los 3 temas
  cycleTheme: () => set((state) => {
    const themes = ['light', 'dark', 'high-contrast'];
    const currentIndex = themes.indexOf(state.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const next = themes[nextIndex];
    
    localStorage.setItem("sea_theme", next);
    document.documentElement.setAttribute("data-theme", next);
    return { theme: next };
  }),
}));

// Aplicar al cargar
const initialTheme = localStorage.getItem("sea_theme") || "light";
document.documentElement.setAttribute("data-theme", initialTheme);

export default useThemeStore;