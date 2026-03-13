import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react"; // Librería recomendada
import useAuthStore from "../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuthStore();
  
  const [form, setForm] = useState({ email: "", password: "" });
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
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo decorativo con movimiento sutil o desenfoque mayor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600 rounded-full opacity-20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500 rounded-full opacity-10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-indigo-900/50 rounded-2xl border border-indigo-700 shadow-xl mb-4">
            <span className="text-5xl">🎓</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">SEA</h1>
          <p className="text-indigo-300 font-medium">Simulador de Examen Asistido</p>
        </div>

        {/* Card Principal */}
        <div className="bg-indigo-900/80 backdrop-blur-xl border border-indigo-700/50 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <h2 className="text-2xl font-bold text-white mb-6">Bienvenido de nuevo</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-3 mb-6 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="text-indigo-200 text-sm ml-1">Correo electrónico</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 group-focus-within:text-violet-400 transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-indigo-950/50 border border-indigo-700 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400 transition-all"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-indigo-200 text-sm">Contraseña</label>
                <Link to="/forgot-password" size="sm" className="text-xs text-indigo-400 hover:text-violet-300 transition-colors">
                  ¿La olvidaste?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 group-focus-within:text-violet-400 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full bg-indigo-950/50 border border-indigo-700 text-white rounded-xl pl-11 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-indigo-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? "Iniciando sesión..." : <><LogIn size={18} /> Entrar</>}
            </button>
          </form>

          {/* Separador */}
          <div className="relative my-8 text-center">
            <hr className="border-indigo-800" />
            <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-900 px-3 text-xs text-indigo-400 uppercase tracking-widest">
              o continuar con
            </span>
          </div>

          {/* Google Button */}
          <a
            href="http://localhost:3000/api/auth/google"
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-3 rounded-xl hover:bg-gray-100 transition-all shadow-md active:scale-[0.98]"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Google
          </a>

          <p className="text-center text-indigo-300 mt-8 text-sm">
            ¿No tienes una cuenta?{" "}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-bold underline-offset-4 hover:underline">
              Crea una aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}