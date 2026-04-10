import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Facebook } from "lucide-react";
import useAuthStore from "../store/authStore";

// ─── Estilos personalizados (Glassmorphism & Animations) ────────────────────
const LOGIN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-login { font-family: 'Nunito', sans-serif; }
  @keyframes login-fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes login-float {
    0%,100% { transform: rotate(-6deg) translateY(0px); }
    50%      { transform: rotate(-6deg) translateY(-6px); }
  }
  .sea-login-card {
    background: var(--glass-bg);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 24px 64px var(--glass-shadow);
    animation: login-fadeUp .5s ease both .1s;
  }
  .sea-login-logo {
    animation: login-float 3s ease-in-out infinite;
  }
  .sea-input {
    background: var(--card-bg);
    border: 1.5px solid var(--glass-border);
    color: var(--text-primary);
    transition: all .2s;
  }
  .sea-input:focus {
    border-color: var(--text-accent);
    background: white; /* Resalte en foco */
    box-shadow: 0 0 0 4px var(--glass-shadow);
  }
  .sea-submit-btn {
    background: var(--text-accent);
    color: var(--btn-text);
    box-shadow: 0 8px 24px var(--glass-shadow);
  }
  .sea-submit-btn:hover:not(:disabled) { transform: translateY(-2px); opacity: 0.95; }
  .sea-submit-btn:active:not(:disabled) { transform: scale(.98); }
  .sea-social-btn {
    background: var(--glass-bg);
    border: 1.5px solid var(--glass-border);
    transition: all .2s;
  }
  .sea-social-btn:hover { background: rgba(255,255,255,0.95); transform: translateY(-2px); }
`;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError, fetchMe } = useAuthStore();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  // ─── Lógica de OAuth (Token en URL) ───────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("sea_token", token);
      fetchMe().then(() => {
        navigate("/admin"); 
      });
    }
  }, [location, navigate, fetchMe]);

  const handleChange = (e) => {
    if (error) clearError();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const res = await login(form.email, form.password);
  
  if (res?.ok) {
    // Redirección basada en rol
    if (res.user?.role === 'admin') {
      navigate("/admin/dashboard");
    } else {
      navigate("/"); // O la ruta principal del simulador
    }
  }
};

  return (
    <>
      <style>{LOGIN_CSS}</style>

      <div
        className="sea-login min-h-screen flex items-center justify-center p-6 overflow-hidden relative"
        style={{ background: "var(--bg-gradient)" }}
      >
        {/* Orbes de fondo */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-30"
            style={{ background: "white", filter: "blur(80px)" }} />
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-20"
            style={{ background: "#8BAEFF", filter: "blur(80px)" }} />
        </div>

        <div className="relative z-10 w-full max-w-[420px]">
          
          {/* Logo SEA */}
          <div className="text-center mb-8" style={{ animation: "login-fadeUp .45s ease both" }}>
            <div className="sea-login-logo inline-flex items-center justify-center w-40 h-20 rounded-[2rem] mb-6">
            <div className="bg-[#2B7FE8] p-1.5 rounded-3xl shadow-lg rotate-[-3deg] group-hover:rotate-0 transition-all">
             <img src="/sealogo.png" width="120" alt="SEA" className="brightness-0 invert" />
            </div>
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic uppercase text-[--text-primary]">
              Bienvenido
            </h1>
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] mt-3 text-[#7A9CC5]">
              Simulador de Examen Asistido
            </p>
          </div>

          {/* Card de Login */}
          <div className="sea-login-card rounded-[2.5rem] p-10">
            {error && (
              <div className="mb-5 px-4 py-3 rounded-2xl text-[11px] font-bold text-rose-600 text-center bg-rose-500/10 border border-rose-500/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#7A9CC5] ml-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="usuario@sea.com"
                  className="sea-input w-full rounded-2xl px-5 py-3.5 text-sm font-semibold text-[--text-primary] placeholder:text-[#AAC0D8]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#7A9CC5]">
                    Contraseña
                  </label>
                  <Link to="/forgot-password" size="sm" className="text-[9px] font-bold text-[#2B7FE8] hover:underline uppercase">
                    ¿Olvidaste?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="sea-input w-full rounded-2xl px-5 py-3.5 pr-12 text-sm font-semibold text-[--text-primary] placeholder:text-[#AAC0D8]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#AAC0D8] hover:text-[#2B7FE8]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="sea-submit-btn w-full text-white font-extrabold py-4 rounded-2xl uppercase italic tracking-widest text-sm mt-2 disabled:opacity-50"
              >
                {loading ? "Verificando..." : "Acceder →"}
              </button>
            </form>

            <div className="relative my-8 flex items-center justify-center">
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#2B7FE8]/20 to-transparent" />
              <span className="absolute px-4 text-[9px] font-extrabold uppercase tracking-widest text-[#7A9CC5] bg-transparent">
                O entrar con
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Botón Google con la URL de tu variable de entorno */}
              <a
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/google`}
                className="sea-social-btn w-full flex items-center justify-center gap-3 rounded-2xl py-3 text-xs font-extrabold uppercase tracking-widest text-[--google]"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                Continuar con Google
              </a>

              <a
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/facebook`}
                className="sea-social-btn w-full flex items-center justify-center gap-3 rounded-2xl py-3 text-xs font-extrabold uppercase tracking-widest text-[--facebook]"
              >
                <Facebook size={16} fill="currentColor" />
                Continuar con Facebook
              </a>
            </div>

            <p className="text-center text-[10px] font-extrabold uppercase tracking-[.1em] mt-7 text-[#7A9CC5]">
              ¿Eres nuevo?{" "}
              <Link to="/register" className="text-[#2B7FE8] hover:underline">
                Crear cuenta SEA
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}