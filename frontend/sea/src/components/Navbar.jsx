import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";
import api from "../api/axios";


export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, fetchMe } = useAuthStore();
  const [refilling, setRefilling] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [heartsOpen, setHeartsOpen] = useState(false);
  const heartsRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRefill = async () => {
    if (refilling) return;
    setRefilling(true);
    try {
      await api.post("/progress/refill-hearts");
      await fetchMe();
    } catch (err) {
      alert(err.response?.data?.message || "Error al recargar vidas");
    } finally {
      setRefilling(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete("/auth/delete-account");
      logout();
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Error al eliminar la cuenta");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setShowDeleteConfirm(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (location.pathname.startsWith("/lesson/")) return null;

  const hearts = user?.hearts?.current ?? 5;
  const gems = user?.gems || 0;
  const canRefill = hearts < 5 && gems >= 50;

  return (
    <nav className="bg-indigo-900 border-b border-indigo-700 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/sealogo.png" width="60" alt="SEA" />
        </Link>

        {/* Stats */}
        {user && (
          <div className="flex items-center gap-4">
            <Link to="/league" className="text-indigo-400 hover:text-white transition text-sm"><img className="w-9"
                src={`/league.png`}
              /></Link>
            <Link to="/friends" className="text-indigo-400 hover:text-white transition text-sm"><img className="w-9"
                src={`/friends.png`}
              /></Link>

            <div className="flex items-center gap-1 text-orange-400">
              <img className="w-9"
                src={`/streak.png`}
              />
              <span className="font-bold text-sm">{user.streak?.current || 0}</span>
            </div>

            <div className="flex items-center gap-1 text-cyan-400">
              <img className="w-9"
                src={`/gems.png`}
              />
              <span className="font-bold text-sm">{gems}</span>
            </div>

            {/* Corazones — un ícono con contador y popover */}
            <div className="relative">
              <button
                onClick={() => setHeartsOpen((o) => !o)}
                className="flex items-center gap-1 hover:scale-110 transition active:scale-95"
              >
                <span className={`text-lg ${hearts === 0 ? "opacity-40" : "opacity-100"}`}>❤️</span>
                <span className={`font-bold text-sm ${hearts === 0 ? "text-red-400" : "text-white"}`}>
                  {hearts}
                </span>
              </button>

              {heartsOpen && (
                <div ref={heartsRef} className="absolute right-0 mt-2 w-56 bg-indigo-900 border border-indigo-700 rounded-xl shadow-xl z-50 p-4">
                  {/* Corazones visuales */}
                  <div className="flex justify-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-xl ${i < hearts ? "opacity-100" : "opacity-20"}`}>❤️</span>
                    ))}
                  </div>

                  <p className="text-white font-bold text-sm text-center mb-1">{hearts}/5 vidas</p>

                  {hearts < 5 ? (
                    <>
                      <p className="text-indigo-400 text-xs text-center mb-3">
                        {hearts === 0 ? "¡Sin vidas! Recargá para seguir." : "Se recargan automáticamente cada 30 min."}
                      </p>
                      <button
                        onClick={async () => { await handleRefill(); setHeartsOpen(false); }}
                        disabled={!canRefill || refilling}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-2.5 rounded-xl text-sm transition active:scale-95"
                      >
                        {refilling ? "Recargando..." : canRefill ? `Recargar por 50 💎` : `Necesitás 50 💎 (tenés ${gems})`}
                      </button>
                    </>
                  ) : (
                    <p className="text-emerald-400 text-xs text-center">¡Vidas completas!</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-violet-400">
              <img className="w-9"
                src={`/xp.png`}
              />
              <span className="font-bold text-sm">{user.xp || 0} XP</span>
            </div>

            {/* Avatar con dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-violet-500 hover:border-violet-300 transition flex-shrink-0"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
                    {(user.displayName || user.username)?.[0]?.toUpperCase()}
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-indigo-900 border border-indigo-700 rounded-xl shadow-xl overflow-hidden z-50">
                  {/* Header del dropdown */}
                  <div className="px-4 py-3 border-b border-indigo-700">
                    <p className="text-white font-bold text-sm truncate">{user.displayName || user.username}</p>
                    <p className="text-indigo-400 text-xs truncate">@{user.username}</p>
                  </div>

                  {/* Opciones */}
                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-200 hover:bg-indigo-800 hover:text-white transition"
                    >
                      👤 Mi perfil
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-200 hover:bg-indigo-800 hover:text-white transition"
                    >
                      ⚙️ Configuración
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-200 hover:bg-indigo-800 hover:text-white transition"
                    >
                      🚪 Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}