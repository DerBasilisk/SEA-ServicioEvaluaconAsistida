import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from "lucide-react";
import useAuthStore from "../store/authStore";
import SEA_AUTH_CSS from "./auth-shared.css?inline";

export default function VerificationPending() {
  const location = useLocation();
  const email = location.state?.email || "";
  const { resendVerification, loading } = useAuthStore();
  const [resendStatus, setResendStatus] = useState({ sent: false, error: "" });

  const handleResend = async () => {
    if (!email) {
      setResendStatus({ sent: false, error: "No se pudo identificar tu correo. Intenta registrarte nuevamente." });
      return;
    }
    const result = await resendVerification(email);
    if (result.ok) {
      setResendStatus({ sent: true, error: "" });
      setTimeout(() => setResendStatus({ sent: false, error: "" }), 5000);
    } else {
      setResendStatus({ sent: false, error: result.message });
    }
  };

  return (
    <>
      <style>{SEA_AUTH_CSS}</style>

      <div className="sea-auth sea-auth-wrapper">

        {/* ── Panel izquierdo ── */}
        <div className="sea-auth-left">
          <div className="sea-logo-badge">
            <div className="sea-logo-inner">
              <img src="/logos/LogoWhite.svg" width="64" alt="SEA" className="brightness-0 invert" />
            </div>
            <span className="sea-logo-label">Plataforma educativa</span>
          </div>

          <div className="sea-auth-tagline-block">
            <h1 className="sea-auth-tagline">
              Un paso<br />más para<br />comenzar
            </h1>
            <p className="sea-auth-tagline-sub">Verificación de cuenta</p>
          </div>

          <div className="sea-auth-info-cards">
            <div className="sea-auth-info-card">
              <div className="sea-auth-info-icon"><Mail size={15} /></div>
              <div>
                <p className="sea-auth-info-title">Revisa tu bandeja de entrada</p>
                <p className="sea-auth-info-desc">Y también la carpeta de spam</p>
              </div>
            </div>
            <div className="sea-auth-info-card">
              <div className="sea-auth-info-icon" style={{ background: "rgba(255,255,255,0.15)" }}>
                <span style={{ fontSize: 13, fontWeight: 900, fontStyle: "italic", color: "#fff" }}>24h</span>
              </div>
              <div>
                <p className="sea-auth-info-title">El enlace expira en 24 horas</p>
                <p className="sea-auth-info-desc">Puedes reenviar el correo si lo necesitas</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Panel derecho ── */}
        <div className="sea-auth-right">
          <div className="sea-auth-right-inner">

            <div className="sea-auth-status-icon pending">
              <Mail size={32} color="#2B7FE8" />
            </div>

            <h2 className="sea-auth-form-title">¡Casi listo!</h2>
            <p className="sea-auth-form-subtitle">Verifica tu correo electrónico para activar tu cuenta</p>

            <div className="sea-auth-info-box">
              <p style={{ fontSize: 11, color: "#7A9CC5", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", margin: "0 0 6px" }}>
                Enviamos el enlace a
              </p>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#2B7FE8", margin: 0, wordBreak: "break-all" }}>
                {email || "tu correo electrónico"}
              </p>
            </div>

            <p style={{ fontSize: 12, color: "#7A9CC5", fontWeight: 600, marginBottom: 20, lineHeight: 1.7 }}>
              Haz clic en el enlace del correo para confirmar tu cuenta. El enlace expira en <strong style={{ color: "var(--text-primary)" }}>24 horas</strong>.
            </p>

            {resendStatus.error && (
              <div className="sea-auth-alert error sea-auth-shake">{resendStatus.error}</div>
            )}
            {resendStatus.sent && (
              <div className="sea-auth-alert success" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <CheckCircle size={14} /> ¡Correo reenviado! Revisa tu bandeja.
              </div>
            )}

            <button
              onClick={handleResend}
              disabled={loading}
              className="sea-auth-btn-outline"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              {loading ? "Enviando..." : "Reenviar correo de verificación"}
            </button>

            <p className="sea-auth-footer">
              ¿Ya verificaste?{" "}
              <Link to="/login">Iniciar sesión</Link>
            </p>
          </div>
        </div>

      </div>
    </>
  );
}