import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Brain, TrendingUp, ShieldCheck } from "lucide-react";
import useAuthStore from "../store/authStore";

// ─── Estilos (Two-Column Split Layout) ──────────────────────────────────────
const LOGIN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  .sea-login { font-family: 'Nunito', sans-serif; }

  @keyframes login-fadeIn {
    from { opacity: 0; transform: translateX(16px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  /* ── Wrapper principal ── */
  .sea-login-wrapper {
    display: flex;
    min-height: 100vh;
    background: var(--bg-gradient, #EFF5FC);
  }

  /* ── Panel izquierdo (branding) ── */
  .sea-login-left {
    flex: 1;
    background: #1A5FB4;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 3rem;
    position: relative;
    overflow: hidden;
  }
  .sea-login-left::before {
    content: '';
    position: absolute;
    top: -100px; right: -100px;
    width: 320px; height: 320px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
    pointer-events: none;
  }
  .sea-login-left::after {
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

  /* Tagline central */
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

  /* Pills de features */
  .sea-features {
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 1;
  }
  .sea-feature-pill {
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
  .sea-feature-icon {
    width: 30px; height: 30px;
    border-radius: 8px;
    background: rgba(255,255,255,0.12);
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    flex-shrink: 0;
  }

  /* ── Panel derecho (formulario) ── */
  .sea-login-right {
    width: 420px;
    background: var(--card-bg, #fff);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem 2.5rem;
    animation: login-fadeIn .5s ease both .1s;
  }
  .sea-login-form-wrap { width: 100%; max-width: 340px; }

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

  /* Inputs */
  .sea-field { margin-bottom: 18px; }
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
    margin-top: 6px;
  }
  .sea-submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
  .sea-submit-btn:active:not(:disabled) { transform: scale(.98); }
  .sea-submit-btn:disabled { opacity: .5; cursor: not-allowed; }

  /* Divisor */
  .sea-divider {
    display: flex; align-items: center; gap: 10px;
    margin: 22px 0 16px;
  }
  .sea-divider-line { flex: 1; height: 1px; background: var(--glass-border, #D4E3F5); }
  .sea-divider-text {
    font-size: 9px; font-weight: 800;
    letter-spacing: .18em; text-transform: uppercase;
    color: #AAC0D8;
  }

  /* Botón social */
  .sea-social-btn {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: var(--card-bg, #F5F8FC);
    border: 1.5px solid var(--glass-border, #D4E3F5);
    border-radius: 12px;
    padding: 12px;
    font-size: 12px;
    font-weight: 800;
    font-family: 'Nunito', sans-serif;
    letter-spacing: .06em;
    text-decoration: none;
    color: var(--text-primary);
    transition: background .15s, transform .15s;
  }
  .sea-social-btn:hover { background: rgba(255,255,255,.95); transform: translateY(-1px); }

  /* Pie */
  .sea-footer-text {
    text-align: center;
    font-size: 10px; font-weight: 800;
    letter-spacing: .1em; text-transform: uppercase;
    color: #AAC0D8;
    margin-top: 20px;
  }
  .sea-footer-text a { color: #2B7FE8; text-decoration: none; }
  .sea-footer-text a:hover { text-decoration: underline; }

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
  .sea-alert-success {
    margin-bottom: 18px;
    padding: 10px 16px;
    border-radius: 12px;
    font-size: 12px; font-weight: 700;
    text-align: center;
    color: #2f855a;
    background: rgba(47,133,90,0.08);
    border: 1px solid rgba(47,133,90,0.18);
  }

  /* Responsive: colapsar en móvil */
  @media (max-width: 768px) {
    .sea-login-left { display: none; }
    .sea-login-right { width: 100%; padding: 2.5rem 1.5rem; }
  }
`;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, clearError, fetchMe } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ─── OAuth: token en URL ──────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("sea_token", token);
      fetchMe().then(() => {
        const { user } = useAuthStore.getState();
        navigate(user?.role === "admin" ? "/admin" : "/");
      });
    }
  }, [location, navigate, fetchMe]);

  // ─── Verificación de cuenta ───────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("verified") === "true") {
      setSuccessMessage("¡Cuenta verificada! Ya puedes iniciar sesión.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  const handleChange = (e) => {
    if (error) clearError();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await login(form.email, form.password);
      if (res?.ok) {
        const { user } = useAuthStore.getState();
        navigate(user?.role === "admin" ? "/admin" : "/");
      } else {
        console.warn("Login fallido:", res?.message);
      }
    } catch (err) {
      console.error("Error crítico:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{LOGIN_CSS}</style>

      <div className="sea-login sea-login-wrapper">

        {/* ── Panel izquierdo: Branding ── */}
        <div className="sea-login-left">

          {/* Logo superior */}
          <div className="sea-logo-badge">
            <div className="sea-logo-inner">
              <img src="/logos/LogoWhite.svg" width="128" alt="SEA" className="brightness-0 invert" />
            </div>
            <span className="sea-logo-label"></span>
          </div>

          {/* Tagline central 
          <div className="sea-tagline-block">
            <h1 className="sea-tagline">
              
            </h1>
            <p className="sea-tagline-sub"></p>
          </div> */}

          
          {/* Features 
          <div className="sea-features">
            <div className="sea-feature-pill">
              <div className="sea-feature-icon">
                <Brain size={16} />
              </div>
              Simulacros adaptativos con IA
            </div>
            <div className="sea-feature-pill">
              <div className="sea-feature-icon">
                <TrendingUp size={16} />
              </div>
              Seguimiento de progreso en tiempo real
            </div>
            <div className="sea-feature-pill">
              <div className="sea-feature-icon">
                <ShieldCheck size={16} />
              </div>
              Banco de más de 10.000 preguntas
            </div>
          </div> */}

        </div>

        {/* ── Panel derecho: Formulario ── */}
        <div className="sea-login-right">
          <div className="sea-login-form-wrap">

            <h2 className="sea-form-title">Bienvenido</h2>
            <p className="sea-form-subtitle">Ingresa a tu cuenta para continuar</p>

            {error && (
              <div className="sea-alert-error">{error}</div>
            )}
            {successMessage && (
              <div className="sea-alert-success">{successMessage}</div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="sea-field">
                <label className="sea-field-label">Correo electrónico</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="usuario@sea.com"
                  className="sea-input"
                />
              </div>

              {/* Contraseña */}
              <div className="sea-field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label className="sea-field-label" style={{ margin: 0 }}>Contraseña</label>
                  <Link to="/forgot-password" className="sea-forgot-link"
                    style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#2B7FE8", textDecoration: "none" }}>
                    ¿Olvidaste?
                  </Link>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
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

              <button type="submit" disabled={submitting} className="sea-submit-btn">
                {submitting ? "Verificando..." : "Acceder →"}
              </button>
            </form>

            <div className="sea-divider">
              <div className="sea-divider-line" />
              <span className="sea-divider-text">O entrar con</span>
              <div className="sea-divider-line" />
            </div>

            <a
              href={`${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/auth/google`}
              className="sea-social-btn"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 16, height: 16 }} />
              Continuar con Google
            </a>

            <p className="sea-footer-text">
              ¿Eres nuevo?{" "}
              <Link to="/register">Crear cuenta SEA</Link>
            </p>
          </div>
        </div>

      </div>
    </>
  );
}