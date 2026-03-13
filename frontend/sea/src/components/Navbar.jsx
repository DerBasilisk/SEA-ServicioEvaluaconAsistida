
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, fetchMe } = useAuthStore();
  const [refilling, setRefilling] = useState(false);

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

  // No mostrar navbar en la pantalla de lección
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
            <Link to="/friends" className="text-indigo-400 hover:text-white transition text-sm">
              👥
            </Link>
            {/* Racha */}
            <div className="flex items-center gap-1 text-orange-400">
              <span>🔥</span>
              <span className="font-bold text-sm">{user.streak?.current || 0}</span>
            </div>

            {/* Gemas */}
            <div className="flex items-center gap-1 text-cyan-400">
              <span>💎</span>
              <span className="font-bold text-sm">{gems}</span>
            </div>

            {/* Vidas — clickeable si puede recargar */}
            <button
              onClick={canRefill ? handleRefill : undefined}
              disabled={refilling}
              title={canRefill ? "Usar 50 💎 para recargar vidas" : hearts < 5 ? "No tenés suficientes gemas (necesitás 50)" : ""}
              className={`flex items-center gap-1 transition ${
                canRefill ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-default"
              }`}
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-sm ${i < hearts ? "opacity-100" : "opacity-20"}`}>❤️</span>
                ))}
              </div>
              {hearts < 5 && (
                <span className={`text-xs font-bold ml-1 ${canRefill ? "text-cyan-400" : "text-indigo-500"}`}>
                  {canRefill ? "50💎" : `${gems}/50💎`}
                </span>
              )}
            </button>

            {/* XP */}
            <div className="flex items-center gap-1 text-violet-400">
              <span>⚡</span>
              <span className="font-bold text-sm">{user.xp || 0} XP</span>
            </div>

            {/* Avatar */}
            <Link to="/profile" className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-white font-bold text-sm hover:bg-violet-400 transition">
              {(user.displayName || user.username)?.[0]?.toUpperCase() || "U"}
            </Link>

            {/* Logout */}
            <button onClick={handleLogout} className="text-indigo-400 hover:text-white text-sm transition">
              Salir
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}