import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import useAuthStore from "../store/authStore";

// ─── Estilos consistentes con el Login ──────────────────────────────────────
const REGISTER_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-register { font-family: 'Nunito', sans-serif; }
  
  @keyframes register-fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes register-float {
    0%,100% { transform: rotate(-6deg) translateY(0px); }
    50%      { transform: rotate(-6deg) translateY(-6px); }
  }

  .sea-register-card {
    background: rgba(255,255,255,0.55);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1.5px solid rgba(255,255,255,0.75);
    box-shadow: 0 24px 64px rgba(43,127,232,.13), inset 0 1px 0 rgba(255,255,255,.9);
    animation: register-fadeUp .5s ease both .1s;
  }

  .sea-register-logo {
    animation: register-float 3s ease-in-out infinite;
    box-shadow: 0 12px 32px rgba(43,127,232,.2);
  }

  .sea-input {
    background: rgba(255,255,255,0.6);
    border: 1.5px solid rgba(255,255,255,0.8);
    transition: all .2s;
  }
  .sea-input:focus {
    outline: none;
    background: rgba(255,255,255,0.9);
    border-color: rgba(43,127,232,.5);
    box-shadow: 0 0 0 3px rgba(43,127,232,.1);
  }

  .sea-submit-btn {
    background: linear-gradient(135deg, #2B7FE8, #5B9FFF);
    box-shadow: 0 8px 24px rgba(43,127,232,.35);
    transition: all .15s;
  }
  .sea-submit-btn:hover:not(:disabled) { transform: translateY(-2px); opacity: 0.95; }
  .sea-submit-btn:active:not(:disabled) { transform: scale(.98); }
`;

export default function Register() {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuthStore();
  
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [localError, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    const res = await register(form.username, form.email, form.password);
    if (res?.ok) navigate("/");
  };

  const displayError = localError || error;

  return (
    <>
      <style>{REGISTER_CSS}</style>

      <div
        className="sea-register min-h-screen flex items-center justify-center p-6 overflow-hidden relative"
        style={{ background: "linear-gradient(145deg, #C8E6FF 0%, #A8D4FF 45%, #B8CBFF 100%)" }}
      >
        {/* Orbes de fondo */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-30"
            style={{ background: "white", filter: "blur(80px)" }} />
          <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-20"
            style={{ background: "#8BAEFF", filter: "blur(80px)" }} />
        </div>

        <div className="relative z-10 w-full max-w-[440px]">
          
          {/* Logo SEA */}
          <div className="text-center mb-8" style={{ animation: "register-fadeUp .45s ease both" }}>
            <div className="sea-register-logo inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] mb-4 border-2 border-white/70 bg-white/60">
              <span className="text-2xl font-black italic tracking-tighter bg-gradient-to-br from-[#2B7FE8] to-[#6B9FFF] bg-clip-text text-transparent">
                SEA
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic uppercase text-[#0F2547]">
              Crear Cuenta
            </h1>
            <p className="text-[10px] font-extrabold uppercase tracking-[.2em] mt-2 text-[#7A9CC5]">
              Únete al Simulador de Examen Asistido
            </p>
          </div>

          {/* Card de Registro */}
          <div className="sea-register-card rounded-[2.5rem] p-8 md:p-10">
            {displayError && (
              <div className="mb-5 px-4 py-3 rounded-2xl text-[11px] font-bold text-rose-600 text-center bg-rose-500/10 border border-rose-500/20">
                {displayError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Usuario */}
              <div className="space-y-1">
                <label className="block text-[9px] font-extrabold uppercase tracking-widest text-[#7A9CC5] ml-1">
                  Nombre de usuario
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAC0D8]" size={16} />
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    placeholder="Tu nombre o alias"
                    className="sea-input w-full rounded-2xl pl-12 pr-5 py-3 text-sm font-semibold text-[#0F2547] placeholder:text-[#AAC0D8]"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[9px] font-extrabold uppercase tracking-widest text-[#7A9CC5] ml-1">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAC0D8]" size={16} />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="ejemplo@correo.com"
                    className="sea-input w-full rounded-2xl pl-12 pr-5 py-3 text-sm font-semibold text-[#0F2547] placeholder:text-[#AAC0D8]"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[9px] font-extrabold uppercase tracking-widest text-[#7A9CC5] ml-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAC0D8]" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••"
                      className="sea-input w-full rounded-2xl pl-11 pr-4 py-3 text-sm font-semibold text-[#0F2547] placeholder:text-[#AAC0D8]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-extrabold uppercase tracking-widest text-[#7A9CC5] ml-1">
                    Confirmar
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirm"
                      value={form.confirm}
                      onChange={handleChange}
                      required
                      placeholder="••••••"
                      className="sea-input w-full rounded-2xl px-5 py-3 text-sm font-semibold text-[#0F2547] placeholder:text-[#AAC0D8]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAC0D8] hover:text-[#2B7FE8]"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="sea-submit-btn w-full text-white font-extrabold py-4 rounded-2xl uppercase italic tracking-widest text-sm mt-4 disabled:opacity-50"
              >
                {loading ? "Creando perfil..." : "Registrarme →"}
              </button>
            </form>

            <p className="text-center text-[10px] font-extrabold uppercase tracking-[.1em] mt-8 text-[#7A9CC5]">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-[#2B7FE8] hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}