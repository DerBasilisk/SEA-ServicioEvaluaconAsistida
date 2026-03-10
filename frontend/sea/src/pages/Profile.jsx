import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-indigo-950">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Avatar y nombre */}
        <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-8 mb-6 text-center">
          <div className="w-20 h-20 bg-violet-500 rounded-full flex items-center justify-center text-white text-3xl font-black mx-auto mb-4">
            {user.username?.[0]?.toUpperCase()}
          </div>
          <h1 className="text-white font-black text-2xl">{user.username}</h1>
          <p className="text-indigo-400">{user.email}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-violet-500 bg-opacity-20 text-violet-300 rounded-full text-sm font-medium">
            Nivel {user.level}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard icon="⚡" label="XP Total" value={user.xp} color="text-violet-400" />
          <StatCard icon="🔥" label="Racha" value={`${user.streak?.current || 0} días`} color="text-orange-400" />
          <StatCard icon="💎" label="Gemas" value={user.gems} color="text-cyan-400" />
          <StatCard icon="❤️" label="Vidas" value={`${user.hearts?.current ?? 5}/5`} color="text-red-400" />
        </div>

        {/* Botón logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 bg-opacity-20 hover:bg-opacity-30 border border-red-500 border-opacity-40 text-red-400 font-bold py-3 rounded-xl transition"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-indigo-900 border border-indigo-700 rounded-xl p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`font-black text-xl ${color}`}>{value}</div>
      <div className="text-indigo-400 text-sm">{label}</div>
    </div>
  );
}
