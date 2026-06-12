import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Shield, Lock, Palette, Music, Info } from "lucide-react";

/* ─────────────────────────────────────────────
   Clave de consentimiento en localStorage
───────────────────────────────────────────── */
const CONSENT_KEY = "sea_consent";

/* ─────────────────────────────────────────────
   CSS del banner
───────────────────────────────────────────── */
const BANNER_CSS = `
  @keyframes banner-slide-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes banner-slide-down {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(24px); }
  }

  .cookie-banner {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 300;
    width: calc(100% - 32px);
    max-width: 680px;
    animation: banner-slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  .cookie-banner.closing {
    animation: banner-slide-down 0.25s ease both;
  }

  .cookie-card {
    background: var(--glass-bg-nice);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
    border-radius: 24px;
    overflow: hidden;
  }

  /* Panel de detalles expandible */
  .details-grid {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s ease;
  }
  .details-grid.open {
    grid-template-rows: 1fr;
  }
  .details-inner {
    overflow: hidden;
  }

  /* Fila de dato */
  .storage-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 12px;
    transition: background 0.15s;
  }
  .storage-row:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  /* Pill de categoría */
  .cat-pill {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 99px;
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    flex-shrink: 0;
  }

  /* Toggle switch */
  .toggle-track {
    width: 32px;
    height: 18px;
    border-radius: 99px;
    position: relative;
    flex-shrink: 0;
    transition: background 0.2s;
    cursor: default;
  }
  .toggle-thumb {
    position: absolute;
    top: 3px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    transition: left 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }
`;

/* ─────────────────────────────────────────────
   Datos exactos de lo que se almacena
───────────────────────────────────────────── */
const STORAGE_ITEMS = [
  {
    key: "sea_token",
    label: "Token de sesión",
    desc: "JWT que mantiene tu sesión activa. Se elimina al cerrar sesión.",
    category: "esencial",
    categoryColor: "#EF4444",
    categoryBg: "rgba(239,68,68,0.1)",
    icon: <Lock size={13} />,
    iconColor: "#EF4444",
    required: true,
  },
  {
    key: "sea_theme",
    label: "Tema visual",
    desc: "Guarda tu preferencia de tema: claro, oscuro o alto contraste.",
    category: "funcional",
    categoryColor: "#8B5CF6",
    categoryBg: "rgba(139,92,246,0.1)",
    icon: <Palette size={13} />,
    iconColor: "#8B5CF6",
    required: false,
  },
  {
    key: "sea_colorblind · sea_colorblind_type",
    label: "Modo accesibilidad",
    desc: "Recuerda si activaste el modo daltónico y qué tipo configuraste.",
    category: "funcional",
    categoryColor: "#8B5CF6",
    categoryBg: "rgba(139,92,246,0.1)",
    icon: <Palette size={13} />,
    iconColor: "#8B5CF6",
    required: false,
  },
  {
    key: "sea-audio",
    label: "Preferencias de audio",
    desc: "Volumen, pista activa, shuffle y estado de música/efectos.",
    category: "funcional",
    categoryColor: "#2B7FE8",
    categoryBg: "rgba(43,127,232,0.1)",
    icon: <Music size={13} />,
    iconColor: "#2B7FE8",
    required: false,
  },
];

