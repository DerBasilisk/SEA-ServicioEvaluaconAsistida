import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import useAuthStore from "../store/authStore";

const REGISTER_CSS = `
  @keyframes register-fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sea-register-card {
    background: var(--glass-bg);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 24px 64px var(--glass-shadow);
    animation: register-fadeUp .5s ease both .1s;
  }
  .sea-input {
    background: var(--card-bg);
    border: 1.5px solid var(--glass-border);
    color: var(--text-primary);
    transition: all .2s;
  }
  [data-theme="dark"] .sea-input:focus { background: #1e293b; }

  .sea-submit-btn {
    background: var(--text-accent);
    color: var(--btn-text);
    box-shadow: 0 8px 24px var(--glass-shadow);
    transition: all .15s;
  }
`;

export default function Register() {
  const navigate = useNavigate();
  const { register, error, clearError, user, isAuthenticated } = useAuthStore(); // ← quitá loading
  const [submitting, setSubmitting] = useState(false); // ← agregá esto
  
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [localError, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 1. Protección: Si ya está autenticado, fuera de aquí
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
      if (res?.ok) navigate("/");
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <>
      <style>{REGISTER_CSS}</style>

      <div className="sea-register min-h-screen flex items-center justify-center p-6 overflow-hidden relative"
           style={{ background: "var(--bg-gradient)" }}>
        
        {/* Orbes de fondo (respetando el tema) */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-30"
               style={{ background: "var(--deco-blob)", filter: "blur(80px)" }} />
          <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-20"
               style={{ background: "var(--deco-blob2)", filter: "blur(80px)" }} />
        </div>

        <div className="relative z-10 w-full max-w-[460px]">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.5rem] mb-6 bg-[var(--text-accent)] shadow-xl rotate-[-6deg]">
               <img src="/logos/LogoWhite.svg" width="50" alt="SEA" className="brightness-0 invert" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic uppercase text-[var(--text-primary)]">
              Nueva Cuenta
            </h1>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] mt-2 text-[var(--text-secondary)]">
              Comienza tu entrenamiento asistido
            </p>
          </div>

          {/* Form Card */}
          <div className="sea-register-card rounded-[2.5rem] p-8 md:p-10 border border-[var(--glass-border)]">
            {displayError && (
              <div className="mb-5 px-4 py-3 rounded-2xl text-[11px] font-bold text-rose-500 text-center bg-rose-500/10 border border-rose-500/20 animate-pulse">
                {displayError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-1">
                  Usuario
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    placeholder="¿Cómo te llamamos?"
                    className="sea-input w-full rounded-2xl pl-12 pr-5 py-3.5 text-sm active:bg-[var(--glass-bg)] font-bold placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="tu@email.com"
                    className="sea-input w-full rounded-2xl pl-12 pr-5 py-3.5 text-sm font-bold placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              {/* Passwords en Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••"
                      className="sea-input w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold placeholder:text-[var(--text-muted)]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-1">
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
                      className="sea-input w-full rounded-2xl px-5 py-3.5 text-sm font-bold placeholder:text-[var(--text-muted)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-accent)]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="sea-submit-btn w-full font-black py-4 rounded-2xl uppercase italic tracking-[0.2em] text-sm mt-4 disabled:opacity-50"
              >
                {submitting ? "Sincronizando..." : "Crear mi cuenta →"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[var(--glass-border)] text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                ¿Ya eres parte de SEA?{" "}
                <Link to="/login" className="text-[var(--text-accent)] hover:underline">
                  Inicia Sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}