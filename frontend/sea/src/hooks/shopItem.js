// src/utils/shopItem.js

/* ── Mapeo de nombre de tema → key en themeVariants ─────────────── */
const THEME_KEY = {
  "light":          "light",
  "dark":           "dark",
  "high-contrast":  "highContrast",
};

/* ── Color del trazo SVG por tema ───────────────────────────────────
   Se usa para reemplazar "currentColor" en el SVG antes de
   convertirlo a data URI. Ajusta estos valores a los colores
   de acento de tu themeStore si los tienes definidos ahí.
─────────────────────────────────────────────────────────────────── */
const SVG_STROKE_COLOR = {
  "light":          "2B7FE8",  // azul acento — visible en fondo claro
  "dark":           "2B7FE8",  // mismo azul — visible en fondo oscuro
  "high-contrast":  "FFFFFF",  // blanco — máximo contraste
};

/**
 * Dado un item de background y el tema activo,
 * devuelve el string CSS para aplicar como `background` en el div raíz.
 *
 * Devuelve null si el item es de tipo SVG (se maneja como overlay aparte).
 */
export function resolveBackground(item, theme) {
  if (!item) return null;

  // SVG overlay — el fondo base lo pone el tema, no el item
  if (item.backgroundType === "svg") return null;

  // Gradiente con variantes por tema
  if (item.backgroundType === "gradient" && item.themeVariants) {
    const key = THEME_KEY[theme] || "dark";
    return item.themeVariants[key] || item.cssValue || null;
  }

  // Fallback: cssValue universal (comportamiento original)
  return item.cssValue || null;
}

/**
 * Dado un item de tipo SVG y el tema activo,
 * devuelve un objeto de estilos para aplicar al div overlay.
 *
 * Devuelve null si el item no es de tipo SVG.
 *
 * El objeto retornado es directamente usable como `style={...}`:
 * {
 *   backgroundImage: "url('data:image/svg+xml,...')",
 *   backgroundSize:  "40px 40px",
 *   backgroundRepeat: "repeat",
 *   opacity: 0.25,
 * }
 */
export function resolveSvgPattern(item, theme) {
  if (!item?.patternSvg || item.backgroundType !== "svg") return null;

  const color = SVG_STROKE_COLOR[theme] || SVG_STROKE_COLOR.dark;

  // Reemplazar "currentColor" por el hex del tema antes de encodear
  const svgWithColor = item.patternSvg.replace(/currentColor/g, `#${color}`);

  // Encodear a data URI (más compatible que btoa para SVG)
  const encoded = encodeURIComponent(svgWithColor)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");

  return {
    backgroundImage:  `url("data:image/svg+xml,${encoded}")`,
    backgroundSize:   item.patternSize  || "40px 40px",
    backgroundRepeat: "repeat",
    opacity:          item.patternOpacity ?? 0.25,
  };
}

/**
 * Devuelve el modo de render del item.
 * Útil para decidir cómo previsualizarlo en la tienda.
 *
 * "frame"    → box-shadow via cssValue
 * "gradient" → background con variantes por tema
 * "svg"      → overlay de patrón SVG
 * "css"      → cssValue directo (comportamiento original / fallback)
 */
export function getRenderMode(item) {
  if (!item) return null;
  if (item.type === "frame") return "frame";
  if (item.backgroundType === "svg") return "svg";
  if (item.backgroundType === "gradient" && item.themeVariants) return "gradient";
  return "css";
}