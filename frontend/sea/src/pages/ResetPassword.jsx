import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff, ShieldAlert, ShieldCheck, KeyRound, Loader2, ArrowLeft } from "lucide-react";
import api from "../api/axios";
import SEA_AUTH_CSS from "./auth-shared.css?inline";
import BackgroundAnimations from "../components/BackgroundAnimations";
import { LogoMark } from "../components/LogoMark";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [shaking, setShaking] = useState(false);

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  };

  const handleSubmit = async () => {
    if (password !== confirm) { setError("Las contraseñas no coinciden"); triggerShake(); return; }
    if (password.length < 6) { setError("Mínimo 6 caracteres"); triggerShake(); return; }
    setLoading(true);
    setError(null);
    try {
      await api.post("/password/reset", { token, password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Error al restablecer la contraseña");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  /* ── Token inválido ── */
  if (!token) {
    return (
      <>
        <style>{SEA_AUTH_CSS}</style>
        <div className="sea-auth sea-auth-wrapper">
          <div className="sea-auth-left">
            <BackgroundAnimations />
            <div className="sea-logo-badge">
              <div className="sea-logo-inner">
                <LogoMark />
              </div>
              <span className="sea-logo-label"></span>
            </div>
            {/* Tagline y pasos para recuperar contraseña 
            <div className="sea-auth-tagline-block">
              <h1 className="sea-auth-tagline">Seguridad<br />ante todo</h1>
              <p className="sea-auth-tagline-sub">Módulo de seguridad SEA</p>
            </div>
            <div className="sea-auth-info-cards">
              <div className="sea-auth-info-card">
                <div className="sea-auth-info-icon"><KeyRound size={15} /></div>
                <div>
                  <p className="sea-auth-info-title">Los enlaces son de un solo uso</p>
                  <p className="sea-auth-info-desc">Solicita uno nuevo si el tuyo expiró</p>
                </div>
              </div>
            </div>*/}
          </div>
          <div className="sea-auth-right">
            <div className="sea-auth-right-inner" style={{ textAlign: "center" }}>
              <div className="sea-auth-status-icon error" style={{ margin: "0 auto 1.5rem" }}>
                <ShieldAlert size={32} color="#ef4444" />
              </div>
              <h2 className="sea-auth-form-title">Enlace inválido</h2>
              <p style={{ fontSize: 13, color: "#7A9CC5", fontWeight: 600, marginBottom: "2rem", lineHeight: 1.6 }}>
                El token de recuperación no existe o ha expirado. Solicita un nuevo enlace desde la página de recuperación.
              </p>
              <Link to="/forgot-password" style={{ textDecoration: "none" }}>
                <button className="sea-auth-btn">Solicitar nuevo enlace →</button>
              </Link>
              <p className="sea-auth-footer">
                <Link to="/login" style={{ color: "#7A9CC5", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <ArrowLeft size={12} /> Volver al inicio de sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── Éxito ── */
  if (success) {
    return (
      <>
        <style>{SEA_AUTH_CSS}</style>
        <div className="sea-auth sea-auth-wrapper">
          <div className="sea-auth-left">
            <BackgroundAnimations />
            <div className="sea-logo-badge">
              <div className="sea-logo-inner">
                <LogoMark />
              </div>
              <span className="sea-logo-label"></span>
            </div>
            <div className="sea-auth-tagline-block">
              <h1 className="sea-auth-tagline">¡Listo!<br />Ya puedes<br />ingresar</h1>
              <p className="sea-auth-tagline-sub">Contraseña actualizada</p>
            </div>
            <div className="sea-auth-info-cards" />
          </div>
          <div className="sea-auth-right">
            <div className="sea-auth-right-inner" style={{ textAlign: "center" }}>
              <div className="sea-auth-status-icon success" style={{ margin: "0 auto 1.5rem" }}>
                <ShieldCheck size={32} color="#22c55e" />
              </div>
              <h2 className="sea-auth-form-title">¡Contraseña actualizada!</h2>
              <p style={{ fontSize: 13, color: "#7A9CC5", fontWeight: 600, marginBottom: "2rem", lineHeight: 1.6 }}>
                Tu contraseña fue restablecida exitosamente. Serás redirigido al inicio de sesión en unos segundos.
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#7A9CC5", fontSize: 12, fontWeight: 700 }}>
                <Loader2 size={14} className="animate-spin" style={{ color: "#2B7FE8" }} />
                Redirigiendo...
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── Formulario ── */
  return (
    <>
      <style>{SEA_AUTH_CSS}</style>
      <div className="sea-auth sea-auth-wrapper">

        <div className="sea-auth-left">
          <div className="sea-logo-badge">
            <div className="sea-logo-inner">
              <img src="/logos/LogoWhite.svg" width="64" alt="SEA" className="brightness-0 invert" />
            </div>
            <span className="sea-logo-label">Plataforma educativa</span>
          </div>
          <div className="sea-auth-tagline-block">
            <h1 className="sea-auth-tagline">Elige una<br />contraseña<br />segura</h1>
            <p className="sea-auth-tagline-sub">Módulo de seguridad SEA</p>
          </div>
          <div className="sea-auth-info-cards">
            <div className="sea-auth-info-card">
              <div className="sea-auth-info-icon"><KeyRound size={15} /></div>
              <div>
                <p className="sea-auth-info-title">Mínimo 6 caracteres</p>
                <p className="sea-auth-info-desc">Usa letras, números y símbolos</p>
              </div>
            </div>
            <div className="sea-auth-info-card">
              <div className="sea-auth-info-icon" style={{ background: "rgba(255,255,255,0.15)" }}>
                <ShieldCheck size={15} color="#fff" />
              </div>
              <div>
                <p className="sea-auth-info-title">Enlace de un solo uso</p>
                <p className="sea-auth-info-desc">Este link quedará invalidado al usarlo</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sea-auth-right">
          <div className="sea-auth-right-inner">
            <h2 className="sea-auth-form-title">Nueva contraseña</h2>
            <p className="sea-auth-form-subtitle">Elige una contraseña segura para tu cuenta</p>

            {error && (
              <div className={`sea-auth-alert error ${shaking ? "sea-auth-shake" : ""}`}>{error}</div>
            )}

            <div className="sea-auth-field">
              <label className="sea-auth-label">Nueva contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setError(null); setPassword(e.target.value); }}
                  placeholder="••••••••"
                  autoFocus
                  className="sea-auth-input"
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="sea-auth-input-icon-right"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="sea-auth-field">
              <label className="sea-auth-label">Confirmar contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => { setError(null); setConfirm(e.target.value); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="••••••••"
                  className="sea-auth-input"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!password || !confirm || loading}
              className="sea-auth-btn"
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Loader2 size={16} className="animate-spin" /> Actualizando...
                </span>
              ) : "Actualizar contraseña →"}
            </button>

            <p className="sea-auth-footer">
              <Link to="/login" style={{ color: "#7A9CC5", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <ArrowLeft size={12} /> Volver al inicio de sesión
              </Link>
            </p>
          </div>
        </div>

      </div>
    </>
  );
}