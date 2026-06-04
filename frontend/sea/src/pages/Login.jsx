import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import useAuthStore from "../store/authStore";
import useThemeStore from "../store/themeStore";

// ─── Estilos (Two-Column Split Layout + Animaciones) ─────────────────────────
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

  /* ── Panel izquierdo (branding + animaciones) ── */
  .sea-login-left {
    flex: 1;
    background: var(--bg-gradient);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 3rem;
    position: relative;
    overflow: hidden;
    isolation: isolate;
  }

  /* Capa animada de fondo (SVG y patrones) */
  .sea-bg-animations {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  /* Elementos individuales animados */
  .sea-bg-shape {
    position: absolute;
    opacity: 0.3;
    will-change: transform;
  }

  /* Rotación continua */
  .rotate-slow {
    animation: rotateShape 30s linear infinite;
  }
  .rotate-medium {
    animation: rotateShape 18s linear infinite;
  }
  .rotate-fast {
    animation: rotateShape 12s linear infinite;
  }
  .rotate-reverse {
    animation: rotateReverse 22s linear infinite;
  }

  @keyframes rotateShape {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes rotateReverse {
    from { transform: rotate(360deg); }
    to { transform: rotate(0deg); }
  }

  /* Flotación y movimiento */
  .float-1 {
    animation: floatMove 14s ease-in-out infinite;
  }
  .float-2 {
    animation: floatMove 19s ease-in-out infinite reverse;
  }
  .float-3 {
    animation: floatMove 11s ease-in-out infinite alternate;
  }

  @keyframes floatMove {
    0% { transform: translate(0, 0) rotate(0deg); }
    50% { transform: translate(20px, -30px) rotate(5deg); }
    100% { transform: translate(-10px, 20px) rotate(-3deg); }
  }

  /* Patrón de ondas en movimiento */
  .wave-pattern {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 200px;
    background: repeating-linear-gradient(
      95deg,
      var(--doodle-bg) 0px,
      var(--doodle-bg) 2px,
      transparent 2px,
      transparent 8px
    );
    background-size: 200% 100%;
    animation: slideWave 100s linear infinite;
  }

  @keyframes slideWave {
    0% { background-position: 0% 0%; }
    100% { background-position: 200% 0%; }
  }

  /* Partículas de puntos móviles (patrón animado) */
  .dots-pattern {
    position: absolute;
    top: 0;
    right: 0;
    width: 80%;
    height: 80%;
    background-image: radial-gradient(circle at 2px 2px, var(--doodle-bg) 1.5px, transparent 1.5px);
    background-size: 24px 24px;
    animation: shiftDots 25s linear infinite;
    opacity: 0.4;
  }

  @keyframes shiftDots {
    0% { background-position: 0 0; }
    100% { background-position: 48px 48px; }
  }

  /* Logo y textos se mantienen por encima de las animaciones */
  .sea-logo-badge, .sea-tagline-block, .sea-features {
    position: relative;
    z-index: 2;
  }

  /* Mantén el resto de estilos originales (inputs, botones, etc.) */
  /* ... (desde aquí todo igual que tu código original) ... */

  .sea-logo-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    width: fit-content;
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

  /* ── Panel derecho (formulario) - sin cambios ── */
  .sea-login-right {
    width: 420px;
    background: var(--glass-bg);
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

  .sea-social-btn {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: var(--card-bg);
    border: 1.5px solid var(--glass-border, #D4E3F5);
    border-radius: 12px;
    padding: 12px;
    font-size: 12px;
    font-weight: 800;
    font-family: 'Nunito', sans-serif;
    letter-spacing: .06em;
    text-decoration: none;
    transition: background .15s, transform .15s;
  }
  .sea-social-btn:hover { background: rgba(255,255,255,.95); transform: translateY(-1px); }

  .sea-footer-text {
    text-align: center;
    font-size: 10px; font-weight: 800;
    letter-spacing: .1em; text-transform: uppercase;
    color: #AAC0D8;
    margin-top: 20px;
  }
  .sea-footer-text a { color: #2B7FE8; text-decoration: none; }
  .sea-footer-text a:hover { text-decoration: underline; }

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

  function LogoMark() {
    const { theme } = useThemeStore();

    const getLogoSrc = (theme) => {
      switch (theme) {
        case 'light':        return '/logos/LogoBlue.svg';
        case 'dark':         return '/logos/LogoWhite.svg';
        case 'high-contrast': return '/logos/LogoCyan.svg';
        default:             return '/logos/LogoWhite.svg';
      }
    };

    return (
      <Link 
        to="/" 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          textDecoration: "none", 
          flexShrink: 0 
        }}
      >
        <img 
          src={getLogoSrc(theme)}
          width={130} 
          alt="SEA" 
          style={{ 
            display: "block",
            transition: "opacity 0.4s ease, transform 0.3s ease"
          }} 
        />
      </Link>
    );
  }

  return (
    <>
      <style>{LOGIN_CSS}</style>

      <div className="sea-login sea-login-wrapper">
        {/* ── Panel izquierdo: Branding + Animaciones ── */}
        <div className="sea-login-left">
          {/* Capa de animaciones SVG y patrones */}
          <div className="sea-bg-animations">
            {/* Patrón de puntos en movimiento */}
            <div className="dots-pattern"></div>
            
            {/* Onda deslizante inferior */}
            <div className="wave-pattern"></div>

            {/* SVG 1 - Anillo rotatorio lento */}
            <svg
              className="sea-bg-shape rotate-slow float-1"
              width="280"
              height="280"
              viewBox="0 0 100 100"
              style={{ top: '5%', left: '-5%' }}
            >
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--doodle-bg)" strokeWidth="2" strokeDasharray="6 6" />
              <circle cx="50" cy="50" r="25" fill="none" stroke="var(--doodle-bg)" strokeWidth="1.5" />
            </svg>

            {/* SVG 2 - Triángulo que flota y gira */}
            <svg
              className="sea-bg-shape rotate-medium float-2"
              width="180"
              height="180"
              viewBox="0 0 100 100"
              style={{ bottom: '15%', right: '-8%' }}
            >
              <polygon points="50,10 90,85 10,85" fill="none" stroke="var(--doodle-bg)" strokeWidth="2.5" />
              <polygon points="50,30 70,70 30,70" fill="var(--doodle-bg)" stroke="var(--doodle-bg)" strokeWidth="1" />
            </svg>

            {/* SVG 3 - Estrella / hexágono giratorio rápido */}
            <svg
              className="sea-bg-shape rotate-fast float-3"
              width="140"
              height="140"
              viewBox="0 0 100 100"
              style={{ top: '40%', left: '20%' }}
            >
              <polygon
                points="50,5 61,35 95,35 68,55 79,85 50,65 21,85 32,55 5,35 39,35"
                fill="none"
                stroke="var(--doodle-bg)"
                strokeWidth="1.8"
              />
            </svg>

            {/* SVG 4 - Anillos concéntricos rotación reversa */}
            <svg
              className="sea-bg-shape rotate-reverse"
              width="220"
              height="220"
              viewBox="0 0 100 100"
              style={{ bottom: '30%', left: '-15%' }}
            >
              <circle cx="50" cy="50" r="30" fill="none" stroke="var(--doodle-bg)" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="18" fill="none" stroke="var(--doodle-bg)" strokeWidth="1" strokeDasharray="4 4" />
            </svg>

            {/* SVG 5 - Cruz / aspas en movimiento */}
            <svg
              className="sea-bg-shape float-1"
              width="100"
              height="100"
              viewBox="0 0 100 100"
              style={{ top: '65%', right: '10%' }}
            >
              <line x1="20" y1="20" x2="80" y2="80" stroke="var(--doodle-bg)" strokeWidth="2" />
              <line x1="80" y1="20" x2="20" y2="80" stroke="var(--doodle-bg)" strokeWidth="2" />
              <circle cx="50" cy="50" r="10" fill="var(--doodle-bg)" stroke="var(--doodle-bg)" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Logo superior (se mantiene por encima) */}
          <div className="sea-logo-badge">
            <div className="sea-logo-inner">
              <LogoMark />
            </div>
            <span className="sea-logo-label"></span>
          </div>

          {/* (Opcional: aquí puedes descomentar las features o tagline si deseas texto) */}
          {/* <div className="sea-tagline-block"> ... </div> */}
          {/* <div className="sea-features"> ... </div> */}
        </div>

        {/* ── Panel derecho: Formulario (sin cambios) ── */}
        <div className="sea-login-right">
          <div className="sea-login-form-wrap">
            <h2 className="sea-form-title">Bienvenido</h2>
            <p className="sea-form-subtitle">Ingresa a tu cuenta para continuar</p>

            {error && <div className="sea-alert-error">{error}</div>}
            {successMessage && <div className="sea-alert-success">{successMessage}</div>}

            <form onSubmit={handleSubmit}>
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
              className="sea-social-btn text-[--text-primary] hover:text-[--text-hover]"
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