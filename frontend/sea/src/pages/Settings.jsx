import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Link2, Trash2, AlertTriangle } from "lucide-react";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState(null);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== user?.username) return;
    setDeleting(true);
    try {
      await api.delete("/auth/delete-account");
      logout();
      navigate("/login");
    } catch (err) {
      showMsg("error", err.response?.data?.message || "Error al eliminar la cuenta");
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-indigo-950 pb-20">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        <h1 className="text-white font-black text-3xl mb-8">Configuración</h1>

        {msg && (
          <div className={`rounded-xl px-4 py-3 text-sm font-bold text-center mb-6 ${
            msg.type === "ok"
              ? "bg-emerald-900 text-emerald-300 border border-emerald-600"
              : "bg-red-900 text-red-300 border border-red-600"
          }`}>
            {msg.text}
          </div>
        )}

        {/* Cuentas vinculadas */}
        <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg flex items-center gap-2 mb-1">
            <Link2 size={20} className="text-violet-400" /> Cuentas vinculadas
          </h2>
          <p className="text-indigo-400 text-sm mb-5">
            Vinculá servicios externos para iniciar sesión más rápido.
          </p>

          <div className="space-y-3">
            {/* Google */}
            <div className="flex items-center justify-between p-4 bg-indigo-800/50 border border-indigo-700 rounded-xl">
              <div className="flex items-center gap-3">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                <div>
                  <p className="text-white font-bold text-sm">Google</p>
                  <p className="text-indigo-400 text-xs">
                    {user.googleId ? "Cuenta vinculada" : "No vinculada"}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                user.googleId
                  ? "bg-emerald-900/40 border-emerald-600/40 text-emerald-400"
                  : "bg-indigo-900 border-indigo-600 text-indigo-500"
              }`}>
                {user.googleId ? "✓ Activo" : "Próximamente"}
              </span>
            </div>

            {/* Discord */}
            <div className="flex items-center justify-between p-4 bg-indigo-800/50 border border-indigo-700 rounded-xl">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
                <div>
                  <p className="text-white font-bold text-sm">Discord</p>
                  <p className="text-indigo-400 text-xs">
                    {user.discordId ? "Cuenta vinculada" : "No vinculada"}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                user.discordId
                  ? "bg-emerald-900/40 border-emerald-600/40 text-emerald-400"
                  : "bg-indigo-900 border-indigo-600 text-indigo-500"
              }`}>
                {user.discordId ? "✓ Activo" : "Próximamente"}
              </span>
            </div>

            {/* Facebook */}
            <div className="flex items-center justify-between p-4 bg-indigo-800/50 border border-indigo-700 rounded-xl">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <div>
                  <p className="text-white font-bold text-sm">Facebook</p>
                  <p className="text-indigo-400 text-xs">No vinculada</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full border bg-indigo-900 border-indigo-600 text-indigo-500">
                Próximamente
              </span>
            </div>
          </div>
        </div>

        {/* Privacidad y seguridad — placeholder para después */}
        <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg flex items-center gap-2 mb-1">
            <Shield size={20} className="text-violet-400" /> Privacidad y seguridad
          </h2>
          <p className="text-indigo-400 text-sm">Más opciones próximamente.</p>
        </div>

        {/* Zona de peligro */}
        <div className="bg-red-950/30 border border-red-800/50 rounded-2xl p-6">
          <h2 className="text-red-400 font-bold text-lg flex items-center gap-2 mb-1">
            <AlertTriangle size={20} /> Zona de peligro
          </h2>
          <p className="text-red-400/70 text-sm mb-5">
            Las acciones de esta sección son permanentes e irreversibles.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 text-red-400 font-bold px-5 py-3 rounded-xl transition active:scale-[0.98]"
            >
              <Trash2 size={18} /> Eliminar mi cuenta
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-950/50 border border-red-700/50 rounded-xl p-4">
                <p className="text-red-300 text-sm font-medium mb-3">
                  Esta acción eliminará permanentemente tu cuenta, progreso, logros y todos tus datos.
                  Para confirmar, escribí tu username: <span className="font-black text-white">@{user.username}</span>
                </p>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={user.username}
                  className="w-full bg-red-950 border-2 border-red-800 focus:border-red-500 text-white rounded-xl px-4 py-3 outline-none transition placeholder-red-900 mb-3"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteInput !== user.username}
                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl transition active:scale-[0.98]"
                  >
                    {deleting ? "Eliminando..." : "Confirmar eliminación"}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                    className="flex-1 bg-indigo-800 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}