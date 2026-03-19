import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Avatar from "../components/Avatar";
import api from "../api/axios";

const LEAGUE_CONFIG = {
  bronze:   { name: "Bronce",    icon: "🥉", color: "#cd7f32" },
  silver:   { name: "Plata",     icon: "🥈", color: "#c0c0c0" },
  gold:     { name: "Oro",       icon: "🥇", color: "#ffd700" },
  sapphire: { name: "Zafiro",    icon: "💙", color: "#0f52ba" },
  emerald:  { name: "Esmeralda", icon: "💚", color: "#50c878" },
  diamond:  { name: "Diamante",  icon: "💎", color: "#b9f2ff" },
  master:   { name: "Maestro",   icon: "🔮", color: "#9b59b6" },
  champion: { name: "Campeón",   icon: "👑", color: "#f1c40f" },
};

const rarityConfig = {
  common:    { border: "border-indigo-700",    bg: "bg-indigo-900/40",  text: "text-indigo-300", label: "Común"      },
  rare:      { border: "border-blue-500/50",   bg: "bg-blue-500/10",    text: "text-blue-400",   label: "Raro"       },
  epic:      { border: "border-purple-500/50", bg: "bg-purple-500/10",  text: "text-purple-400", label: "Épico"      },
  legendary: { border: "border-yellow-500/50", bg: "bg-yellow-500/10",  text: "text-yellow-400", label: "Legendario" },
};

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
    } catch { navigate("/friends"); }
    finally { setLoading(false); }
  };

  const handleSendRequest = async () => {
    setActionLoading(true);
    try {
      await api.post("/friends/request", { username: profile.username });
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    } finally { setActionLoading(false); }
  };

  const handleRemove = async () => {
    if (!confirm("¿Eliminar amigo?")) return;
    setActionLoading(true);
    try {
      await api.delete(`/friends/${profile._id}`);
      fetchProfile();
    } finally { setActionLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-indigo-950"><Navbar />
      <div className="text-center text-indigo-400 py-20">Cargando...</div>
    </div>
  );

  if (!profile) return null;

  const league = LEAGUE_CONFIG[profile.league || "bronze"];
  const displayName = profile.displayName || profile.username;

  const friendButton = () => {
    if (profile.friendStatus === "accepted") return (
      <button onClick={handleRemove} disabled={actionLoading}
        className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold px-6 py-2 rounded-xl transition">
        Eliminar amigo
      </button>
    );
    if (profile.friendStatus === "pending") return (
      <span className="text-indigo-400 text-sm font-medium px-4 py-2 bg-indigo-800 rounded-xl">
        {profile.isRequester ? "Solicitud enviada" : "Te envió solicitud"}
      </span>
    );
    return (
      <button onClick={handleSendRequest} disabled={actionLoading}
        className="bg-violet-500 hover:bg-violet-400 text-white font-bold px-6 py-2 rounded-xl transition active:scale-95">
        + Agregar amigo
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-indigo-950 pb-20">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="text-indigo-400 hover:text-white mb-6 flex items-center gap-2 transition">
          ← Volver
        </button>

        <div className="bg-indigo-900 border border-indigo-700 rounded-3xl p-8 text-center mb-6">
          <div className="flex justify-center mb-4">
            <Avatar src={profile.avatar} name={displayName} size="2xl" className="border-4 border-indigo-800 shadow-lg" />
          </div>
          <h1 className="text-white font-black text-2xl">{displayName}</h1>
          <p className="text-indigo-400 text-sm mb-4">@{profile.username}</p>
          <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-500/20 border border-violet-500/30 text-violet-300 rounded-full text-sm font-bold">
              Nivel {profile.level}
            </div>
            {league && (
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold border"
                style={{ backgroundColor: league.color + "20", borderColor: league.color + "50", color: league.color }}>
                {league.icon} {league.name}
              </div>
            )}
          </div>
          {friendButton()}
        </div>

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

        {profile.achievements?.length > 0 && (
          <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-5">
            <h2 className="text-white font-bold mb-3 flex items-center gap-2">
              🏆 Logros <span className="text-indigo-400 text-sm font-normal">({profile.achievements.length})</span>
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {profile.achievements.map((a, i) => {
                const style = rarityConfig[a.rarity] || rarityConfig.common;
                return (
                  <div key={i} className={`${style.bg} border ${style.border} rounded-xl p-3 flex items-center gap-3`}>
                    <span className="text-2xl">{a.icon}</span>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{a.name}</p>
                      <p className="text-indigo-400 text-xs">{a.description}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${style.text}`}>{style.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
