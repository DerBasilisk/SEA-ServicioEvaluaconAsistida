import { useState } from "react";
import { Link } from "react-router-dom";
import TermsModal from "./TermsModal";
import useThemeStore from "../store/themeStore";
import { LogoMark , SenaMark } from "../components/LogoMark"

export default function Footer() {
  const [showTerms, setShowTerms] = useState(false);

  return (
    <>
      <footer
        className="relative z-10 w-full px-6 md:px-12 pt-10 pb-6"
        style={{
          borderTop: "1.5px solid var(--glass-border)",
          background: "var(--glass-bg)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {/* TOP ROW */}
        <div className="max-w-6xl mx-auto flex flex-wrap gap-10 justify-between items-start mb-8">

          {/* Brand */}
          <div className="flex flex-col gap-2">
            <LogoMark />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--text-primary)]">
              Sistema SEA
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)] max-w-[180px] leading-relaxed">
              Aprendizaje adaptativo impulsado por IA
            </span>
          </div>

          {/* Nav links */}
          <div className="flex flex-wrap gap-10">
            <FooterCol title="Plataforma">
              <FooterLink to="/home">Inicio</FooterLink>
              <FooterLink to="/register">Registrarse</FooterLink>
              <FooterLink to="/login">Ingresar</FooterLink>
            </FooterCol>

            <FooterCol title="Legal">
              {/* Abre el modal en lugar de navegar */}
              <button
                onClick={() => setShowTerms(true)}
                className="text-[10px] font-bold uppercase tracking-widest text-left transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                aria-label="Ver términos y condiciones"
              >
                Términos
              </button>
              <FooterLink to="/contact">Contacto</FooterLink>
            </FooterCol>
          </div>
        </div>

        {/* DIVIDER */}
        <div
          className="max-w-6xl mx-auto mb-5"
          style={{ height: "1px", background: "var(--glass-border)" }}
          aria-hidden="true"
        />

        {/* BOTTOM ROW */}
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">

          {/* SENA badge */}
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-2xl"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <SenaMark
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                Desarrollado por estudiantes del SENA
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-[0.1em]"
                style={{ color: "#39d353" }}
              >
                Análisis y Desarrollo de Software · 2025
              </span>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)] opacity-50">
            © {new Date().getFullYear()} Sistema SEA · Todos los derechos reservados
          </p>
        </div>
      </footer>

      {/* Modal de Términos */}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </>
  );
}

/* ── Helpers ── */
function FooterCol({ title, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-secondary)] mb-1">
        {title}
      </span>
      {children}
    </div>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-[10px] font-bold uppercase tracking-widest transition-colors"
      style={{ color: "var(--text-secondary)" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
    >
      {children}
    </Link>
  );
}
