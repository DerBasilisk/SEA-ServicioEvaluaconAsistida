import { useEffect } from "react";
import { X, Shield, BookOpen, AlertTriangle, Lock, Users, RefreshCw } from "lucide-react";

/* ─────────────────────────────────────────────
   CSS del modal
───────────────────────────────────────────── */
const TERMS_CSS = `
  @keyframes terms-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes terms-slide-up {
    from { opacity: 0; transform: translateY(40px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .terms-overlay {
    position: fixed; inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 200;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0;
    animation: terms-fade-in 0.2s ease both;
  }
  @media (min-width: 640px) {
    .terms-overlay {
      align-items: center;
      padding: 24px 16px;
    }
  }

  .terms-panel {
    width: 100%;
    max-width: 680px;
    max-height: 92vh;
    overflow-y: auto;
    border-radius: 28px 28px 0 0;
    background: var(--glass-bg-nice);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1.5px solid var(--glass-border);
    animation: terms-slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    scrollbar-width: thin;
    scrollbar-color: var(--glass-border) transparent;
  }
  @media (min-width: 640px) {
    .terms-panel {
      border-radius: 28px;
      max-height: 85vh;
    }
  }
  .terms-panel::-webkit-scrollbar { width: 4px; }
  .terms-panel::-webkit-scrollbar-thumb {
    background: var(--glass-border);
    border-radius: 99px;
  }

  .terms-section-icon {
    width: 36px; height: 36px;
    border-radius: 12px;
    background: var(--card-bg);
    border: 1.5px solid var(--glass-border);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
  }

  .terms-section:hover .terms-section-icon {
    transform: scale(1.1) rotate(4deg);
  }

  .terms-handle {
    width: 40px; height: 4px;
    background: var(--glass-border);
    border-radius: 99px;
    margin: 12px auto 0;
  }
  @media (min-width: 640px) { .terms-handle { display: none; } }
`;

/* ─────────────────────────────────────────────
   Secciones del documento
───────────────────────────────────────────── */
const SECTIONS = [
  {
    icon: <BookOpen size={16} />,
    color: "#2B7FE8",
    title: "Uso de la Plataforma",
    content:
      "SEA es una herramienta educativa destinada exclusivamente a estudiantes del SENA del programa Análisis y Desarrollo de Software. El acceso es personal e intransferible. Queda prohibido compartir credenciales, automatizar interacciones o utilizar la plataforma con fines distintos al aprendizaje.",
  },
  {
    icon: <Lock size={16} />,
    color: "#8B5CF6",
    title: "Datos y Privacidad",
    content:
      "Recopilamos únicamente la información necesaria para personalizar tu experiencia de aprendizaje: nombre, correo electrónico y progreso académico. Tus datos no se venden ni comparten con terceros. Puedes solicitar la eliminación de tu cuenta y datos en cualquier momento escribiéndonos directamente.",
  },
  {
    icon: <Shield size={16} />,
    color: "#10B981",
    title: "Integridad Académica",
    content:
      "SEA está diseñado para fortalecer el conocimiento real. Manipular resultados, explotar vulnerabilidades o usar herramientas externas para inflar métricas va en contra del propósito de la plataforma y puede derivar en la suspensión de la cuenta.",
  },
  {
    icon: <Users size={16} />,
    color: "#F59E0B",
    title: "Conducta en Comunidad",
    content:
      "Las funciones sociales (clasificaciones, amigos, logros) deben usarse con respeto. No se permite el acoso, la discriminación ni el lenguaje inapropiado. Los usuarios que incumplan estas normas serán reportados al equipo administrador del SENA.",
  },
  {
    icon: <RefreshCw size={16} />,
    color: "#06B6D4",
    title: "Actualizaciones",
    content:
      "Estos términos pueden actualizarse para reflejar mejoras en la plataforma o cambios normativos del SENA. Te notificaremos por correo electrónico ante cambios sustanciales. El uso continuado de SEA implica la aceptación de los términos vigentes.",
  },
  {
    icon: <AlertTriangle size={16} />,
    color: "#EF4444",
    title: "Limitación de Responsabilidad",
    content:
      "SEA es un proyecto académico desarrollado por estudiantes. Se ofrece tal como está, sin garantías de disponibilidad continua. El equipo de desarrollo trabajará para corregir errores, pero no se asume responsabilidad por pérdida de progreso derivada de fallos técnicos fuera de nuestro control.",
  },
];

