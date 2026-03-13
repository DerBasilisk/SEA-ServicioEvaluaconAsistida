import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    clearError();
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(form.email, form.password);
    if (res.ok) navigate("/");
  };

  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-violet-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-500 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🎓</div>
          <h1 className="text-4xl font-black text-white tracking-tight">SEA</h1>
          <p className="text-indigo-300 mt-1">Simulador de Examen Asistido</p>
        </div>

        {/* Card */}
        <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Iniciar sesión</h2>

          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-indigo-300 text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full bg-indigo-800 border border-indigo-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-violet-400 transition placeholder-indigo-500"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-indigo-300 text-sm font-medium mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full bg-indigo-800 border border-indigo-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-violet-400 transition placeholder-indigo-500"
                placeholder="••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-500 hover:bg-violet-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all active:scale-95 mt-2"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          
  <a href="http://localhost:3000/api/auth/google" className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition">
  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
  Continuar con Google
</a>

          <p className="text-center text-indigo-400 mt-6 text-sm">
            ¿No tenés cuenta?{" "}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-semibold">
              Registrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
