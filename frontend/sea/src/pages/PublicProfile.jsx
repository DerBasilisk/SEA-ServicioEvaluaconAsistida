import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchProfile(); }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/friends/profile/${username}`);
      setProfile(data.data);
    } catch {
      navigate("/friends");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    setActionLoading(true);
    try {
      await api.post("/friends/request", { username: profile.username });
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("¿Eliminar amigo?")) return;
    setActionLoading(true);
    try {
      await api.delete(`/friends/${profile._id}`);
      fetchProfile();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-indigo-950">
      <Navbar />
      <div className="text-center text-indigo-400 py-20">Cargando...</div>
    </div>
  );

  const friendButton = () => {
    if (!profile) return null;
    if (profile.friendStatus === "accepted") {
      return (
        <button onClick={handleRemove} disabled={actionLoading} className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold px-6 py-2 rounded-xl transition">
          Eliminar amigo
        </button>
      );
    }
    if (profile.friendStatus === "pending") {
      return (
        <span className="text-indigo-400 text-sm font-medium px-4 py-2 bg-indigo-800 rounded-xl">
          {profile.isRequester ? "Solicitud enviada" : "Te envió solicitud"}
        </span>
      );
    }
    return (
      <button onClick={handleSendRequest} disabled={actionLoading} className="bg-violet-500 hover:bg-violet-400 text-white font-bold px-6 py-2 rounded-xl transition active:scale-95">
        + Agregar amigo
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-indigo-950 pb-20">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Cabecera */}
        <button onClick={() => navigate(-1)} className="text-indigo-400 hover:text-white mb-6 flex items-center gap-2 transition">
          ← Volver
        </button>

        <div className="bg-indigo-900 border border-indigo-700 rounded-3xl p-8 text-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-tr from-violet-600 to-fuchsia-500 rounded-full flex items-center justify-center text-white text-4xl font-black mx-auto mb-4">
            {(profile.displayName || profile.username)?.[0]?.toUpperCase()}
          </div>
          <h1 className="text-white font-black text-2xl">{profile.displayName || profile.username}</h1>
          <p className="text-indigo-400 text-sm mb-4">@{profile.username}</p>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-500/20 border border-violet-500/30 text-violet-300 rounded-full text-sm font-bold mb-4">
            Nivel {profile.level}
          </div>
          <div className="mt-4">{friendButton()}</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: "⚡", label: "XP Total", value: profile.xp },
            { icon: "🔥", label: "Racha",    value: `${profile.streak?.current || 0} días` },
            { icon: "💎", label: "Gemas",    value: profile.gems },
          ].map((s) => (
            <div key={s.label} className="bg-indigo-900 border border-indigo-700 rounded-2xl p-4 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-white font-black">{s.value}</div>
              <div className="text-indigo-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Logros */}
        {profile.achievements?.length > 0 && (
          <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-5">
            <h2 className="text-white font-bold mb-3">🏆 Logros ({profile.achievements.length})</h2>
            <div className="flex flex-wrap gap-2">
              {profile.achievements.map((a, i) => (
                <span key={i} className="text-2xl" title={a.name}>{a.icon}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}