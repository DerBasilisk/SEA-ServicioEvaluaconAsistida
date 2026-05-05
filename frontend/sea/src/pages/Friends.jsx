import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { io } from "socket.io-client";
import api from "../api/axios";
import useAuthStore from "../store/authStore";
import {
  Users, UserPlus, Trophy, Search, Sword,
  Check, X, Trash2, Zap, UserCircle, Star, MessageCircle
} from "lucide-react";
import Avatar from "../components/Avatar";
import toast from "react-hot-toast";
import { getDuelSocket } from "../api/duelSocket";

const FRIENDS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-friends { font-family: 'Nunito', sans-serif; }

  .sea-glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 2px solid var(--glass-border);
    box-shadow: 0 20px 50px var(--glass-shadow);
  }

  .sea-tab-active {
    background: var(--text-accent);
    color: var(--btn-text) !important;
    box-shadow: 0 8px 20px var(--glass-shadow);
  }

  .sea-item-card {
    background: var(--card-bg);
    border: 2px solid var(--glass-border);
    transition: all 0.2s ease;
  }
  .sea-item-card:hover {
    transform: translateY(-2px);
    background: var(--glass-bg);
    border-color: var(--text-accent);
  }

  /* ── Tabs móvil: scroll horizontal ── */
  .mobile-tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 2px;
  }
  .mobile-tabs::-webkit-scrollbar { display: none; }
  .mobile-tab {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 14px; border-radius: 99px;
    font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.1em;
    white-space: nowrap; flex-shrink: 0;
    border: 2px solid var(--glass-border);
    background: var(--card-bg);
    color: var(--text-secondary);
    transition: all 0.2s;
    cursor: pointer;
  }
  .mobile-tab.active {
    background: var(--text-accent);
    color: var(--btn-text);
    border-color: transparent;
    box-shadow: 0 4px 14px var(--glass-shadow);
  }
  .mobile-tab .tab-badge {
    background: rgba(255,255,255,0.25);
    border-radius: 99px;
    padding: 1px 7px;
    font-size: 9px; font-weight: 900;
  }
  .mobile-tab:not(.active) .tab-badge {
    background: var(--text-accent);
    color: var(--btn-text);
  }

  /* ── Sidebar desktop nav ── */
  .desktop-tab {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; border-radius: 1.5rem;
    font-size: 11px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.12em;
    border: 2px solid var(--glass-border);
    background: var(--card-bg);
    color: var(--text-secondary);
    transition: all 0.2s; cursor: pointer;
  }
  .desktop-tab.active {
    background: var(--text-accent);
    color: var(--btn-text);
    border-color: transparent;
    transform: scale(1.03);
  }
  .desktop-tab:not(.active):hover { color: var(--text-accent); }

  /* ── Leaderboard sidebar en desktop ── */
  .lb-side-entry { display: flex; align-items: center; gap: 12px; }

  /* ── Modal ── */
  .duel-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.55);
    z-index: 100; display: flex; align-items: center; justify-content: center;
    padding: 16px; backdrop-filter: blur(8px);
    animation: fade-in 0.15s ease both;
  }
  @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
  .duel-modal {
    width: 100%; max-width: 440px;
    animation: pop-in 0.2s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes pop-in {
    from { opacity: 0; transform: scale(0.94) translateY(12px); }
    to   { opacity: 1; transform: none; }
  }

  .lesson-btn {
    width: 100%; text-align: left;
    background: var(--card-bg); border: 2px solid var(--glass-border);
    padding: 12px 16px; border-radius: 16px;
    transition: all 0.15s; cursor: pointer;
  }
  .lesson-btn:hover {
    background: var(--text-accent);
    border-color: transparent;
  }
  .lesson-btn:hover .lesson-name  { color: var(--btn-text); }
  .lesson-btn:hover .lesson-sub   { color: var(--btn-text); opacity: 0.7; }

  .lesson-list::-webkit-scrollbar { width: 4px; }
  .lesson-list::-webkit-scrollbar-thumb { background: var(--text-muted); border-radius: 99px; }
`;

/* ────────────────────────────────────────────── */

export default function Friends() {
  const { user, token } = useAuthStore();
  const navigate        = useNavigate();
  const socketRef       = useRef(null);

  const [tab,           setTab]           = useState("friends");
  const [friends,       setFriends]       = useState([]);
  const [requests,      setRequests]      = useState([]);
  const [leaderboard,   setLeaderboard]   = useState([]);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching,     setSearching]     = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [duelModal,     setDuelModal]     = useState(null);
  const [lessons,       setLessons]       = useState([]);

  /* Socket */
  useEffect(() => {
    const socket = getDuelSocket(token);
    socketRef.current = socket;

    socket.on("duel:rejected", () =>
      toast.error("El oponente ha declinado el desafío", { icon: "🛡️" })
    );

    return () => {
      socket.off("duel:rejected");
      // NO desconectar
    };
  }, [token]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [f, r, l] = await Promise.all([
        api.get("/friends"),
        api.get("/friends/requests"),
        api.get("/friends/leaderboard"),
      ]);
      setFriends(f.data.data     || []);
      setRequests(r.data.data    || []);
      setLeaderboard(l.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDuelClick = (friendId, friendName) => {
    setDuelModal({ friendId, friendName, step: "selectSubject", subjects: [], units: [], selectedSubject: null, loading: true });
    api.get("/subjects")
      .then(({ data }) => setDuelModal(m => ({ ...m, subjects: data.data || [], loading: false })))
      .catch(() => { toast.error("Error cargando materias"); setDuelModal(null); });
  };

  const handleSelectSubject = (subject) => {
    setDuelModal(m => ({ ...m, step: "selectUnit", selectedSubject: subject, units: [], loading: true }));
    api.get(`/subjects/${subject.slug}`)
      .then(({ data }) => {
        const available = (data.data.units || []).filter(u => u.lessons?.some(l => l.status !== "locked"));
        setDuelModal(m => ({ ...m, units: available, loading: false }));
      })
      .catch(() => { toast.error("Error cargando unidades"); setDuelModal(m => ({ ...m, step: "selectSubject", loading: false })); });
  };

  const handleSelectUnit = (unit) => {
    if (!socketRef.current || !duelModal) return;
    const available = unit.lessons?.filter(l => l.status !== "locked") || [];
    if (available.length === 0) { toast.error("Sin lecciones disponibles"); return; }
    const randomLesson = available[Math.floor(Math.random() * available.length)];
    socketRef.current.emit("duel:invite", {
      friendId: duelModal.friendId,
      lessonId: randomLesson._id,
      isDuelMode: true,
    });
    toast.success(`¡Desafío enviado a ${duelModal.friendName}!`, { icon: "⚔️", duration: 4000 });
    setDuelModal(null);
  };

  const handleSendDuelInvite = (lessonId) => {
    if (!socketRef.current || !duelModal) return;
    socketRef.current.emit("duel:invite", { friendId: duelModal.friendId, lessonId });
    toast.success(`Desafío enviado a ${duelModal.friendName}`, {
      icon: "⚔️", duration: 4000,
      style: {
        background: "#0F2547", color: "#fff", borderRadius: "1.5rem",
        fontSize: "12px", fontWeight: "900", textTransform: "uppercase",
        letterSpacing: "0.1em", border: "2px solid #2B7FE8",
      },
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
    { id: "friends",      label: "Amigos",     icon: <Users    size={15} />, count: friends.length  },
    { id: "requests",     label: "Solicitudes", icon: <UserPlus size={15} />, count: requests.length },
    { id: "leaderboard",  label: "Ranking",    icon: <Trophy   size={15} />, count: null            },
    { id: "chat",         label: "Chat",       to: "/chat",       icon: <MessageCircle  size={15} />, count: null            },
    { id: "search",       label: "Buscar",     icon: <Search   size={15} />, count: null            },
  ];

  const activeTab = tabs.find(t => t.id === tab);
  

  return (
    <div className="sea-friends min-h-screen pb-24 relative overflow-hidden"
         style={{ background: "var(--bg-gradient)" }}>
      <style>{FRIENDS_CSS}</style>

      {/* Blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-white/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] rounded-full bg-blue-400/10 blur-[100px]" />
      </div>

      <Navbar />

      <div className="max-w-6xl mx-auto px-3 sm:px-5 pt-4 sm:pt-8 relative z-10">

        {/* ════════ MOBILE LAYOUT (< lg) ════════ */}
        <div className="lg:hidden space-y-4">

          {/* Tabs pill-scroll */}
          <div className="mobile-tabs px-1">
            {tabs.map(t => (
              <button key={t.id} className={`mobile-tab${tab === t.id ? " active" : ""}`}
                      onClick={() => t.to ? navigate(t.to) : setTab(t.id)}>
                {t.icon}
                {t.label}
                {t.count > 0 && <span className="tab-badge">{t.count}</span>}
              </button>
            ))}
          </div>

          {/* Panel de contenido */}
          <div className="sea-glass-card rounded-[2rem] p-4 sm:p-6 min-h-[50vh]">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-1 h-6 bg-[#2B7FE8] rounded-full" />
              <h3 className="text-xl font-black italic tracking-tighter text-[var(--text-primary)] uppercase">
                {activeTab?.label}
              </h3>
            </div>
            <TabContent
              tab={tab} loading={loading}
              friends={friends} requests={requests} leaderboard={leaderboard}
              searchQuery={searchQuery} searchResults={searchResults} searching={searching}
              user={user} navigate={navigate}
              onSearch={handleSearch} onSendRequest={handleSendRequest}
              onAccept={handleAccept} onReject={handleReject}
              onRemove={handleRemove} onDuel={handleDuelClick}
            />
          </div>
        </div>

        {/* ════════ DESKTOP LAYOUT (≥ lg) ════════ */}
        <div className="hidden lg:grid grid-cols-12 gap-6">

          {/* Sidebar izquierdo: perfil + nav */}
          <aside className="col-span-3 space-y-5">
            <div className="sea-glass-card rounded-[2.5rem] p-6 text-center">
              <Avatar
                src={user?.avatar}
                name={user?.displayName || user?.username}
                size="xl"
                className="rounded-[1.8rem] border-4 border-white shadow-xl mx-auto mb-3"
              />
              <h2 className="text-xl font-black tracking-tighter text-[var(--text-primary)] uppercase italic">
                {user?.username}
              </h2>
              <div className="mt-3 bg-[var(--card-bg)] py-2 px-4 rounded-2xl border-2 border-[var(--glass-border)]">
                <p className="text-[8px] font-extrabold text-[var(--text-accent)] uppercase tracking-[0.2em]">Rango Actual</p>
                <p className="text-lg font-black italic text-[var(--text-primary)]">NIVEL {user?.level || 1}</p>
              </div>
            </div>

            <nav className="flex flex-col gap-2">
              {tabs.map(t => (
                <button key={t.id} onClick={() => t.to ? navigate(t.to) : setTab(t.id)}
                  className={`desktop-tab${tab === t.id ? " active" : ""}`}>
                  <div className="flex items-center gap-3">{t.icon} {t.label}</div>
                  {t.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black
                      ${tab === t.id ? "bg-white/20 text-white" : "bg-[#2B7FE8]/10 text-[#2B7FE8]"}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Panel central */}
          <main className="col-span-6 sea-glass-card rounded-[3rem] p-8 min-h-[600px]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-7 bg-[#2B7FE8] rounded-full shadow-[0_0_12px_rgba(43,127,232,0.5)]" />
              <h3 className="text-2xl font-black italic tracking-tighter text-[var(--text-primary)] uppercase">
                {activeTab?.label}
              </h3>
            </div>
            <TabContent
              tab={tab} loading={loading}
              friends={friends} requests={requests} leaderboard={leaderboard}
              searchQuery={searchQuery} searchResults={searchResults} searching={searching}
              user={user} navigate={navigate}
              onSearch={handleSearch} onSendRequest={handleSendRequest}
              onAccept={handleAccept} onReject={handleReject}
              onRemove={handleRemove} onDuel={handleDuelClick}
            />
          </main>

          {/* Sidebar derecho: top ranking */}
          <aside className="col-span-3 space-y-5">
            <div className="sea-glass-card rounded-[2.5rem] p-6">
              <h3 className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.28em] mb-6 flex items-center gap-2">
                <Star size={14} className="text-yellow-500 fill-yellow-500" /> Top Mundial
              </h3>
              <div className="space-y-4">
                {leaderboard.slice(0, 5).map((entry, i) => (
                  <div key={entry.user._id} className="lb-side-entry">
                    <span className={`text-[11px] font-black italic w-5 shrink-0 ${i === 0 ? "text-[#2B7FE8]" : "text-[var(--text-muted)]"}`}>
                      0{i + 1}
                    </span>
                    <Avatar src={entry.user.avatar} name={entry.user.displayName} size="xs"
                            className="rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-extrabold truncate text-[var(--text-primary)] uppercase">
                        {entry.user.displayName}
                      </p>
                      <p className="text-[9px] text-[#5B9FFF] font-bold flex items-center gap-1">
                        <Zap size={9} fill="#5B9FFF" /> {entry.xpEarned} XP
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 bg-[var(--glass-bg)] hover:bg-[var(--text-accent)]
                                 text-[var(--text-accent)] hover:text-[var(--btn-text)]
                                 rounded-2xl text-[9px] font-black uppercase tracking-[0.18em] transition-all">
                Ver Salón de la Fama
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* ════════ MODAL DE DUELO ════════ */}
      {duelModal && (
        <div className="duel-modal-overlay" onClick={() => setDuelModal(null)}>
          <div className="duel-modal" onClick={e => e.stopPropagation()}>
            <div className="sea-glass-card rounded-[2.5rem] p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-black italic text-[var(--text-primary)] uppercase mb-1">
                Duelo de Habilidades
              </h3>
              <p className="text-[var(--text-secondary)] text-[10px] font-extrabold uppercase tracking-widest mb-6">
                VS {duelModal.friendName}
              </p>

              <div className="lesson-list space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {lessons.map(l => (
                  <button key={l._id} className="lesson-btn" onClick={() => handleSendDuelInvite(l._id)}>
                    <p className="lesson-name font-black text-sm text-[var(--text-primary)]">{l.name}</p>
                    <p className="lesson-sub text-[9px] text-[var(--text-muted)] font-extrabold uppercase mt-0.5">
                      {l.subjectName}
                    </p>
                  </button>
                ))}
              </div>

              <button onClick={() => setDuelModal(null)}
                className="w-full mt-5 py-3 text-[var(--text-muted)] hover:text-rose-500
                           font-black text-[10px] uppercase tracking-widest transition-colors">
                Abortar Misión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── TabContent: renderizado compartido entre móvil y desktop ── */
function TabContent({ tab, loading, friends, requests, leaderboard, searchQuery, searchResults,
  searching, user, navigate, onSearch, onSendRequest, onAccept, onReject, onRemove, onDuel }) {

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-[#2B7FE8]/20 border-t-[#2B7FE8] rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-[#7A9CC5]">Sincronizando red…</p>
    </div>
  );

  if (tab === "friends") return friends.length === 0
    ? <EmptyState icon={<UserCircle size={48} />} text="Tu lista de aliados está vacía" />
    : <div className="space-y-3">{friends.map(f => (
        <FriendItem key={f._id} user={f}
          onProfile={() => navigate(`/profile/${f.username}`)}
          onRemove={() => onRemove(f._id)}
          onDuel={() => onDuel(f._id, f.displayName || f.username)} />
      ))}</div>;

  if (tab === "requests") return requests.length === 0
    ? <EmptyState icon={<UserPlus size={48} />} text="No hay solicitudes por ahora" />
    : <div className="space-y-3">{requests.map(r => (
        <RequestItem key={r._id} request={r}
          onAccept={() => onAccept(r._id)}
          onReject={() => onReject(r._id)} />
      ))}</div>;

  if (tab === "leaderboard") return (
    <div className="space-y-2.5">
      {leaderboard.map((entry, i) => (
        <LeaderboardItem key={entry.user._id} entry={entry} index={i}
                         isMe={entry.user._id === user?._id} />
      ))}
    </div>
  );

  if (tab === "search") return (
    <div className="space-y-5">
      <div className="relative group">
        <Search size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]
                     group-focus-within:text-[var(--text-accent)] transition-colors" />
        <input
          type="text" value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          placeholder="BUSCAR JUGADORES…"
          className="w-full bg-[var(--card-bg)] border-2 border-[var(--glass-border)]
                     rounded-[1.8rem] pl-12 pr-5 py-4 outline-none
                     focus:border-[var(--text-accent)] transition-all
                     font-bold text-sm text-[var(--text-primary)]
                     placeholder:text-[var(--text-muted)]"
        />
      </div>
      {searching && (
        <p className="text-center text-[#2B7FE8] font-black text-[10px] uppercase tracking-widest animate-pulse">
          Buscando en la base de datos…
        </p>
      )}
      <div className="space-y-2.5">
        {searchResults.map(u => (
          <SearchItem key={u._id} user={u}
            onSendRequest={() => onSendRequest(u.username)}
            onProfile={() => navigate(`/profile/${u.username}`)} />
        ))}
      </div>
    </div>
  );

  return null;
}

/* ── Subcomponentes ── */

function FriendItem({ user, onProfile, onRemove, onDuel }) {
  return (
    <div className="sea-item-card rounded-[1.5rem] sm:rounded-[2rem] flex items-center gap-3 sm:gap-4
                    p-3 sm:p-4 group shadow-sm">
      <div onClick={onProfile} className="cursor-pointer shrink-0 group-hover:scale-105 transition-transform">
        <Avatar src={user.avatar} name={user.displayName || user.username}
                size="sm" className="rounded-xl border-2 border-white shadow-sm" />
      </div>
      <div className="flex-1 min-w-0" onClick={onProfile} style={{ cursor: "pointer" }}>
        <p className="text-sm font-black text-[var(--text-primary)] truncate uppercase italic leading-tight">
          {user.displayName || user.username}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[9px] font-black text-[#2B7FE8] bg-blue-50 px-2 py-0.5 rounded-md">
            LVL {user.level}
          </span>
          <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">
            {user.xp} XP
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={onDuel}
          className="bg-[#2B7FE8] p-2.5 sm:p-3 rounded-xl hover:scale-110 active:scale-90
                     transition-all shadow-md shadow-blue-500/25">
          <Sword size={15} className="text-white" />
        </button>
        <button onClick={onRemove}
          className="p-2.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50
                     rounded-xl transition-all">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function RequestItem({ request, onAccept, onReject }) {
  const u = request.requester;
  return (
    <div className="bg-[var(--card-bg)] border-2 border-[var(--glass-border)]
                    rounded-[1.5rem] sm:rounded-[2rem] flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
      <Avatar src={u.avatar} name={u.displayName || u.username}
              size="sm" className="rounded-xl border-2 border-white shadow-inner shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-[var(--text-primary)] uppercase italic truncate">
          {u.displayName || u.username}
        </p>
        <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-tight">Solicitud de Alianza</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button onClick={onAccept}
          className="bg-[#10B981] p-2.5 rounded-xl hover:scale-110 transition-all
                     shadow-md shadow-emerald-500/20 text-white">
          <Check size={15} />
        </button>
        <button onClick={onReject}
          className="border-2 border-rose-100 text-rose-500 p-2.5 rounded-xl
                     hover:bg-rose-500 hover:text-white transition-all">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

function LeaderboardItem({ entry, index, isMe }) {
  return (
    <div className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem]
                     border-2 transition-all
      ${isMe
        ? "bg-[var(--text-accent)] border-transparent scale-[1.02] shadow-lg"
        : "bg-[var(--card-bg)] border-[var(--glass-border)] hover:border-[var(--text-accent)]"
      }`}>
      <span className={`font-black italic text-base w-7 shrink-0
        ${isMe ? "text-[var(--btn-text)]" : "text-[var(--text-muted)]"}`}>
        #{index + 1}
      </span>
      <Avatar src={entry.user.avatar} name={entry.user.displayName}
              size="sm" className="rounded-xl shrink-0" />
      <p className={`flex-1 font-black text-sm uppercase italic truncate
        ${isMe ? "text-[var(--btn-text)]" : "text-[var(--text-primary)]"}`}>
        {entry.user.displayName}{isMe && <span className="opacity-70 font-bold not-italic text-[10px] ml-1">(Tú)</span>}
      </p>
      <div className={`flex items-center gap-1 font-black text-sm shrink-0
        ${isMe ? "text-[var(--btn-text)]" : "text-[var(--text-accent)]"}`}>
        <Zap size={13} fill="currentColor" />
        {entry.xpEarned}
      </div>
    </div>
  );
}

