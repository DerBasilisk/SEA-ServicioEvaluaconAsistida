import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { io } from "socket.io-client";
import api from "../api/axios";
import useAuthStore from "../store/authStore";

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

  // ← Agregar esto:
  socket.on("duel:start", (data) => {
  console.log("[Friends] Duel start recibido:", data);
  navigate(`/duel/${data.duelId}`);
  });

  socket.on("duel:rejected", () => {
    alert("El amigo rechazó el duelo");
  });

  return () => socket.disconnect();
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
      setFriends(f.data.data);
      setRequests(r.data.data);
      setLeaderboard(l.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    socketRef.current?.emit("duel:invite", { friendId: duelModal.friendId, lessonId });
    setDuelModal(null);
    alert("¡Invitación enviada!");
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await api.get(`/friends/search?q=${encodeURIComponent(q)}`);
      setSearchResults(data.data);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const handleSendRequest = async (username) => {
    try {
      await api.post("/friends/request", { username });
      handleSearch(searchQuery);
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  const handleAccept = async (id) => { await api.put(`/friends/request/${id}/accept`); fetchAll(); };
  const handleReject = async (id) => { await api.put(`/friends/request/${id}/reject`); fetchAll(); };
  const handleRemove = async (userId) => {
    if (!confirm("¿Eliminar amigo?")) return;
    await api.delete(`/friends/${userId}`);
    fetchAll();
  };

  const tabs = [
    { id: "friends",     label: "Amigos",      count: friends.length  },
    { id: "requests",    label: "Solicitudes",  count: requests.length },
    { id: "leaderboard", label: "Ranking",      count: null            },
    { id: "search",      label: "Buscar",       count: null            },
  ];

  return (
    <div className="min-h-screen bg-indigo-950 pb-20">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-white font-black text-3xl mb-6">👥 Amigos</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition ${
                tab === t.id ? "bg-violet-500 text-white" : "bg-indigo-800 text-indigo-300 hover:bg-indigo-700"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? "bg-violet-400" : "bg-indigo-700"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-indigo-400 py-20">Cargando...</div>
        ) : (
          <>
            {tab === "friends" && (
              <div className="space-y-3">
                {friends.length === 0
                  ? <EmptyState icon="👥" text="Todavía no tenés amigos. ¡Buscá usuarios para agregar!" />
                  : friends.map((f) => (
                    <FriendCard key={f._id} user={f}
                      onProfile={() => navigate(`/profile/${f.username}`)}
                      onRemove={() => handleRemove(f._id)}
                      onDuel={() => handleDuelClick(f._id, f.displayName || f.username)}
                    />
                  ))
                }
              </div>
            )}

            {tab === "requests" && (
              <div className="space-y-3">
                {requests.length === 0
                  ? <EmptyState icon="📬" text="No tenés solicitudes pendientes" />
                  : requests.map((r) => (
                    <RequestCard key={r._id} request={r}
                      onAccept={() => handleAccept(r._id)}
                      onReject={() => handleReject(r._id)}
                    />
                  ))
                }
              </div>
            )}

            {tab === "leaderboard" && (
              <div className="space-y-2">
                <p className="text-indigo-400 text-sm mb-4">XP ganado esta semana</p>
                {leaderboard.map((entry, i) => {
                  const isMe = entry.user._id === user?._id || entry.user.username === user?.username;
                  return (
                    <div key={entry.user._id}
                      onClick={() => !isMe && navigate(`/profile/${entry.user.username}`)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition ${
                        isMe ? "bg-violet-900 border-violet-500" : "bg-indigo-900 border-indigo-700 hover:border-indigo-500 cursor-pointer"
                      }`}
                    >
                      <span className={`text-xl font-black w-8 text-center ${
                        i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-indigo-400"
                      }`}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </span>
                      <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-black">
                        {(entry.user.displayName || entry.user.username)?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold">{entry.user.displayName || entry.user.username}</p>
                        <p className="text-indigo-400 text-xs">@{entry.user.username}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-violet-400 font-black">⚡ {entry.xpEarned}</p>
                        <p className="text-indigo-500 text-xs">XP esta semana</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "search" && (
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400">🔍</span>
                  <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Buscar por nombre o @usuario..." autoFocus
                    className="w-full bg-indigo-800 border-2 border-indigo-600 focus:border-violet-400 text-white rounded-xl pl-10 pr-4 py-3 outline-none transition placeholder-indigo-500"
                  />
                </div>
                {searching && <p className="text-indigo-400 text-sm text-center">Buscando...</p>}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((u) => (
                      <SearchResultCard key={u._id} user={u}
                        onSendRequest={() => handleSendRequest(u.username)}
                        onProfile={() => navigate(`/profile/${u.username}`)}
                      />
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                  <EmptyState icon="😕" text="No se encontraron usuarios" />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de duelo — fuera del scroll, dentro del componente Friends */}
      {duelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col">
            <h3 className="text-white font-black text-lg mb-2">⚔️ Retar a {duelModal.friendName}</h3>
            <p className="text-indigo-400 text-sm mb-4">Elegí una lección para el duelo:</p>
            <div className="overflow-y-auto space-y-2 flex-1">
              {lessons.length === 0 && (
                <p className="text-indigo-500 text-sm text-center py-4">No tenés lecciones disponibles</p>
              )}
              {lessons.map((l) => (
                <button key={l._id} onClick={() => handleSendDuelInvite(l._id)}
                  className="w-full text-left bg-indigo-800 hover:bg-indigo-700 border border-indigo-600 hover:border-violet-400 rounded-xl px-4 py-3 transition active:scale-95"
                >
                  <p className="text-white font-bold text-sm">{l.name}</p>
                  <p className="text-indigo-400 text-xs">{l.subjectName}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setDuelModal(null)}
              className="mt-4 text-indigo-400 hover:text-white text-sm transition text-center"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FriendCard({ user, onProfile, onRemove, onDuel }) {
  return (
    <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-4 flex items-center gap-4">
      <button onClick={onProfile} className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0">
        {(user.displayName || user.username)?.[0]?.toUpperCase()}
      </button>
      <div className="flex-1 min-w-0" onClick={onProfile} role="button">
        <p className="text-white font-bold truncate">{user.displayName || user.username}</p>
        <p className="text-indigo-400 text-xs">@{user.username} · Nivel {user.level}</p>
        <p className="text-violet-400 text-xs">⚡ {user.xp} XP</p>
      </div>
      <button onClick={onDuel} className="bg-violet-500 hover:bg-violet-400 text-white font-bold px-3 py-1.5 rounded-xl text-sm transition active:scale-95">
        ⚔️
      </button>
      <button onClick={onRemove} className="text-indigo-600 hover:text-red-400 text-xs transition">
        Eliminar
      </button>
    </div>
  );
}

function RequestCard({ request, onAccept, onReject }) {
  const u = request.requester;
  return (
    <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-4 flex items-center gap-4">
      <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0">
        {(u.displayName || u.username)?.[0]?.toUpperCase()}
      </div>
      <div className="flex-1">
        <p className="text-white font-bold">{u.displayName || u.username}</p>
        <p className="text-indigo-400 text-xs">@{u.username} · Nivel {u.level}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onAccept} className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-3 py-1.5 rounded-xl text-sm transition">✓</button>
        <button onClick={onReject} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 font-bold px-3 py-1.5 rounded-xl text-sm transition">✕</button>
      </div>
    </div>
  );
}

function SearchResultCard({ user, onSendRequest, onProfile }) {
  const statusLabel = {
    pending:  user.isRequester ? "Solicitud enviada" : "Te envió solicitud",
    accepted: "Ya son amigos",
  };
  return (
    <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-4 flex items-center gap-4">
      <button onClick={onProfile} className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0">
        {(user.displayName || user.username)?.[0]?.toUpperCase()}
      </button>
      <div className="flex-1 min-w-0" onClick={onProfile} role="button">
        <p className="text-white font-bold truncate">{user.displayName || user.username}</p>
        <p className="text-indigo-400 text-xs">@{user.username} · Nivel {user.level}</p>
      </div>
      {user.friendStatus ? (
        <span className="text-indigo-400 text-xs font-medium">{statusLabel[user.friendStatus]}</span>
      ) : (
        <button onClick={onSendRequest} className="bg-violet-500 hover:bg-violet-400 text-white font-bold px-3 py-1.5 rounded-xl text-sm transition active:scale-95">
          + Agregar
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="text-indigo-400">{text}</p>
    </div>
  );
}