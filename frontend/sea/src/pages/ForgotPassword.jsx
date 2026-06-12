import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import api from "../api/axios";
import SEA_AUTH_CSS from "./auth-shared.css?inline";
import BackgroundAnimations from "../components/BackgroundAnimations";
import { LogoMark } from "../components/LogoMark";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.post("/password/forgot", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "No pudimos procesar tu solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{SEA_AUTH_CSS}</style>

      <div className="sea-auth sea-auth-wrapper">

        {/* ── Panel izquierdo ── */}
        <div className="sea-auth-left">
          <BackgroundAnimations />
          <div className="sea-logo-badge">
            <div className="sea-logo-inner">
              <LogoMark/>
            </div>
            <span className="sea-logo-label"></span>
          </div>

          {/* Tagline y pasos para recuperar contraseña 
          <div className="sea-auth-tagline-block">
            <h1 className="sea-auth-tagline">
              Recupera<br />tu acceso<br />fácilmente
            </h1>
            <p className="sea-auth-tagline-sub">Protocolo de seguridad SEA</p>
          </div>

          <div className="sea-auth-info-cards">
            <div className="sea-auth-info-card">
              <div className="sea-auth-info-icon">
                <Mail size={15} />
              </div>
              <div>
                <p className="sea-auth-info-title">Te enviamos un enlace</p>
                <p className="sea-auth-info-desc">Revisa tu bandeja de entrada y spam</p>
              </div>
            </div>
            <div className="sea-auth-info-card">
              <div className="sea-auth-info-icon" style={{ background: "rgba(255,255,255,0.15)" }}>
                <span style={{ fontSize: 13, fontWeight: 900, fontStyle: "italic", color: "#fff" }}>24h</span>
              </div>
              <div>
                <p className="sea-auth-info-title">El enlace expira en 24 horas</p>
                <p className="sea-auth-info-desc">Úsalo antes de que caduque</p>
              </div>
            </div>
          </div>*/}
        </div>

        {/* ── Panel derecho ── */}
        <div className="sea-auth-right">
          <div className="sea-auth-right-inner">

            {!sent ? (
              <>
                <h2 className="sea-auth-form-title">Recuperar acceso</h2>
                <p className="sea-auth-form-subtitle">
                  Ingresa tu correo y te enviamos un enlace para restablecer tu contraseña
                </p>

                {error && <div className={`sea-auth-alert error sea-auth-shake`}>{error}</div>}

                <div className="sea-auth-field">
                  <label className="sea-auth-label">Correo electrónico</label>
                  <div style={{ position: "relative" }}>
                    <span className="sea-auth-input-icon-left"><Mail size={16} /></span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setError(null); setEmail(e.target.value); }}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      placeholder="tu@email.com"
                      autoFocus
                      className="sea-auth-input"
                      style={{ paddingLeft: 42 }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!email.trim() || loading}
                  className="sea-auth-btn"
                >
                  {loading ? "Enviando..." : "Solicitar enlace →"}
                </button>

                <p className="sea-auth-footer" style={{ marginTop: 20 }}>
                  <Link to="/login" style={{ color: "#7A9CC5", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <ArrowLeft size={12} /> Volver al inicio de sesión
                  </Link>
                </p>
              </>
            ) : (
              <>
                <div className="sea-auth-status-icon success">
                  <Mail size={32} color="#22c55e" />
                </div>
                <h2 className="sea-auth-form-title">¡Correo enviado!</h2>
                <p className="sea-auth-form-subtitle">Revisa tu bandeja de entrada</p>

                <div className="sea-auth-info-box">
                  <p style={{ fontSize: 12, color: "#7A9CC5", fontWeight: 600, margin: "0 0 6px" }}>
                    Enviamos el enlace a:
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#2B7FE8", margin: 0, wordBreak: "break-all" }}>
                    {email}
                  </p>
                </div>

                <p style={{ fontSize: 12, color: "#7A9CC5", fontWeight: 600, marginBottom: 20, lineHeight: 1.6 }}>
                  Si el correo está registrado, recibirás el enlace en breve. El enlace expira en <strong style={{ color: "var(--text-primary)" }}>24 horas</strong>.
                </p>

                <Link to="/login" style={{ textDecoration: "none" }}>
                  <button className="sea-auth-btn">Volver al inicio de sesión →</button>
                </Link>
              </>
            )}

          </div>
        </div>

      </div>
    </>
  );
}