function SearchItem({ user, onSendRequest, onProfile }) {
  return (
    <div className="sea-item-card rounded-[1.5rem] sm:rounded-[2rem] flex items-center gap-3 p-3 sm:p-4">
      <div onClick={onProfile} className="cursor-pointer shrink-0">
        <Avatar src={user.avatar} name={user.displayName || user.username}
                size="sm" className="rounded-xl border-2 border-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-[var(--text-primary)] uppercase italic truncate">
          {user.displayName || user.username}
        </p>
        <p className="text-[9px] text-[#7A9CC5] font-bold uppercase">Nivel {user.level || 1}</p>
      </div>
      {user.friendStatus ? (
        <span className="text-[9px] font-black text-[var(--text-muted)] uppercase
                         px-3 py-1.5 bg-[var(--glass-bg)] rounded-xl border-2 border-[var(--glass-border)] shrink-0">
          Aliado
        </span>
      ) : (
        <button onClick={onSendRequest}
          className="bg-[#2B7FE8] text-white font-black text-[9px] px-4 py-2 rounded-xl
                     hover:scale-105 active:scale-95 transition-all uppercase tracking-wider
                     shadow-md shadow-blue-500/20 shrink-0">
          + Conectar
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 opacity-30">
      <div className="text-[#2B7FE8] mb-4 animate-bounce">{icon}</div>
      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--text-primary)]
                    text-center max-w-[200px] leading-relaxed">
        {text}
      </p>
    </div>
  );
}