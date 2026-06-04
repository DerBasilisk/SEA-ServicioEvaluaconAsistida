// src/components/AuthCard.jsx
import { Link } from "react-router-dom";

const AuthCard = ({
  children,
  title,
  subtitle,
  icon: Icon,
  footerText,
  footerLinkText,
  footerLinkTo = "/login",
  error = null,
  successMessage = null,
  isLoading = false,
}) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "var(--bg-gradient)" }}
    >
      {/* Orbes decorativos consistentes */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: "var(--deco-blob)", filter: "blur(80px)" }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-20"
          style={{ background: "var(--deco-blob2)", filter: "blur(80px)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Tarjeta principal */}
        <div
          className="auth-card rounded-[2.5rem] p-8 md:p-10"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(24px)",
            border: "1.5px solid var(--glass-border)",
            boxShadow: "0 24px 64px var(--glass-shadow)",
          }}
        >
          {/* Ícono / Logo (opcional) */}
          {Icon && (
            <div className="flex justify-center mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl rotate-[-3deg]"
                style={{ background: "var(--text-accent)" }}
              >
                <Icon size={32} className="text-white" />
              </div>
            </div>
          )}

          {/* Títulos */}
          {(title || subtitle) && (
            <div className="text-center mb-8">
              {title && (
                <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase text-[var(--text-primary)]">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] mt-2 text-[var(--text-secondary)]">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Mensajes de error / éxito */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-2xl text-[11px] font-bold text-rose-500 text-center bg-rose-500/10 border border-rose-500/20">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-5 px-4 py-3 rounded-2xl text-xs font-bold text-green-600 text-center bg-green-500/10 border border-green-500/20">
              {successMessage}
            </div>
          )}

          {/* Contenido del formulario */}
          {children}

          {/* Pie de página con enlace */}
          {footerText && (
            <div className="mt-8 pt-6 border-t border-[var(--glass-border)] text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                {footerText}{" "}
                <Link
                  to={footerLinkTo}
                  className="text-[var(--text-accent)] hover:underline"
                >
                  {footerLinkText}
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Crédito inferior (estilo SEA) */}
        <p className="text-center mt-8 text-[var(--text-secondary)] opacity-50 font-black text-[10px] uppercase tracking-[0.3em]">
          Simulador de Examen Asistido • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default AuthCard;