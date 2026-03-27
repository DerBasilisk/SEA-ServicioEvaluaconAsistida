import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { io } from "socket.io-client";
import api from "../api/axios";
import useAuthStore from "../store/authStore";
import { Users, UserPlus, Trophy, Search, Sword, Check, X, Trash2, Zap, UserCircle, Star, ChevronRight, } from "lucide-react";
import Avatar from "../components/Avatar";
import toast from "react-hot-toast"; // Asegúrate de tener instalado react-hot-toast

// ─── Estilos Globales SEA ──────────────────────────────────────────────────
const FRIENDS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-friends { font-family: 'Nunito', sans-serif; }
  
  .sea-glass-card {
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 20px 50px rgba(43, 127, 232, 0.1);
  }

  .sea-tab-active {
    background: linear-gradient(135deg, #2B7FE8, #5B9FFF);
    box-shadow: 0 10px 20px rgba(43, 127, 232, 0.3);
    color: white !important;
  }

  .sea-item-card {
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.8);
    transition: all 0.2s ease;
  }
  .sea-item-card:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.9);
    border-color: #2B7FE8;
  }

  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #AAC0D8; border-radius: 10px; }
`;

export default function Friends() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const [duelModal, setDuelModal] = useState(null);
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000",
      { auth: { token }, path: "/socket.io" }
    );
    socketRef.current = socket;

    socket.on("duel:rejected", () => {
      toast.error("El oponente ha declinado el desafío", {
        icon: '🛡️',
        style: { background: '#FEF2F2', color: '#991B1B', border: '1px solid #F87171' }
      });
    });

    return () => socket.disconnect();
  }, [token, navigate]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [f, r, l] = await Promise.all([
        api.get("/friends"),
        api.get("/friends/requests"),
        api.get("/friends/leaderboard"),
      ]);
      setFriends(f.data.data || []);
      setRequests(r.data.data || []);
      setLeaderboard(l.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDuelClick = async (friendId, friendName) => {
    try {
      const { data } = await api.get("/subjects");
      const allLessons = [];
      for (const subject of data.data) {
        const { data: sd } = await api.get(`/subjects/${subject.slug}`);
        sd.data.units?.forEach((u) => u.lessons?.forEach((l) => {
          if (l.status !== "locked") allLessons.push({ ...l, subjectName: subject.name });
        }));
      }
      setLessons(allLessons);
      setDuelModal({ friendId, friendName });
    } catch { alert("Error cargando lecciones"); }
  };

  const handleSendDuelInvite = (lessonId) => {
    if (!socketRef.current || !duelModal) return;
    socketRef.current.emit("duel:invite", {
      friendId: duelModal.friendId,
      lessonId: lessonId
    });
    toast.success(`Desafío enviado a ${duelModal.friendName}`, {
      icon: '⚔️',
      duration: 4000,
      style: {
        background: '#0F2547',
        color: '#fff',
        borderRadius: '1.5rem',
        fontSize: '12px',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        border: '2px solid #2B7FE8'
      }
    });
    setDuelModal(null);
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await api.get(`/friends/search?q=${encodeURIComponent(q)}`);
      setSearchResults(data.data || []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const handleSendRequest = async (username) => {
    try {
      await api.post("/friends/request", { username });
      handleSearch(searchQuery);
    } catch (err) { alert(err.response?.data?.message || "Error"); }
  };

  const handleAccept = async (id) => { await api.put(`/friends/request/${id}/accept`); fetchAll(); };
  const handleReject = async (id) => { await api.put(`/friends/request/${id}/reject`); fetchAll(); };
  const handleRemove = async (userId) => {
    if (!confirm("¿Eliminar amigo?")) return;
    await api.delete(`/friends/${userId}`);
    fetchAll();
  };

  const tabs = [
    { id: "friends", label: "Amigos", icon: <Users size={18}/>, count: friends.length },
    { id: "requests", label: "Solicitudes", icon: <UserPlus size={18}/>, count: requests.length },
    { id: "leaderboard", label: "Ranking", icon: <Trophy size={18}/>, count: null },
    { id: "search", label: "Buscar", icon: <Search size={18}/>, count: null },
  ];

  return (
    <div className="sea-friends min-h-screen pb-12 relative overflow-hidden" 
         style={{ background: "linear-gradient(145deg, #C8E6FF 0%, #A8D4FF 45%, #B8CBFF 100%)" }}>
      <style>{FRIENDS_CSS}</style>
      
      {/* Elementos decorativos de fondo */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-white/30 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-400/10 blur-[100px]" />
      </div>

      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* COLUMNA 1: Perfil y Navegación */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="sea-glass-card p-8 text-center rounded-[2.5rem]">
            <div className="w-24 h-24 bg-gradient-to-br from-[#2B7FE8] to-[#5B9FFF] rounded-[2rem] mx-auto mb-4 flex items-center justify-center text-4xl font-black italic text-white shadow-xl rotate-[-3deg]">
              <Avatar src={user?.avatar} name={user?.displayName || user?.username} size="xl" className="rounded-[2rem] border-4 border-white shadow-xl" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter text-[#0F2547] uppercase italic">{user?.username}</h2>
            <div className="mt-4 bg-white/60 py-2 rounded-2xl border border-white/80">
                <p className="text-[9px] font-extrabold text-[#7A9CC5] uppercase tracking-[0.2em]">Rango Actual</p>
                <p className="text-xl font-black italic text-[#2B7FE8]">NIVEL {user?.level || 1}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-3">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center justify-between px-6 py-5 rounded-[1.8rem] font-extrabold text-xs uppercase tracking-widest transition-all ${
                  tab === t.id 
                  ? "sea-tab-active scale-[1.05]" 
                  : "bg-white/40 text-[#5B7CA3] border border-white/60 hover:bg-white/60"
                }`}
              >
                <div className="flex items-center gap-4">{t.icon} {t.label}</div>
                {t.count > 0 && (
                  <span className={`px-2.5 py-1 rounded-full text-[10px] ${tab === t.id ? 'bg-white/20 text-white' : 'bg-[#2B7FE8]/10 text-[#2B7FE8]'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* COLUMNA 2: Panel de Acción */}
        <main className="lg:col-span-6 sea-glass-card p-8 md:p-10 min-h-[650px] rounded-[3rem]">
          <header className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-4">
                <div className="w-2 h-8 bg-[#2B7FE8] rounded-full shadow-[0_0_15px_rgba(43,127,232,0.5)]"></div>
                <h3 className="text-3xl font-black italic tracking-tighter text-[#0F2547] uppercase">
                  {tabs.find(t => t.id === tab)?.label}
                </h3>
             </div>
          </header>

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-12 h-12 border-4 border-[#2B7FE8]/20 border-t-[#2B7FE8] rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#7A9CC5]">Sincronizando red...</p>
              </div>
            ) : (
              <>
                {tab === "friends" && (
                   friends.length === 0 
                   ? <EmptyState icon={<UserCircle size={60} />} text="Tu lista de aliados está vacía" />
                   : friends.map(f => <FriendItem key={f._id} user={f} onProfile={() => navigate(`/profile/${f.username}`)} onRemove={() => handleRemove(f._id)} onDuel={() => handleDuelClick(f._id, f.displayName || f.username)} />)
                )}

                {tab === "requests" && (
                   requests.length === 0 
                   ? <EmptyState icon={<UserPlus size={60} />} text="No hay solicitudes por ahora" />
                   : requests.map(r => <RequestItem key={r._id} request={r} onAccept={() => handleAccept(r._id)} onReject={() => handleReject(r._id)} />)
                )}

                {tab === "leaderboard" && (
                   <div className="space-y-3">
                     {leaderboard.map((entry, i) => (
                       <LeaderboardItem key={entry.user._id} entry={entry} index={i} isMe={entry.user._id === user?._id} />
                     ))}
                   </div>
                )}

                {tab === "search" && (
                  <div className="space-y-8">
                    <div className="relative group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#AAC0D8] group-focus-within:text-[#2B7FE8] transition-colors" size={22} />
                      <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                        placeholder="BUSCAR JUGADORES POR NOMBRE..."
                        className="w-full bg-white/60 border-2 border-white/80 rounded-[2rem] pl-16 pr-8 py-5 outline-none focus:border-[#2B7FE8]/30 focus:bg-white transition-all font-bold text-sm text-[#0F2547] placeholder:text-[#AAC0D8] shadow-inner"
                      />
                    </div>
                    <div className="space-y-3">
                      {searching && <p className="text-center text-[#2B7FE8] font-black text-[10px] uppercase tracking-widest animate-pulse">Buscando en la base de datos...</p>}
                      {searchResults.map(u => <SearchItem key={u._id} user={u} onSendRequest={() => handleSendRequest(u.username)} onProfile={() => navigate(`/profile/${u.username}`)} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* COLUMNA 3: Sidebar Ranking */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white/80 border-2 border-white rounded-[2.5rem] p-8 shadow-xl">
            <h3 className="text-[10px] font-black text-[#7A9CC5] uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <Star size={16} className="text-yellow-500 fill-yellow-500" /> Top Mundial
            </h3>
            <div className="space-y-6">
              {leaderboard.slice(0, 5).map((entry, i) => (
                <div key={entry.user._id} className="flex items-center gap-4 group">
                  <span className={`text-xs font-black italic ${i === 0 ? "text-[#2B7FE8]" : "text-[#AAC0D8]"}`}>0{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold truncate text-[#0F2547] uppercase group-hover:text-[#2B7FE8] transition-colors cursor-pointer">{entry.user.displayName}</p>
                    <p className="text-[10px] text-[#5B9FFF] font-bold flex items-center gap-1 mt-0.5"><Zap size={10} fill="#5B9FFF"/> {entry.xpEarned} XP</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setTab("leaderboard")} className="w-full mt-10 py-4 bg-[#F0F7FF] hover:bg-[#2B7FE8] text-[#2B7FE8] hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95">
              Ver Salón de la Fama
            </button>
          </div>
        </aside>

      </div>

      {/* MODAL DE DUELO SEA */}
      {duelModal && (
        <div className="fixed inset-0 bg-[#0F2547]/40 z-[100] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="sea-glass-card bg-white/90 p-10 w-full max-w-md rounded-[3rem] shadow-3xl">
            <h3 className="text-2xl font-black italic tracking-tighter text-[#0F2547] uppercase mb-1">Duelo de Habilidades</h3>
            <p className="text-[#7A9CC5] text-[10px] font-extrabold uppercase tracking-widest mb-8">VS {duelModal.friendName}</p>
            
            <div className="space-y-3 max-h-72 overflow-y-auto pr-3 custom-scrollbar">
              {lessons.map(l => (
                <button key={l._id} onClick={() => handleSendDuelInvite(l._id)}
                  className="w-full text-left bg-white hover:bg-[#2B7FE8] border border-white hover:border-[#2B7FE8] p-5 rounded-2xl transition-all group relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <p className="text-[#0F2547] font-black text-sm group-hover:text-white transition-colors">{l.name}</p>
                    <p className="text-[9px] text-[#7A9CC5] font-extrabold group-hover:text-blue-100 transition-colors uppercase tracking-tight mt-1">{l.subjectName}</p>
                  </div>
                  <ChevronRight size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#AAC0D8] group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
            <button onClick={() => setDuelModal(null)} className="w-full mt-8 py-4 text-[#7A9CC5] hover:text-rose-500 font-black text-[10px] uppercase tracking-widest transition-colors">Abortar Misión</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Subcomponentes con Estética SEA ──────────────────────────────────────────

function FriendItem({ user, onProfile, onRemove, onDuel }) {
  return (
    <div className="sea-item-card p-5 rounded-[2rem] flex items-center gap-5 group shadow-sm">
      <div onClick={onProfile} className="cursor-pointer group-hover:scale-105 transition-transform">
        <Avatar src={user.avatar} name={user.displayName || user.username} size="md" className="rounded-2xl border-2 border-white shadow-sm" />
      </div>
      <div className="flex-1 min-w-0" onClick={onProfile}>
        <p className="text-base font-black text-[#0F2547] truncate uppercase tracking-tight italic">{user.displayName || user.username}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] font-black text-[#2B7FE8] bg-blue-50 px-2 py-0.5 rounded-md">LVL {user.level}</span>
          <span className="text-[10px] font-bold text-[#AAC0D8] uppercase tracking-tighter">{user.xp} XP acumulada</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onDuel} className="bg-[#2B7FE8] p-3.5 rounded-xl hover:scale-110 active:scale-90 transition-all shadow-lg shadow-blue-500/30">
          <Sword size={18} className="text-white fill-white"/>
        </button>
        <button onClick={onRemove} className="p-3 text-[#AAC0D8] hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
          <Trash2 size={18}/>
        </button>
      </div>
    </div>
  );
}

function RequestItem({ request, onAccept, onReject }) {
  const u = request.requester;
  return (
    <div className="bg-white/60 border-2 border-white p-5 rounded-[2rem] flex items-center gap-5 animate-in slide-in-from-bottom-4 duration-300">
      <Avatar src={u.avatar} name={u.displayName || u.username} size="md" className="rounded-2xl border-2 border-white shadow-inner" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-[#0F2547] uppercase italic">{u.displayName || u.username}</p>
        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-tight">Solicitud de Alianza</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onAccept} className="bg-[#10B981] p-3 rounded-xl hover:scale-110 transition-all shadow-lg shadow-emerald-500/20 text-white"><Check size={18}/></button>
        <button onClick={onReject} className="bg-white border border-rose-100 text-rose-500 p-3 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><X size={18}/></button>
      </div>
    </div>
  );
}

function LeaderboardItem({ entry, index, isMe }) {
  return (
    <div className={`flex items-center gap-5 p-6 rounded-[2.2rem] border-2 transition-all ${
      isMe ? 'sea-tab-active scale-[1.03] z-10' : 'bg-white/50 border-white hover:bg-white/80'
    }`}>
      <span className={`font-black italic text-lg w-8 ${isMe ? 'text-white' : 'text-[#AAC0D8]'}`}>#{index+1}</span>
      <div className="flex-1 flex items-center gap-4">
        <Avatar src={entry.user.avatar} name={entry.user.displayName || entry.user.username} size="sm"
          className={`rounded-xl border ${isMe ? 'border-white/30' : 'border-blue-50'}`} />
        <p className={`font-black text-sm uppercase tracking-tight italic ${isMe ? 'text-white' : 'text-[#0F2547]'}`}>
          {entry.user.displayName || entry.user.username} {isMe && "(Tú)"}
        </p>
      </div>
      <div className="text-right">
        <p className={`font-black text-sm ${isMe ? 'text-white' : 'text-[#2B7FE8]'}`}>{entry.xpEarned} XP</p>
        <p className={`text-[9px] font-bold uppercase tracking-tighter ${isMe ? 'text-blue-100' : 'text-[#7A9CC5]'}`}>Esta semana</p>
      </div>
    </div>
  );
}

function SearchItem({ user, onSendRequest, onProfile }) {
  return (
    <div className="bg-white/40 border border-white p-5 rounded-[2rem] flex items-center gap-5 hover:bg-white/80 transition-all">
      <div onClick={onProfile} className="cursor-pointer">
        <Avatar src={user.avatar} name={user.displayName || user.username} size="sm" className="rounded-xl border border-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-[#0F2547] uppercase italic">{user.displayName || user.username}</p>
        <p className="text-[10px] text-[#7A9CC5] font-bold uppercase">Nivel {user.level || 1}</p>
      </div>
      {user.friendStatus ? (
        <span className="text-[9px] font-black text-[#7A9CC5] uppercase px-4 py-2 bg-white/60 rounded-xl border border-white">Aliado</span>
      ) : (
        <button onClick={onSendRequest} className="bg-[#2B7FE8] text-white font-black text-[10px] px-6 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20">+ Conectar</button>
      )}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 opacity-30 grayscale">
      <div className="text-[#2B7FE8] mb-6 animate-bounce">{icon}</div>
      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0F2547] text-center max-w-[200px] leading-relaxed">{text}</p>
    </div>
  );
}