import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-indigo-900 border-b border-indigo-700 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/sealogo.svg" alt="SEA Logo" className="w-8 h-8" />
          <span className="text-2xl">🎓</span>
          <span className="text-white font-black text-xl tracking-tight">SEA</span>
        </Link>

        {/* Stats del usuario */}
        {user && (
          <div className="flex items-center gap-4">
            {/* Racha */}
            <div className="flex items-center gap-1 text-orange-400">
              <span>🔥</span>
              <span className="font-bold text-sm">{user.streak?.current || 0}</span>
            </div>

            {/* Gemas */}
            <div className="flex items-center gap-1 text-cyan-400">
              <span>💎</span>
              <span className="font-bold text-sm">{user.gems || 0}</span>
            </div>

            {/* Vidas */}
            <div className="flex items-center gap-1 text-red-400">
              <span>❤️</span>
              <span className="font-bold text-sm">{user.hearts?.current ?? 5}</span>
            </div>

            {/* XP */}
            <div className="flex items-center gap-1 text-violet-400">
              <span>⚡</span>
              <span className="font-bold text-sm">{user.xp || 0} XP</span>
            </div>

            {/* Avatar / perfil */}
            <Link to="/profile" className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-white font-bold text-sm hover:bg-violet-400 transition">
              {user.username?.[0]?.toUpperCase() || "U"}
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="text-indigo-400 hover:text-white text-sm transition"
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
