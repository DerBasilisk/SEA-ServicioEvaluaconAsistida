import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.post("/password/forgot", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Error al enviar el email");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-4">📬</div>
          <h2 className="text-white font-black text-2xl mb-3">¡Email enviado!</h2>
          <p className="text-indigo-300 mb-6">
            Si el email está registrado, recibirás un link para restablecer tu contraseña. Revisá también tu carpeta de spam.
          </p>
          <Link to="/login" className="text-violet-400 hover:text-violet-300 font-bold">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-white font-black text-3xl">Recuperar contraseña</h1>
          <p className="text-indigo-400 mt-2">Ingresá tu email y te enviamos un link</p>
        </div>

        <div className="bg-indigo-900 rounded-2xl p-6 border border-indigo-700 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="tu@email.com"
            autoFocus
            className="w-full bg-indigo-800 border-2 border-indigo-600 focus:border-violet-400 text-white rounded-xl px-4 py-3 outline-none transition placeholder-indigo-500"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!email.trim() || loading}
            className="w-full bg-violet-500 hover:bg-violet-400 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition active:scale-95"
          >
            {loading ? "Enviando..." : "Enviar link de recuperación"}
          </button>

          <Link to="/login" className="block text-center text-indigo-400 hover:text-white text-sm transition">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}