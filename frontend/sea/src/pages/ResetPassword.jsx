import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../api/axios";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-white font-bold mb-4">Link inválido o expirado</p>
          <Link to="/forgot-password" className="text-violet-400 hover:text-violet-300 font-bold">
            Solicitar nuevo link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    if (password.length < 6) { setError("Mínimo 6 caracteres"); return; }

    setLoading(true);
    setError(null);
    try {
      await api.post("/password/reset", { token, password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Error al restablecer");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-white font-black text-2xl mb-2">¡Contraseña actualizada!</h2>
          <p className="text-indigo-400">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-white font-black text-3xl">Nueva contraseña</h1>
          <p className="text-indigo-400 mt-2">Elegí una contraseña segura</p>
        </div>

        <div className="bg-indigo-900 rounded-2xl p-6 border border-indigo-700 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nueva contraseña (mín. 6 caracteres)"
            autoFocus
            className="w-full bg-indigo-800 border-2 border-indigo-600 focus:border-violet-400 text-white rounded-xl px-4 py-3 outline-none transition placeholder-indigo-500"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Confirmá la contraseña"
            className="w-full bg-indigo-800 border-2 border-indigo-600 focus:border-violet-400 text-white rounded-xl px-4 py-3 outline-none transition placeholder-indigo-500"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!password || !confirm || loading}
            className="w-full bg-violet-500 hover:bg-violet-400 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition active:scale-95"
          >
            {loading ? "Guardando..." : "Guardar nueva contraseña"}
          </button>
        </div>
      </div>
    </div>
  );
}