/* ─────────────────────────────────────────────
   Componente principal
───────────────────────────────────────────── */
export default function CookieBanner() {
  const [visible,   setVisible]   = useState(false);
  const [closing,   setClosing]   = useState(false);
  const [expanded,  setExpanded]  = useState(false);
  // functional siempre true en este caso (no hay tracking ni publicidad)
  const [functional, setFunctional] = useState(true);

  // Mostrar solo si aún no hay consentimiento guardado
  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  const dismiss = (accepted) => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({
        version:    "1.0",
        date:       new Date().toISOString(),
        essential:  true,
        functional: accepted ? functional : false,
      })
    );
    setClosing(true);
    setTimeout(() => setVisible(false), 280);
  };

  if (!visible) return null;

  return (
    <>
      <style>{BANNER_CSS}</style>

      <div
        className={`cookie-banner ${closing ? "closing" : ""}`}
        role="dialog"
        aria-live="polite"
        aria-label="Aviso sobre almacenamiento de datos en el navegador"
      >
        <div className="cookie-card">

          {/* ── Header ── */}
          <div
            className="flex items-start gap-3 px-5 pt-5 pb-4"
            style={{ borderBottom: "1.5px solid var(--glass-border)" }}
          >
            {/* Icono */}
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 mt-0.5"
              aria-hidden="true"
              style={{
                background: "color-mix(in srgb, var(--text-accent) 12%, transparent)",
                border: "1.5px solid color-mix(in srgb, var(--text-accent) 25%, transparent)",
                color: "var(--text-accent)",
              }}
            >
              <Shield size={16} />
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <p
                className="text-[11px] font-black uppercase tracking-[0.2em] mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                Este sitio guarda datos en tu navegador
              </p>
              <p
                className="text-[11px] font-semibold leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                SEA usa <strong style={{ color: "var(--text-primary)" }}>localStorage</strong> para
                mantener tu sesión y recordar tus preferencias. No usamos cookies de publicidad
                ni compartimos datos con terceros.
              </p>
            </div>

            {/* Botón cerrar (solo acepta esenciales) */}
            <button
              onClick={() => dismiss(false)}
              aria-label="Cerrar y aceptar solo esenciales"
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                         hover:scale-105 active:scale-95"
              style={{
                background: "var(--card-bg)",
                border: "1.5px solid var(--glass-border)",
                color: "var(--text-secondary)",
              }}
            >
              <X size={13} />
            </button>
          </div>

          {/* ── Panel expandible: detalles ── */}
          <div className={`details-grid ${expanded ? "open" : ""}`}>
            <div className="details-inner">
              <div
                className="px-5 py-4 space-y-1"
                style={{ borderBottom: "1.5px solid var(--glass-border)" }}
              >
                <p
                  className="text-[9px] font-black uppercase tracking-[0.2em] mb-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Datos almacenados en localStorage
                </p>

                {STORAGE_ITEMS.map((item) => (
                  <div key={item.key} className="storage-row">

                    {/* Ícono de categoría */}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      aria-hidden="true"
                      style={{ background: item.categoryBg, color: item.iconColor }}
                    >
                      {item.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span
                          className="text-[11px] font-black"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {item.label}
                        </span>
                        <span
                          className="cat-pill"
                          style={{
                            background: item.categoryBg,
                            color: item.categoryColor,
                          }}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p
                        className="text-[10px] font-semibold leading-snug"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {item.desc}
                      </p>
                      <code
                        className="text-[9px] font-black mt-0.5 block"
                        style={{ color: "var(--text-secondary)", opacity: 0.5 }}
                      >
                        {item.key}
                      </code>
                    </div>

                    {/* Toggle (requerido = siempre on, funcional = configurable) */}
                    <div
                      className="toggle-track"
                      aria-hidden="true"
                      style={{
                        background: item.required
                          ? "#EF4444"
                          : functional
                          ? "var(--text-accent)"
                          : "var(--glass-border)",
                      }}
                      title={item.required ? "Siempre activo (esencial)" : ""}
                    >
                      <div
                        className="toggle-thumb"
                        style={{ left: (item.required || functional) ? "17px" : "3px" }}
                      />
                    </div>
                  </div>
                ))}

                {/* Toggle global de funcionales */}
                <div
                  className="flex items-center justify-between mt-3 pt-3"
                  style={{ borderTop: "1.5px solid var(--glass-border)" }}
                >
                  <div>
                    <p
                      className="text-[10px] font-black uppercase tracking-[0.15em]"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Preferencias y audio
                    </p>
                    <p
                      className="text-[9px] font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Tema, accesibilidad y configuración de música
                    </p>
                  </div>
                  <button
                    onClick={() => setFunctional((p) => !p)}
                    aria-pressed={functional}
                    aria-label={`${functional ? "Desactivar" : "Activar"} almacenamiento funcional`}
                    className="toggle-track transition-colors"
                    style={{
                      background: functional ? "var(--text-accent)" : "var(--glass-border)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      className="toggle-thumb"
                      style={{ left: functional ? "17px" : "3px" }}
                    />
                  </button>
                </div>

                {/* Nota aclaratoria */}
                <div
                  className="flex items-start gap-2 mt-3 p-3 rounded-xl"
                  style={{
                    background: "color-mix(in srgb, var(--text-accent) 6%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--text-accent) 15%, transparent)",
                  }}
                >
                  <Info size={12} className="mt-0.5 flex-shrink-0" style={{ color: "var(--text-accent)" }} />
                  <p
                    className="text-[9px] font-semibold leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    SEA <strong style={{ color: "var(--text-primary)" }}>no usa cookies</strong> de seguimiento,
                    publicidad ni analíticas de terceros. Todo el almacenamiento es local a tu dispositivo.
                    Este es un proyecto académico del{" "}
                    <strong style={{ color: "var(--text-primary)" }}>SENA – ADSO</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer: botones ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-5 py-4">

            {/* Botón detalles */}
            <button
              onClick={() => setExpanded((p) => !p)}
              aria-expanded={expanded}
              aria-controls="cookie-details"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl
                         text-[9px] font-black uppercase tracking-[0.15em] transition-all
                         hover:scale-[1.02] active:scale-[0.98] order-last sm:order-first"
              style={{
                background: "var(--card-bg)",
                border: "1.5px solid var(--glass-border)",
                color: "var(--text-secondary)",
              }}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "Ocultar detalles" : "Ver qué se guarda"}
            </button>

            <div className="flex gap-2 flex-1 sm:justify-end">
              {/* Rechazar funcionales */}
              <button
                onClick={() => dismiss(false)}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl
                           text-[9px] font-black uppercase tracking-[0.15em] transition-all
                           hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "var(--card-bg)",
                  border: "1.5px solid var(--glass-border)",
                  color: "var(--text-secondary)",
                }}
              >
                Solo esenciales
              </button>

              {/* Aceptar todo */}
              <button
                onClick={() => dismiss(true)}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl
                           text-[9px] font-black uppercase tracking-[0.15em] transition-all
                           hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "var(--text-accent)",
                  color: "var(--btn-text)",
                  boxShadow: "0 4px 16px color-mix(in srgb, var(--text-accent) 30%, transparent)",
                }}
              >
                Aceptar todo
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}