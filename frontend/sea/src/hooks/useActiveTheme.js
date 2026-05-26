// src/hooks/useActiveTheme.js
import { useEffect, useState } from "react";

/**
 * Devuelve el tema activo leyendo el atributo data-theme del <html>.
 * Se actualiza automáticamente cuando themeStore cambia el tema.
 *
 * Retorna: "light" | "dark" | "high-contrast"
 */
export function useActiveTheme() {
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute("data-theme") || "dark";
  });

  useEffect(() => {
    const read = () => {
      const t = document.documentElement.getAttribute("data-theme") || "dark";
      setTheme(t);
    };

    // Observar cambios en el atributo data-theme del <html>
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}