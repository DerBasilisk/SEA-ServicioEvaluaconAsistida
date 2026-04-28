import { useEffect, useRef } from "react";
import useThemeStore from "../store/themeStore";

/**
 * Fuerza data-theme y desactiva daltonismo SÍNCRONAMENTE en el primer render,
 * antes de que el navegador pinte nada. Al desmontar restaura el tema del usuario.
 */
export function useForceTheme(theme = "light") {
  const applied = useRef(false);

  // ── Aplicación síncrona (durante el render, no en un efecto) ──────────────
  // Esto corre antes del primer paint — cero flash.
  if (!applied.current) {
    applied.current = true;
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-colorblind", "false");
    document.documentElement.setAttribute("data-colorblind-type", "none");
  }

  // ── Restauración al desmontar (navegar a otra ruta) ───────────────────────
  useEffect(() => {
    // Capturamos el estado del usuario en el momento del montaje
    const { theme: userTheme, colorblind, colorblindType } =
      useThemeStore.getState();

    return () => {
      document.documentElement.setAttribute("data-theme", userTheme);
      document.documentElement.setAttribute("data-colorblind", String(colorblind));
      document.documentElement.setAttribute(
        "data-colorblind-type",
        colorblind ? colorblindType : "none"
      );
    };
  }, []);
}