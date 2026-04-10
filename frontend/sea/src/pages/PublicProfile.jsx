import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Zap, Flame, Diamond, Trophy, ArrowLeft, 
  UserPlus, UserMinus, Clock, Medal, Star,
  ShieldCheck
} from "lucide-react";
import Navbar from "../components/Navbar";
import Avatar from "../components/Avatar";
import api from "../api/axios";

const PUBLIC_PROFILE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-public { font-family: 'Nunito', sans-serif; }
  
  .sea-glass {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 20px 50px var(--glass-shadow);
  }

  .banner-container {
    height: 180px;
    width: 100%;
    position: relative;
    overflow: hidden;
    background: var(--card-bg);
  }

  .banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.8;
  }

  /* Efecto de desvanecimiento inferior para el banner */
  .banner-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 0%, var(--glass-bg) 100%);
  }
`;

const LEAGUE_CONFIG = {
  bronze:   { name: "Bronce",    icon: "🥉", color: "text-[#cd7f32]", bg: "bg-orange-500/10" },
  silver:   { name: "Plata",     icon: "🥈", color: "text-[#c0c0c0]", bg: "bg-slate-500/10" },
  gold:     { name: "Oro",       icon: "🥇", color: "text-[#ffd700]", bg: "bg-yellow-500/10" },
  sapphire: { name: "Zafiro",    icon: "💙", color: "text-[#2B7FE8]", bg: "bg-blue-500/10" },
  emerald:  { name: "Esmeralda", icon: "💚", color: "text-[#10B981]", bg: "bg-emerald-500/10" },
  diamond:  { name: "Diamante",  icon: "💎", color: "text-[#06B6D4]", bg: "bg-cyan-500/10" },
  master:   { name: "Maestro",   icon: "🔮", color: "text-[#8B5CF6]", bg: "bg-purple-500/10" },
  champion: { name: "Campeón",   icon: "👑", color: "text-[#F59E0B]", bg: "bg-rose-500/10" },
  heroic:   { name: "Heroico",   icon: "⚔️", color: "text-[#EF4444]", bg: "bg-red-500/10" },
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
    if (!confirm("¿Eliminar de tu red de contactos?")) return;
    setActionLoading(true);
    try {
      await api.delete(`/friends/${profile._id}`);
      fetchProfile();
    } finally { setActionLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-gradient)] flex items-center justify-center">
      <div className="animate-pulse text-[var(--text-primary)] font-black italic tracking-widest uppercase">Accediendo al Expediente...</div>
    </div>
  );

  if (!profile) return null;

  const league = LEAGUE_CONFIG[profile.league || "bronze"];
  const displayName = profile.displayName || profile.username;
  console.log("profile.banner:", profile.banner);
  
  return (
    <div className="min-h-screen sea-public pb-20 relative overflow-hidden" 
         style={{ background: "var(--bg-gradient)" }}>
      <style>{PUBLIC_PROFILE_CSS}</style>
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-6 pt-8 relative z-10">
        <button onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-[#2B7FE8] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform mb-6">
          <ArrowLeft size={16} /> Volver
        </button>

        {/* TARJETA MAESTRA CON BANNER INTEGRADO */}
        <div className="sea-glass rounded-[3rem] overflow-hidden shadow-2xl mb-8">
          
          {/* SECCIÓN DEL BANNER (Igual que el perfil regular) */}
          <div className="banner-container bg-[#2B7FE8]/10">
            {profile.banner ? (
              
              <img src={profile.banner} alt="User Banner" className="banner-img" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-600/20 to-cyan-500/20" />
            )}
            <div className="banner-overlay" />
          </div>

          {/* CONTENIDO DEL PERFIL */}
          <div className="px-10 pb-10 text-center -mt-16 relative">
            <div className="inline-block p-1.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl mb-4 relative">
              <Avatar src={profile.avatar} name={displayName} size="xl" className="border-2 border-white rounded-2xl" />
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <h1 className="text-4xl font-black italic text-[--text-primary] uppercase tracking-tighter leading-none">{displayName}</h1>
                <ShieldCheck size={20} className="text-[#2B7FE8]" />
              </div>
              <p className="text-[#2B7FE8] font-extrabold text-xs uppercase tracking-[0.3em] mt-2 mb-6">@{profile.username}</p>
            </div>
            
            <div className="flex items-center justify-center gap-3 flex-wrap mb-8">
              <div className="px-5 py-2 bg-[var(--card-bg)] border border-white rounded-full text-[10px] font-black text-[--text-primary] uppercase tracking-widest shadow-sm">
                NIVEL {profile.level}
              </div>
              {league && (
                <div className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white shadow-sm ${league.bg} ${league.color}`}>
                  {league.icon} {league.name}
                </div>
              )}
            </div>

            {/* BOTONES DE ACCIÓN DINÁMICOS */}
            <div className="max-w-xs mx-auto">
              {profile.friendStatus === "accepted" ? (
                <button onClick={handleRemove} disabled={actionLoading}
                  className="w-full py-4 rounded-2xl bg-rose-[--incorrect-bg] text-[--negative] border border-[--negative] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[--negative] hover:text-white transition-all flex items-center justify-center gap-2">
                  <UserMinus size={14} /> Eliminar Contacto
                </button>
              ) : profile.friendStatus === "pending" ? (
                <div className="w-full py-4 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                  <Clock size={14} className="animate-spin" /> {profile.isRequester ? "Enlace Pendiente" : "Solicitud Recibida"}
                </div>
              ) : (
                <button onClick={handleSendRequest} disabled={actionLoading}
                  className="w-full py-4 rounded-2xl bg-[var(--text-accent)] text-[var(--btn-text)] font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.05] shadow-lg transition-all flex items-center justify-center gap-2">
                  <UserPlus size={14} /> Establecer Enlace
                </button>
              )}
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Zap size={20} className="text-blue-500" />, label: "Poder XP", value: profile.xp },
            { icon: <Flame size={20} className="text-orange-500" />, label: "Racha Activa", value: `${profile.streak?.current || 0}D` },
            { icon: <Diamond size={20} className="text-cyan-500" />, label: "Créditos", value: profile.gems },
          ].map((s, idx) => (
            <div key={idx} className="bg-[var(--card-bg)] border-2 border-[var(--glass-border)] rounded-[2rem] p-5 text-center shadow-sm hover:translate-y-[-4px] transition-all">
              <div className="flex justify-center mb-2">{s.icon}</div>
              <div className="text-xl font-black italic text-[var(--text-primary)] tracking-tighter leading-none">{s.value}</div>
              <div className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-2">{s.label}</div>
            </div>
          ))}
        </div>

        {/* LOGROS / CONDECORACIONES */}
        {profile.achievements?.length > 0 && (
          <div className="sea-glass rounded-[2.5rem] p-8">
            <h2 className="text-[--text-primary] font-black italic uppercase text-[11px] tracking-[0.3em] mb-8 flex items-center gap-3">
              <Star size={18} className="text-amber-500" /> Medallas del Operativo
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.achievements.map((a, i) => (
                <div key={i} className="bg-white/40 border border-white/60 rounded-2xl p-4 flex items-center gap-3 group hover:bg-white transition-all">
                  <span className="text-3xl group-hover:rotate-12 transition-transform">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[--text-primary] font-black text-[10px] uppercase italic leading-tight">{a.name}</p>
                    <p className="text-[#7A9CC5] text-[9px] font-bold truncate tracking-tight uppercase mt-0.5">{a.rarity || 'Común'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}