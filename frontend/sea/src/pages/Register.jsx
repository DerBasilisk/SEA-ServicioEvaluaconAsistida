import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Mail, Lock, Brain, TrendingUp, ShieldCheck } from "lucide-react";
import useAuthStore from "../store/authStore";

// ─── Estilos (Two-Column Split Layout — consistente con Login) ───────────────
const REGISTER_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  .sea-register { font-family: 'Nunito', sans-serif; }

  @keyframes register-fadeIn {
    from { opacity: 0; transform: translateX(16px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .sea-register-wrapper {
    display: flex;
    min-height: 100vh;
    background: var(--bg-gradient, #EFF5FC);
  }

  /* ── Panel izquierdo (branding) ── */
  .sea-register-left {
    flex: 1;
    background: #1A5FB4;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 3rem;
    position: relative;
    overflow: hidden;
  }
  .sea-register-left::before {
    content: '';
    position: absolute;
    top: -100px; right: -100px;
    width: 320px; height: 320px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
    pointer-events: none;
  }
  .sea-register-left::after {
    content: '';
    position: absolute;
    bottom: -80px; left: -80px;
    width: 260px; height: 260px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
    pointer-events: none;
  }

  /* Logo badge */
  .sea-logo-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    width: fit-content;
    z-index: 1;
  }
  .sea-logo-inner {
  }
  .sea-logo-label {
    color: rgba(255,255,255,0.85);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  .sea-tagline-block { z-index: 1; }
  .sea-tagline {
    color: #fff;
    font-size: clamp(28px, 3vw, 42px);
    font-weight: 900;
    font-style: italic;
    text-transform: uppercase;
    letter-spacing: -.02em;
    line-height: 1.2;
    margin: 0 0 10px;
  }
  .sea-tagline-sub {
    color: rgba(255,255,255,0.5);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .2em;
    text-transform: uppercase;
    margin: 0;
  }

  /* Steps en lugar de feature pills */
  .sea-steps {
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 1;
  }
  .sea-step {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    padding: 10px 14px;
    color: rgba(255,255,255,0.85);
    font-size: 13px;
    font-weight: 700;
  }
  .sea-step-num {
    width: 30px; height: 30px;
    border-radius: 8px;
    background: #2B7FE8;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    font-size: 14px;
    font-weight: 900;
    font-style: italic;
    flex-shrink: 0;
  }

  /* ── Panel derecho (formulario) ── */
  .sea-register-right {
    width: 440px;
    background: var(--card-bg, #fff);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem 2.5rem;
    animation: register-fadeIn .5s ease both .1s;
  }
  .sea-register-form-wrap { width: 100%; max-width: 360px; }

  .sea-form-title {
    font-size: 26px;
    font-weight: 900;
    font-style: italic;
    text-transform: uppercase;
    letter-spacing: -.02em;
    color: var(--text-primary);
    margin: 0 0 4px;
  }
  .sea-form-subtitle {
    font-size: 12px;
    font-weight: 600;
    color: #7A9CC5;
    margin: 0 0 2rem;
  }

  /* Fields */
  .sea-field { margin-bottom: 16px; }
  .sea-field-label {
    display: block;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .15em;
    text-transform: uppercase;
    color: #7A9CC5;
    margin-bottom: 6px;
  }
  .sea-input {
    background: var(--card-bg, #F5F8FC);
    border: 1.5px solid var(--glass-border, #D4E3F5);
    color: var(--text-primary);
    width: 100%;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Nunito', sans-serif;
    transition: border-color .2s, box-shadow .2s;
    outline: none;
  }
  .sea-input:focus {
    border-color: #2B7FE8;
    box-shadow: 0 0 0 3px rgba(43,127,232,0.12);
  }
  .sea-input::placeholder { color: #AAC0D8; }
  .sea-input-icon-left {
    position: absolute;
    left: 14px;
    top: 50%; transform: translateY(-50%);
    color: #AAC0D8;
    display: flex; align-items: center;
    pointer-events: none;
  }
  .sea-input-icon-right {
    position: absolute;
    right: 14px;
    top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: #AAC0D8;
    display: flex; align-items: center;
    padding: 0;
  }
  .sea-input-icon-right:hover { color: #2B7FE8; }

  /* Grid de contraseñas */
  .sea-password-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }

  /* Botón submit */
  .sea-submit-btn {
    width: 100%;
    background: #2B7FE8;
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 14px;
    font-size: 14px;
    font-weight: 900;
    font-style: italic;
    font-family: 'Nunito', sans-serif;
    text-transform: uppercase;
    letter-spacing: .12em;
    cursor: pointer;
    transition: transform .15s, opacity .15s;
    margin-top: 4px;
  }
  .sea-submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
  .sea-submit-btn:active:not(:disabled) { transform: scale(.98); }
  .sea-submit-btn:disabled { opacity: .5; cursor: not-allowed; }

  /* Alertas */
  .sea-alert-error {
    margin-bottom: 18px;
    padding: 10px 16px;
    border-radius: 12px;
    font-size: 12px; font-weight: 700;
    text-align: center;
    color: #e53e3e;
    background: rgba(229,62,62,0.08);
    border: 1px solid rgba(229,62,62,0.18);
  }

  /* Footer del form */
  .sea-footer-text {
    text-align: center;
    font-size: 10px; font-weight: 800;
    letter-spacing: .1em; text-transform: uppercase;
    color: #AAC0D8;
    margin-top: 18px;
  }
  .sea-footer-text a { color: #2B7FE8; text-decoration: none; }
  .sea-footer-text a:hover { text-decoration: underline; }

  /* Responsive */
  @media (max-width: 768px) {
    .sea-register-left { display: none; }
    .sea-register-right { width: 100%; padding: 2.5rem 1.5rem; }
    .sea-password-grid { grid-template-columns: 1fr; }
  }
`;

export default function Register() {
  const navigate = useNavigate();
  const { register, error, clearError, user, isAuthenticated } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [localError, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user || isAuthenticated()) {
      navigate(user?.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    }
  }, [user, navigate, isAuthenticated]);

  const handleChange = (e) => {
    if (error) clearError();
    if (localError) setLocalError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setLocalError("Las contraseñas no coinciden");
      return;
    }
    setSubmitting(true);
    try {
      const res = await register(form.username, form.email, form.password);
      if (res?.ok) {
        navigate("/verification-pending", { state: { email: form.email } });
      } else {
        setLocalError(res?.message || "Error al registrarse");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <>
      <style>{REGISTER_CSS}</style>

      <div className="sea-register sea-register-wrapper">

        {/* ── Panel izquierdo: Branding ── */}
        <div className="sea-register-left">

          <div className="sea-logo-badge">
            <div className="sea-logo-inner">
              <img src="/logos/LogoWhite.svg" width="128" alt="SEA" className="brightness-0 invert" />
            </div>
            <span className="sea-logo-label"></span>
          </div>

          <div className="sea-tagline-block">
            <h1 className="sea-tagline">

            </h1>
            <p className="sea-tagline-sub"></p>
          </div>

          {/* Steps en lugar de feature pills 
          <div className="sea-steps">
            <div className="sea-step">
              <div className="sea-step-num">1</div>
              Crea tu cuenta con email o Google
            </div>
            <div className="sea-step">
              <div className="sea-step-num">2</div>
              Verifica tu correo electrónico
            </div>
            <div className="sea-step">
              <div className="sea-step-num">3</div>
              Empieza a practicar de inmediato
            </div>
          </div> */}
        </div>

        {/* ── Panel derecho: Formulario ── */}
        <div className="sea-register-right">
          <div className="sea-register-form-wrap">

            <h2 className="sea-form-title">Nueva Cuenta</h2>
            <p className="sea-form-subtitle">Comienza tu entrenamiento asistido</p>

            {displayError && (
              <div className="sea-alert-error">{displayError}</div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Username */}
              <div className="sea-field">
                <label className="sea-field-label">Usuario</label>
                <div style={{ position: "relative" }}>
                  <span className="sea-input-icon-left"><User size={16} /></span>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    placeholder="¿Cómo te llamamos?"
                    className="sea-input"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="sea-field">
                <label className="sea-field-label">Correo electrónico</label>
                <div style={{ position: "relative" }}>
                  <span className="sea-input-icon-left"><Mail size={16} /></span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="tu@email.com"
                    className="sea-input"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>

              {/* Contraseñas en grid */}
              <div className="sea-password-grid">
                <div>
                  <label className="sea-field-label">Contraseña</label>
                  <div style={{ position: "relative" }}>
                    <span className="sea-input-icon-left"><Lock size={16} /></span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••"
                      className="sea-input"
                      style={{ paddingLeft: 42 }}
                    />
                  </div>
                </div>
                <div>
                  <label className="sea-field-label">Confirmar</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirm"
                      value={form.confirm}
                      onChange={handleChange}
                      required
                      placeholder="••••••"
                      className="sea-input"
                      style={{ paddingRight: 42 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="sea-input-icon-right"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={submitting} className="sea-submit-btn">
                {submitting ? "Sincronizando..." : "Crear mi cuenta →"}
              </button>
            </form>

            <p className="sea-footer-text">
              ¿Ya eres parte de SEA?{" "}
              <Link to="/login">Iniciar sesión</Link>
            </p>
          </div>
        </div>

      </div>
    </>
  );
}