/* ─────────────────────────────────────────────
   Componente principal
───────────────────────────────────────────── */
export default function TermsModal({ onClose }) {
  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <>
      <style>{TERMS_CSS}</style>

      {/* Overlay — clic fuera para cerrar */}
      <div
        className="terms-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Términos y Condiciones de SEA"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="terms-panel">

          {/* Handle visible solo en móvil */}
          <div className="terms-handle" aria-hidden="true" />

          {/* ── Header ── */}
          <div
            className="flex items-center justify-between px-6 pt-5 pb-4 sm:px-8 sm:pt-7"
            style={{ borderBottom: "1.5px solid var(--glass-border)" }}
          >
            <div className="flex items-center gap-3">
              {/* Logo SEA pequeño */}
              <div
                className="w-9 h-9 flex items-center justify-center rounded-[10px] font-black text-base italic shadow-md"
                style={{
                  background: "var(--text-accent)",
                  color: "var(--btn-text)",
                  transform: "rotate(-4deg)",
                }}
                aria-hidden="true"
              >
                S
              </div>
              <div>
                <h2
                  className="text-base sm:text-lg font-black uppercase italic tracking-tighter leading-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  Términos y Condiciones
                </h2>
                <p
                  className="text-[9px] font-black uppercase tracking-[0.2em]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Sistema SEA · Versión 1.0 · 2025
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Cerrar términos y condiciones"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all
                         hover:scale-105 active:scale-95"
              style={{
                background: "var(--card-bg)",
                border: "1.5px solid var(--glass-border)",
                color: "var(--text-secondary)",
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* ── Cuerpo ── */}
          <div className="px-6 py-6 sm:px-8 sm:py-7 space-y-4">

            {/* Intro badge */}
            <div
              className="flex items-start gap-3 p-4 rounded-2xl"
              style={{
                background: "color-mix(in srgb, var(--text-accent) 8%, transparent)",
                border: "1.5px solid color-mix(in srgb, var(--text-accent) 20%, transparent)",
              }}
            >
              <Shield size={16} className="mt-0.5 shrink-0" style={{ color: "var(--text-accent)" }} />
              <p
                className="text-[11px] font-bold leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Al usar SEA aceptas estas condiciones. Este es un proyecto académico del{" "}
                <strong style={{ color: "var(--text-primary)" }}>SENA</strong> — Programa
                de Análisis y Desarrollo de Software. Léelas antes de continuar.
              </p>
            </div>

            {/* Secciones */}
            {SECTIONS.map((sec) => (
              <div
                key={sec.title}
                className="terms-section flex gap-4 p-4 sm:p-5 rounded-2xl transition-all"
                style={{
                  background: "var(--card-bg)",
                  border: "1.5px solid var(--glass-border)",
                }}
              >
                <div
                  className="terms-section-icon"
                  aria-hidden="true"
                  style={{ color: sec.color }}
                >
                  {sec.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-[11px] font-black uppercase tracking-[0.15em] mb-1.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {sec.title}
                  </h3>
                  <p
                    className="text-[11px] font-semibold leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {sec.content}
                  </p>
                </div>
              </div>
            ))}

            {/* Pie del modal */}
            <div
              className="text-center pt-2 pb-1"
              style={{ borderTop: "1.5px solid var(--glass-border)" }}
            >
              <p
                className="text-[9px] font-black uppercase tracking-[0.2em]"
                style={{ color: "var(--text-secondary)", opacity: 0.5 }}
              >
                Desarrollado por estudiantes SENA · Análisis y Desarrollo de Software · 2025
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}