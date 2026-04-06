import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { io } from "socket.io-client";
import api from "../api/axios";
import useAuthStore from "../store/authStore";
import { Users, UserPlus, Trophy, Search, Sword, Check, X, Trash2, Zap, UserCircle, Star } from "lucide-react";

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

  // --- Lógica Mantenida ---
  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000",
      { auth: { token }, path: "/socket.io" }
    );
    socketRef.current = socket;
    socket.on("duel:start", (data) => navigate(`/duel/${data.duelId}`));
    socket.on("duel:rejected", () => alert("El amigo rechazó el duelo"));
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
    { id: "friends", label: "Amigos", icon: <Users size={16}/>, count: friends.length },
    { id: "requests", label: "Solicitudes", icon: <UserPlus size={16}/>, count: requests.length },
    { id: "leaderboard", label: "Ranking", icon: <Trophy size={16}/>, count: null },
    { id: "search", label: "Buscar", icon: <Search size={16}/>, count: null },
  ];

  return (
    // CAMBIO: Fondo claro y amigable
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-10 relative overflow-hidden">
      
      {/* Orbes de luz suaves para el fondo claro */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-sky-100/40 blur-[130px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-100/40 blur-[110px] rounded-full" />

      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* COLUMNA 1: Perfil (Estilo Cristal Ártico) */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white/40 border border-white p-6 text-center backdrop-blur-2xl rounded-[2.5rem] shadow-lg shadow-sky-500/5">
            <div className="w-20 h-20 bg-gradient-to-tr from-sky-400 to-violet-500 rounded-[1.75rem] mx-auto mb-4 flex items-center justify-center text-3xl font-black italic text-white shadow-lg">
              {user?.username?.[0].toUpperCase()}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">{user?.username}</h2>
            <div className="mt-4 bg-sky-50 py-2 rounded-xl border border-sky-100">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Status Actual</p>
                <p className="text-2xl font-black italic text-sky-600">Nivel {user?.level || 1}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center justify-between px-6 py-4 rounded-2xl font-semibold text-sm transition-all ${
                  tab === t.id 
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30 scale-[1.03]" 
                  : "bg-white/50 text-slate-600 border border-white/50 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-100"
                }`}
              >
                <div className="flex items-center gap-3">{t.icon} {t.label}</div>
                {t.count > 0 && <span className="bg-slate-950/5 text-slate-600 px-2 py-0.5 rounded-lg text-xs font-bold">{t.count}</span>}
              </button>
            ))}
          </nav>
        </aside>

        {/* COLUMNA 2: Panel Central */}
        <main className="lg:col-span-6 bg-white/40 border border-white p-8 min-h-[600px] backdrop-blur-2xl rounded-[3rem] shadow-xl shadow-sky-500/5">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-2xl font-bold tracking-tighter text-slate-950 flex items-center gap-3">
               <span className="w-1 h-6 bg-sky-500 rounded-full"></span>
               {tabs.find(t => t.id === tab)?.label}
             </h3>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-20 text-slate-400 font-medium">Cargando la red social...</div>
            ) : (
              <>
                {tab === "friends" && (
                   friends.length === 0 
                   ? <EmptyState icon={<UserCircle size={48} />} text="No tienes amigos en la red" />
                   : friends.map(f => <FriendCard key={f._id} user={f} onProfile={() => navigate(`/profile/${f.username}`)} onRemove={() => handleRemove(f._id)} onDuel={() => handleDuelClick(f._id, f.displayName || f.username)} />)
                )}

                {tab === "requests" && (
                   requests.length === 0 
                   ? <EmptyState icon={<UserPlus size={48} />} text="Sin solicitudes pendientes" />
                   : requests.map(r => <RequestCard key={r._id} request={r} onAccept={() => handleAccept(r._id)} onReject={() => handleReject(r._id)} />)
                )}

                {tab === "leaderboard" && (
                   <div className="space-y-3">
                     {leaderboard.map((entry, i) => (
                       <LeaderboardRow key={entry.user._id} entry={entry} index={i} isMe={entry.user._id === user?._id} />
                     ))}
                   </div>
                )}

                {tab === "search" && (
                  <div className="space-y-6">
                    <div className="relative group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={20} />
                      <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                        placeholder="BUSCAR JUGADORES..."
                        className="w-full bg-white/80 border border-slate-100 rounded-[1.5rem] pl-14 pr-6 py-5 outline-none focus:border-sky-300 transition-all font-semibold text-sm tracking-tight placeholder:text-slate-400 shadow-inner"
                      />
                    </div>
                    {searching && <p className="text-center text-sky-500 font-medium text-xs">Buscando usuarios...</p>}
                    <div className="space-y-3">
                      {searchResults.map(u => <SearchResultCard key={u._id} user={u} onSendRequest={() => handleSendRequest(u.username)} onProfile={() => navigate(`/profile/${u.username}`)} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* COLUMNA 3: Mini Ranking Persistente */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-xl shadow-sky-500/5">
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Trophy size={14} className="text-yellow-500" /> Top Desafiantes
            </h3>
            <div className="space-y-5">
              {leaderboard.slice(0, 5).map((entry, i) => (
                <div key={entry.user._id} className="flex items-center gap-3">
                  <span className={`text-[10px] font-black ${i === 0 ? "text-sky-500" : "text-slate-400"}`}>0{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold truncate text-slate-900">{entry.user.username}</p>
                    <p className="text-[10px] text-sky-600 font-medium flex items-center gap-1"><Zap size={10}/> {entry.xpEarned} XP</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setTab("leaderboard")} className="w-full mt-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[9px] font-semibold uppercase tracking-widest transition-all">
              Ver todos
            </button>
          </div>
        </aside>

      </div>

      {/* MODAL DE DUELO (Estilo Suave) */}
      {duelModal && (
        <div className="fixed inset-0 bg-slate-950/30 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold uppercase mb-2 text-slate-950">DUELO CONTRA {duelModal.friendName}</h3>
            <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest mb-6">Selecciona el campo de batalla</p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {lessons.map(l => (
                <button key={l._id} onClick={() => handleSendDuelInvite(l._id)}
                  className="w-full text-left bg-slate-50 hover:bg-sky-500 border border-slate-100 hover:border-sky-400 p-4 rounded-2xl transition-all group"
                >
                  <p className="text-slate-900 font-semibold text-xs uppercase group-hover:text-white transition-colors">{l.name}</p>
                  <p className="text-[9px] text-slate-500 font-medium group-hover:text-sky-100 transition-colors uppercase tracking-tight">{l.subjectName}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setDuelModal(null)} className="w-full mt-6 py-4 text-slate-500 hover:text-slate-900 font-medium text-[10px] uppercase transition-colors">CANCELAR</button>
          </div>
        </div>
      )}
    </div>
  );
}

// SUBCOMPONENTES (Cards Suaves)
function FriendCard({ user, onProfile, onRemove, onDuel }) {
  return (
    <div className="bg-white border border-slate-100 p-4 rounded-[1.5rem] flex items-center gap-4 group hover:bg-sky-50 hover:border-sky-100 transition-all shadow-sky-500/5 shadow-sm hover:shadow-lg">
      <div onClick={onProfile} className="w-12 h-12 bg-sky-100 rounded-[1.2rem] flex items-center justify-center font-bold text-sky-700 cursor-pointer transition-all italic text-lg shadow-inner">
        {user.username[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0" onClick={onProfile}>
        <p className="text-sm font-semibold text-slate-950 truncate">{user.displayName || user.username}</p>
        <div className="flex items-center gap-2 text-[9px] font-semibold text-slate-500 uppercase tracking-tighter">
            <span>LVL {user.level}</span>
            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
            <span className="text-sky-600">{user.xp} XP TOTAL</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onDuel} className="bg-sky-500 p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-sky-500/20"><Sword size={16} className="text-white"/></button>
        <button onClick={onRemove} className="p-3 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
      </div>
    </div>
  );
}

function RequestCard({ request, onAccept, onReject }) {
  const u = request.requester;
  return (
    <div className="bg-violet-50 border border-violet-100 p-4 rounded-[1.5rem] flex items-center gap-4 animate-in fade-in slide-in-from-right-4">
      <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center font-bold italic text-violet-700 shadow-inner">{u.username[0].toUpperCase()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-950 truncate">{u.username}</p>
        <p className="text-[9px] text-violet-600 font-medium uppercase tracking-tighter">Quiere ser tu aliado</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onAccept} className="bg-emerald-500 p-2 rounded-lg hover:scale-105 transition-all"><Check size={16} className="text-white"/></button>
        <button onClick={onReject} className="bg-red-500/10 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all"><X size={16}/></button>
      </div>
    </div>
  );
}

function SearchResultCard({ user, onSendRequest, onProfile }) {
  return (
    <div className="bg-white border border-slate-100 p-4 rounded-[1.5rem] flex items-center gap-4">
      <div onClick={onProfile} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold italic text-slate-500 cursor-pointer">{user.username[0].toUpperCase()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-950 truncate">{user.username}</p>
        <p className="text-[9px] text-slate-500 font-medium uppercase">LVL {user.level}</p>
      </div>
      {user.friendStatus ? (
          <span className="text-[9px] font-semibold text-slate-500 uppercase px-3 py-1.5 bg-slate-100 rounded-lg">Aliado</span>
      ) : (
          <button onClick={onSendRequest} className="bg-sky-500 text-white font-semibold text-[9px] px-5 py-2.5 rounded-xl hover:scale-105 transition-all tracking-tight shadow-lg shadow-sky-500/20">+ Conectar</button>
      )}
    </div>
  );
}

function LeaderboardRow({ entry, index, isMe }) {
    return (
        <div className={`flex items-center gap-4 p-5 rounded-[1.5rem] border transition-all ${isMe ? 'bg-sky-500 shadow-xl shadow-sky-500/20 border-sky-400 scale-[1.02] text-white' : 'bg-white border-slate-100'}`}>
            <span className={`font-black italic text-sm w-6 ${isMe ? 'text-white' : 'text-slate-300'}`}>#{index+1}</span>
            <div className="flex-1 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${isMe ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>{entry.user.username[0].toUpperCase()}</div>
                <p className={`font-semibold text-xs ${isMe ? 'text-white' : 'text-slate-950'}`}>{entry.user.username}</p>
            </div>
            <p className={`font-medium text-xs ${isMe ? 'text-white' : 'text-sky-600'}`}>⚡ {entry.xpEarned} XP</p>
        </div>
    );
}

function EmptyState({ icon, text }) {
  return (
    <div className="text-center py-20 opacity-40 flex flex-col items-center">
      <div className="text-slate-400 mb-4">{icon}</div>
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">{text}</p>
    </div>
  );
}