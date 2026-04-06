import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Facebook } from "lucide-react";
import useAuthStore from "../store/authStore";

// ─── Solo lo que Tailwind no puede hacer ────────────────────────────────────
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
    background: rgba(255,255,255,0.55);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1.5px solid rgba(255,255,255,0.75);
    box-shadow:
      0 24px 64px rgba(43,127,232,.13),
      0 4px 16px rgba(43,127,232,.07),
      inset 0 1px 0 rgba(255,255,255,.9);
    animation: login-fadeUp .5s ease both .1s;
  }

  .sea-login-logo {
    animation: login-float 3s ease-in-out infinite;
    box-shadow: 0 12px 32px rgba(43,127,232,.2), inset 0 1px 0 rgba(255,255,255,.6);
  }
  .sea-login-logo:hover {
    animation: none;
    transform: rotate(0deg) scale(1.05);
    transition: transform .4s;
  }

  .sea-input {
    background: rgba(255,255,255,0.6);
    border: 1.5px solid rgba(255,255,255,0.8);
    box-shadow: inset 0 2px 6px rgba(43,127,232,.06);
    transition: border-color .2s, background .2s, box-shadow .2s;
  }
  .sea-input:focus {
    outline: none;
    background: rgba(255,255,255,0.9);
    border-color: rgba(43,127,232,.5);
    box-shadow: 0 0 0 3px rgba(43,127,232,.1), inset 0 2px 6px rgba(43,127,232,.04);
  }

  .sea-submit-btn {
    background: linear-gradient(135deg, #2B7FE8, #5B9FFF);
    box-shadow: 0 8px 24px rgba(43,127,232,.35), inset 0 1px 0 rgba(255,255,255,.2);
    transition: transform .15s, box-shadow .15s, opacity .15s;
  }
  .sea-submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(43,127,232,.45), inset 0 1px 0 rgba(255,255,255,.2);
  }
  .sea-submit-btn:active:not(:disabled) { transform: scale(.98); }
  .sea-submit-btn:disabled { opacity: .7; cursor: not-allowed; }

  .sea-social-btn {
    background: rgba(255,255,255,0.7);
    border: 1.5px solid rgba(255,255,255,0.8);
    box-shadow: 0 4px 12px rgba(43,127,232,.07);
    transition: background .2s, transform .15s, box-shadow .15s;
  }
  .sea-social-btn:hover {
    background: rgba(255,255,255,0.95);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(43,127,232,.12);
  }
  .sea-social-btn:active { transform: scale(.97); }

  .sea-divider-line {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(43,127,232,.15), transparent);
  }
`;

// ════════════════════════════════════════════════════════════════════════════
export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuthStore();

  const [form, setForm]               = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    if (error) clearError();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(form.email, form.password);
    if (res?.ok) navigate("/");
  };

  return (
    <>
      <style>{LOGIN_CSS}</style>

      <div
        className="sea-login min-h-screen flex items-center justify-center p-6 overflow-hidden relative"
        style={{ background: "linear-gradient(145deg, #C8E6FF 0%, #A8D4FF 45%, #B8CBFF 100%)" }}
      >
        {/* ── Orbes de profundidad ── */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full"
            style={{ background: "rgba(255,255,255,0.25)", filter: "blur(80px)" }} />
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full"
            style={{ background: "rgba(139,174,255,0.2)", filter: "blur(80px)" }} />
        </div>

        <div className="relative z-10 w-full max-w-[420px]">

          {/* ── LOGO + TÍTULO ── */}
          <div className="text-center mb-8" style={{ animation: "login-fadeUp .45s ease both" }}>
            <div
              className="sea-login-logo inline-flex items-center justify-center w-20 h-20 rounded-[2rem] mb-6 border-2 border-white/70 cursor-default"
              style={{ background: "rgba(255,255,255,0.6)" }}
            >
              <span
                className="text-3xl font-black italic tracking-tighter"
                style={{
                  background: "linear-gradient(135deg,#2B7FE8,#6B9FFF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >SEA</span>
            </div>

            <h1 className="text-4xl font-black tracking-tighter italic uppercase leading-none text-[#0F2547]">
              Bienvenido
            </h1>
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] mt-3 text-[#7A9CC5]">
              Identificación de usuario
            </p>
          </div>

          {/* ── CARD ── */}
          <div className="sea-login-card rounded-[2.5rem] p-10">

            {/* Error global */}
            {error && (
              <div className="mb-5 px-4 py-3 rounded-2xl text-[11px] font-bold text-rose-600 text-center"
                style={{ background: "rgba(244,63,94,.08)", border: "1px solid rgba(244,63,94,.2)" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#7A9CC5] ml-1">
                  Correo
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="usuario@sea.com"
                  className="sea-input w-full rounded-2xl px-5 py-3.5 text-sm font-semibold text-[#0F2547] placeholder:text-[#AAC0D8]"
                />
              </div>

              {/* Contraseña */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#7A9CC5] ml-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="sea-input w-full rounded-2xl px-5 py-3.5 pr-12 text-sm font-semibold text-[#0F2547] placeholder:text-[#AAC0D8]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors text-[#AAC0D8] hover:text-[#2B7FE8]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="sea-submit-btn w-full text-white font-extrabold py-4 rounded-2xl uppercase italic tracking-widest text-sm mt-2"
              >
                {loading ? "Verificando..." : "Acceder →"}
              </button>
            </form>

            {/* Separador */}
            <div className="relative my-8 flex items-center justify-center">
              <div className="sea-divider-line w-full" />
              <span
                className="absolute px-4 text-[9px] font-extrabold uppercase tracking-widest text-[#7A9CC5]"
                style={{ background: "transparent" }}
              >O entrar con</span>
            </div>

            {/* Botones sociales */}
            <div className="flex flex-col gap-3">
              <a
                href="http://localhost:3000/api/auth/google"
                className="sea-social-btn w-full flex items-center justify-center gap-3 rounded-2xl py-3 text-xs font-extrabold uppercase tracking-widest text-[#3B5A8A]"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                Continuar con Google
              </a>

              <a
                href="http://localhost:3000/api/auth/facebook"
                className="sea-social-btn w-full flex items-center justify-center gap-3 rounded-2xl py-3 text-xs font-extrabold uppercase tracking-widest text-[#1877F2]"
              >
                <Facebook size={16} fill="currentColor" />
                Continuar con Facebook
              </a>
            </div>

            {/* Registro */}
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