import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from "lucide-react";
import useAuthStore from "../store/authStore";
import SEA_AUTH_CSS from "./auth-shared.css?inline";
import BackgroundAnimations from "../components/BackgroundAnimations";
import { LogoMark } from "../components/LogoMark";

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
        <div className="sea-auth-left">
          <BackgroundAnimations />  {/* ← agregar animaciones */}
          
          <div className="sea-logo-badge">
            <div className="sea-logo-inner">
              <LogoMark />
            </div>
          </div>

          {/* Opcional: tagline 
          <div className="sea-auth-tagline-block">
            <h1 className="sea-auth-tagline">Verifica<br />tu correo</h1>
            <p className="sea-auth-tagline-sub">Activación de cuenta</p>
          </div>*/}
        </div>

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