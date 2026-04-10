import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Zap, Flame, Diamond, Heart, Trophy, 
  Edit3, ShieldCheck, Star, Users, 
  LogOut, ChevronRight, Settings, Medal, Loader2,
  Camera, Layout, User as UserIcon
} from "lucide-react";
import Navbar from "../components/Navbar";
import UsernameInput from "../components/Usernameinput";
import useAuthStore from "../store/authStore";
import api from "../api/axios";
import AvatarUpload from "../components/AvatarUpload";
import BannerUpload from "../components/BannerUpload";

const PROFILE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-profile { font-family: 'Nunito', sans-serif; }
  
  .sea-glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 20px 50px var(--glass-shadow);
  }

  .sea-stat-card {
    background: var(--card-bg);
    border: 1.5px solid var(--glass-border);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .sea-stat-card:hover {
    transform: translateY(-5px);
    background: var(--glass-bg);
    border-color: var(--text-accent);
  }

  .sea-progress-track {
    background: var(--glass-shadow);
    border: 1px solid var(--glass-border);
  }

  .sea-btn-primary {
    background: var(--text-accent);
    color: var(--btn-text);
    box-shadow: 0 8px 20px var(--glass-shadow);
  }
`;

const LEAGUE_CONFIG = {
  bronze:   { name: "Bronce",    icon: "🥉", color: "text-[#cd7f32]", bg: "bg-orange-50" },
  silver:   { name: "Plata",     icon: "🥈", color: "text-[#c0c0c0]", bg: "bg-slate-100" },
  gold:     { name: "Oro",       icon: "🥇", color: "text-[#ffd700]", bg: "bg-yellow-50" },
  sapphire: { name: "Zafiro",    icon: "💙", color: "text-[#0f52ba]", bg: "bg-blue-50" },
  emerald:  { name: "Esmeralda", icon: "💚", color: "text-[#50c878]", bg: "bg-emerald-50" },
  diamond:  { name: "Diamante",  icon: "💎", color: "text-[#b9f2ff]", bg: "bg-cyan-50" },
  master:   { name: "Maestro",   icon: "🔮", color: "text-[#9b59b6]", bg: "bg-purple-50" },
  champion: { name: "Campeón",   icon: "👑", color: "text-[#f1c40f]", bg: "bg-rose-50" },
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, fetchMe } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [loading, setLoading] = useState({ display: false, user: false });
  const [msg, setMsg] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [leagueData, setLeagueData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fRes, lRes] = await Promise.all([
          api.get("/friends"),
          api.get("/leagues/me")
        ]);
        setFriends(fRes.data.data?.slice(0, 3) || []);
        setLeagueData(lRes.data.data);
      } catch (err) { console.error(err); }
    };
    if (user) fetchData();
  }, [user]);

  if (!user) return null;

  const handleUpdate = async (type) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      const endpoint = type === 'display' ? "/users/display-name" : "/users/username";
      const payload = type === 'display' ? { displayName } : { username: newUsername };
      await api.put(endpoint, payload);
      await fetchMe();
      setMsg({ type: "ok", text: `¡Actualizado con éxito!` });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Error" });
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const daysLeft = (() => {
    if (!user?.usernameChangedAt) return null;
    const days = Math.ceil(30 - (Date.now() - new Date(user.usernameChangedAt)) / 86400000);
    return days > 0 ? days : null;
  })();

  const league = LEAGUE_CONFIG[leagueData?.league || user?.league || "bronze"];
  const progress = Math.min((user.xp / 1000) * 100, 100);

  return (
    <div className="sea-profile min-h-screen pb-12 relative overflow-hidden"
         style={{ background: "var(--bg-gradient)" }}>
      <style>{PROFILE_CSS}</style>
      
      {/* Elementos decorativos de fondo */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-white/30 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-400/10 blur-[100px]" />
      </div>

      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* COLUMNA IZQUIERDA: Perfil Maestro */}
        <aside className="lg:col-span-4 space-y-6">
          <section className="sea-glass-card rounded-[3rem] overflow-hidden">
            {/* Banner con Overlay */}
            <div className="relative h-32 bg-[#2B7FE8]/20 group">
              <BannerUpload currentBanner={user.banner} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                 <Camera className="text-white" size={24} />
              </div>
            </div>
            
            <div className="px-8 pb-10 text-center -mt-16 relative">
              <div className="inline-block rounded-[2.8rem] mb-4 relative">
                <AvatarUpload currentAvatar={user.avatar} username={user.displayName} size="lg" />
              </div>
              
              <h1 className="text-3xl font-black italic tracking-tighter text-[--text-primary] uppercase leading-none">
                {user.displayName || user.username}
              </h1>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="bg-[#2B7FE8] text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase">PRO</span>
                <p className="text-[#2B7FE8] font-extrabold text-xs uppercase tracking-widest">@{user.username}</p>
              </div>

              <div className="mt-8 space-y-3">
                <button onClick={() => setEditOpen(!editOpen)}
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest transition-all ${
                    editOpen ? "bg-[--sidebar-accent] text-[--text-accent] border-2 border-[--text-accent]" : "bg-[--sidebar-bg] text-[--text-primary] hover:bg-[--glass-bg] border-2 hover:text-[--text-accent] hover:border-[--text-accent]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {editOpen ? <Layout size={16}/> : <Settings size={16} />}
                    {editOpen ? "Panel de Control" : "Configuración"}
                  </div>
                  <ChevronRight size={14} />
                </button>
                
                <button onClick={() => { logout(); navigate("/login"); }}
                  className="w-full flex items-center gap-3 px-6 py-4 rounded-[1.8rem] border-[--text-secondary] text-[--text-secondary] font-black text-[10px] uppercase tracking-widest hover:text-[--negative] border-2 hover:border-[--negative] transition-all"
                >
                  <LogOut size={16} /> Cerrar Ciclo
                </button>
              </div>
            </div>
          </section>

          {/* Estado de la Liga */}
          <section className="sea-glass-card rounded-[2.5rem] p-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7A9CC5] mb-6 flex items-center justify-between">
              Estatus de Competencia <Trophy size={14} />
            </h3>
            <div className={`flex items-center gap-5 ${league.bg} p-6 rounded-3xl border border-white shadow-inner relative overflow-hidden group`}>
              <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:rotate-12 transition-transform">
                <Trophy size={60} />
              </div>
              <span className="text-5xl filter drop-shadow-md z-10">{league.icon}</span>
              <div className="z-10">
                <p className={`font-black ${league.color} text-2xl italic leading-none uppercase tracking-tighter`}>{league.name}</p>
                <p className="text-[10px] font-extrabold text-[#7A9CC5] uppercase mt-2">
                  Ranking Actual: <span className="text-[--text-primary]">#{leagueData?.myRank || "--"}</span>
                </p>
              </div>
            </div>
          </section>
        </aside>

        {/* COLUMNA DERECHA: Datos y Progreso */}
        <div className="lg:col-span-8 space-y-6">
          
          {editOpen ? (
            <section className="sea-glass-card rounded-[3rem] p-10 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-8 bg-[#2B7FE8] rounded-full shadow-[0_0_15px_rgba(43,127,232,0.5)]"></div>
                  <h2 className="text-2xl font-black text-[--text-primary] uppercase italic tracking-tighter">Ajustes del Sistema</h2>
                </div>
                {msg && (
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest animate-bounce ${
                    msg.type === "ok" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                  }`}>
                    {msg.text}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Nombre de Operativo</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-[var(--card-bg)] border-2 border-[var(--glass-border)] rounded-2xl px-6 py-4 text-sm font-bold text-[var(--text-primary)] focus:border-[var(--text-accent)] outline-none transition-all"
                    />
                    <button 
                      onClick={() => handleUpdate('display')} 
                      disabled={loading.display || displayName === user.displayName}
                      className="absolute right-2 top-2 bottom-2 px-6 rounded-xl sea-btn-primary text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                    >
                      {loading.display ? <Loader2 size={16} className="animate-spin"/> : "Guardar"}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[#7A9CC5] uppercase tracking-widest ml-1">
                    ID de Usuario {daysLeft && <span className="text-rose-500">(Cooldown: {daysLeft}d)</span>}
                  </label>
                  <div className="space-y-3">
                    {/* ← Ya no hay div relative ni botón absoluto */}
                    <UsernameInput value={newUsername} onChange={setNewUsername} disabled={!!daysLeft} />
                    <button
                      onClick={() => handleUpdate('user')}
                      disabled={loading.user || !!daysLeft || newUsername === user.username}
                      className="w-full py-3 rounded-xl sea-btn-primary text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all"
                    >
                      {loading.user ? <Loader2 size={16} className="animate-spin mx-auto"/> : "Guardar Username"}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <>
              {/* Barra de Progreso Maestra */}
              <section className="sea-glass-card rounded-[3rem] p-10 relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 relative z-10">
                  <div>
                    <span className="text-[10px] font-black text-[var(--text-accent)] uppercase tracking-[0.4em]">Experiencia de Combate</span>
                    <h2 className="text-6xl font-black italic text-[var(--text-primary)] leading-none mt-2 tracking-tighter uppercase">NIVEL {user.level}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black italic text-[var(--text-accent)] tracking-tight">{user.xp} <span className="text-[var(--text-muted)] text-sm not-italic font-bold">/ 1000 XP</span></p>
                  </div>
                </div>
                
                <div className="h-6 w-full sea-progress-track rounded-full p-1 relative">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--text-accent)] to-[#10B981] rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(43,127,232,0.4)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </section>

              {/* Malla de Estadísticas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard icon={<Zap size={22} />} label="Energía Total" value={user.xp} color="text-blue-500" />
                <StatCard icon={<Flame size={22} />} label="Racha Activa" value={`${user.streak?.current || 0}D`} color="text-orange-500" />
                <StatCard icon={<Diamond size={22} />} label="Créditos" value={user.gems} color="text-cyan-500" />
                <StatCard icon={<Heart size={22} />} label="Vitalidad" value={`${user.hearts?.current ?? 5}/5`} color="text-rose-500" />
              </div>

              {/* Social y Logros */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="sea-glass-card rounded-[2.5rem] p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-[--text-primary]">
                      <Users size={18} className="text-[#2B7FE8]" /> Aliados de Red
                    </h3>
                    <Link to="/friends" className="text-[9px] font-black text-[#2B7FE8] hover:bg-[#2B7FE8]/10 px-3 py-1 rounded-full transition-all uppercase">Expandir</Link>
                  </div>
                  <div className="space-y-4">
                    {friends.map(f => (
                      <div key={f._id} onClick={() => navigate(`/profile/${f.username}`)}
                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/60 transition-all cursor-pointer border border-transparent hover:border-white shadow-sm group">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2B7FE8] to-[#5B9FFF] flex items-center justify-center text-white font-black italic text-lg shadow-lg group-hover:rotate-6 transition-transform">
                          {(f.displayName || f.username)[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-xs uppercase italic tracking-tight text-[--text-primary]">{f.displayName || f.username}</p>
                          <p className="text-[9px] text-[#7A9CC5] font-black uppercase tracking-widest mt-0.5">Nivel {f.level}</p>
                        </div>
                        <ChevronRight size={16} className="text-[#AAC0D8] group-hover:translate-x-1 transition-transform" />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="sea-glass-card rounded-[2.5rem] p-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-[--text-primary] mb-8">
                    <Star size={18} className="text-yellow-500" /> Condecoraciones
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {user.achievements?.map(ach => (
                      <div key={ach.key} title={ach.name} 
                        className="w-16 h-16 rounded-[1.5rem] bg-white/60 flex items-center justify-center text-3xl shadow-sm border border-white hover:scale-110 active:scale-95 transition-all cursor-help relative group">
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#2B7FE8] rounded-full border-2 border-white"></div>
                        {ach.icon}
                      </div>
                    ))}
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/20 border-2 border-dashed border-[#AAC0D8] flex items-center justify-center text-[#AAC0D8]">
                      <Star size={20} className="opacity-40" />
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="sea-stat-card p-6 rounded-[2.5rem] flex flex-col items-center justify-center shadow-sm relative overflow-hidden group">
      <div className={`${color} mb-3 group-hover:scale-110 transition-transform duration-500`}>{icon}</div>
      <span className="text-2xl font-black text-[--text-primary] italic tracking-tighter">{value}</span>
      <span className="text-[9px] font-black text-[#7A9CC5] uppercase tracking-[0.2em] mt-2 text-center leading-tight">{label}</span>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#2B7FE8]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  );
}