import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Register() {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [localError, setLocalError] = useState("");

  const handleChange = (e) => {
    clearError();
    setLocalError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setLocalError("Las contraseñas no coinciden");
      return;
    }
    const res = await register(form.username, form.email, form.password);
    if (res.ok) navigate("/");
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-cyan-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-violet-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🚀</div>
          <h1 className="text-4xl font-black text-white tracking-tight">Empezá hoy</h1>
          <p className="text-indigo-300 mt-1">Creá tu cuenta gratis</p>
        </div>

        {/* Card */}
        <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Crear cuenta</h2>

          {displayError && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 rounded-lg p-3 mb-4 text-sm">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-indigo-300 text-sm font-medium mb-1">Usuario</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={20}
                className="w-full bg-indigo-800 border border-indigo-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-violet-400 transition placeholder-indigo-500"
                placeholder="tunombre"
              />
            </div>

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
                minLength={6}
                className="w-full bg-indigo-800 border border-indigo-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-violet-400 transition placeholder-indigo-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-indigo-300 text-sm font-medium mb-1">Confirmar contraseña</label>
              <input
                type="password"
                name="confirm"
                value={form.confirm}
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
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="text-center text-indigo-400 mt-6 text-sm">
            ¿Ya tenés cuenta?{" "}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-semibold">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
