import { useState, useEffect } from "react";
import { useActiveTheme } from "../hooks/useActiveTheme";
import { resolveBackground, resolveSvgPattern } from "../hooks/shopItem";
import { useNavigate, Link } from "react-router-dom";
import {
  Zap, Flame, Diamond, Heart, Trophy,
  Edit3, Star, Users, LogOut, ChevronRight,
  Loader2, Camera, Settings, X
} from "lucide-react";
import Navbar from "../components/Navbar";
import UsernameInput from "../components/Usernameinput";
import useAuthStore from "../store/authStore";
import api from "../api/axios";
import AvatarUpload from "../components/AvatarUpload";
import BannerUpload from "../components/BannerUpload";

/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
const PROFILE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-profile { font-family: 'Nunito', sans-serif; }

  .sea-glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 2px solid var(--glass-border);
    box-shadow: 0 20px 50px var(--glass-shadow);
  }
  .sea-stat-card {
    background: var(--card-bg);
    border: 2px solid var(--glass-border);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .sea-stat-card:hover {
    transform: translateY(-4px);
    background: var(--glass-bg);
    border-color: var(--text-accent);
  }

  /* ── Hero banner + avatar ── */
  .profile-banner {
    position: relative;
    height: 120px;
    overflow: hidden;
  }
  @media (min-width: 640px) { 
    .profile-banner { height: 150px; } 
  }

  .profile-avatar-ring {
    position: absolute;           /* ← ya no es fixed */
    bottom: 280px;                /* ← valor clave (ajusta si hace falta) */
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    padding: 4px;
    border-radius: 2rem;
  }
  @media (min-width: 640px) { 
    .profile-avatar-ring { 
      bottom: 300px;              /* un poco más porque el banner es más alto */
    } 
  }

  /* ── Edit drawer / modal ── */
  /* Móvil: bottom sheet */
  .edit-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
    z-index: 90; backdrop-filter: blur(6px);
    animation: fade-in 0.15s ease both;
  }
  @keyframes fade-in { from { opacity:0 } to { opacity:1 } }

  .edit-sheet {
    position: fixed; left: 0; right: 0; bottom: 0;
    z-index: 91;
    border-radius: 24px 24px 0 0;
    padding: 20px 20px calc(20px + env(safe-area-inset-bottom, 0px));
    max-height: 90vh; overflow-y: auto;
    animation: sheet-up 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes sheet-up {
    from { transform: translateY(100%) }
    to   { transform: none }
  }

  /* Desktop: inline panel */
  @media (min-width: 1024px) {
    .edit-overlay { display: none; }
    .edit-sheet {
      position: static;
      border-radius: 2.5rem;
      padding: 36px;
      max-height: none;
      animation: slide-right 0.25s ease both;
    }
  }
  @keyframes slide-right {
    from { opacity: 0; transform: translateX(12px) }
    to   { opacity: 1; transform: none }
  }

  /* ── Stat pill en hero ── */
  .hero-stat {
    display: flex; flex-direction: column; align-items: center;
    gap: 2px;
  }
  .hero-stat-val {
    font-size: 18px; font-weight: 900; font-style: italic;
    line-height: 1; color: var(--text-primary);
  }
  @media (min-width: 640px) { .hero-stat-val { font-size: 22px; } }
  .hero-stat-lbl {
    font-size: 8px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.15em;
    color: var(--text-secondary);
  }

  /* ── Friend row ── */
  .friend-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 12px; border-radius: 18px;
    cursor: pointer; transition: background 0.15s, border-2 0.15s;
    border: 1px solid transparent;
  }
  .friend-row:hover {
    background: rgba(255,255,255,0.5);
    border-color: rgba(255,255,255,0.8);
  }

  /* ── Achievement badge ── */
  .ach-badge {
    width: 54px; height: 54px; border-radius: 18px;
    background: rgba(255,255,255,0.55);
    border: 1px solid rgba(255,255,255,0.8);
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
    cursor: help;
  }
  @media (min-width: 640px) { .ach-badge { width: 60px; height: 60px; } }
  .ach-badge:hover { transform: scale(1.15) rotate(4deg); }
`;

const LEAGUE_CONFIG = {
  bronze:   { name: "Bronce",    icon: "🥉", color: "#cd7f32", bg: "rgba(205,127,50,0.1)"  },
  silver:   { name: "Plata",     icon: "🥈", color: "#9aa0a6", bg: "rgba(154,160,166,0.1)" },
  gold:     { name: "Oro",       icon: "🥇", color: "#e6a817", bg: "rgba(230,168,23,0.1)"  },
  sapphire: { name: "Zafiro",    icon: "💙", color: "#0f52ba", bg: "rgba(15,82,186,0.1)"   },
  emerald:  { name: "Esmeralda", icon: "💚", color: "#50c878", bg: "rgba(80,200,120,0.1)"  },
  diamond:  { name: "Diamante",  icon: "💎", color: "#60d0e4", bg: "rgba(96,208,228,0.1)"  },
  master:   { name: "Maestro",   icon: "🔮", color: "#9b59b6", bg: "rgba(155,89,182,0.1)"  },
  champion: { name: "Campeón",   icon: "👑", color: "#f1c40f", bg: "rgba(241,196,15,0.1)"  },
  heroic:   { name: "Heroico",   icon: "⚡", color: "#e74c3c", bg: "rgba(231,76,60,0.1)"   },
};

/* ─────────────────────────────────────────────
   Componente principal
───────────────────────────────────────────── */
export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, fetchMe } = useAuthStore();
  const theme   = useActiveTheme();
  const bgStyle = resolveBackground(user?.activeBackground, theme);
  const pattern = resolveSvgPattern(user?.activeBackground, theme);

  const [displayName,  setDisplayName]  = useState(user?.displayName || "");
  const [newUsername,  setNewUsername]  = useState(user?.username    || "");
  const [loading,      setLoading]      = useState({ display: false, user: false });
  const [msg,          setMsg]          = useState(null);
  const [editOpen,     setEditOpen]     = useState(false);
  const [friends,      setFriends]      = useState([]);
  const [leagueData,   setLeagueData]   = useState(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.get("/friends"), api.get("/leagues/me")])
      .then(([f, l]) => {
        setFriends(f.data.data?.slice(0, 4) || []);
        setLeagueData(l.data.data);
      })
      .catch(console.error);
  }, [user]);

  if (!user) return null;

  const handleUpdate = async (type) => {
    setLoading(p => ({ ...p, [type]: true }));
    try {
      const endpoint = type === "display" ? "/users/display-name" : "/users/username";
      const payload  = type === "display" ? { displayName } : { username: newUsername };
      await api.put(endpoint, payload);
      await fetchMe();
      setMsg({ type: "ok", text: "¡Actualizado con éxito!" });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Error" });
    } finally {
      setLoading(p => ({ ...p, [type]: false }));
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const daysLeft = (() => {
    if (!user?.usernameChangedAt) return null;
    const d = Math.ceil(30 - (Date.now() - new Date(user.usernameChangedAt)) / 86400000);
    return d > 0 ? d : null;
  })();

  const league   = LEAGUE_CONFIG[leagueData?.league || user?.league || "bronze"];
  const progress = Math.min((user.xp / 1000) * 100, 100);

  return (
    <div className="sea-profile min-h-screen pb-24 relative overflow-hidden"
      style={{ background: bgStyle || "var(--bg-gradient)" }}>
      <style>{PROFILE_CSS}</style>

      {/* Overlay SVG — solo cuando el fondo activo es de tipo patrón */}
      {pattern && (
        <div className="fixed inset-0 pointer-events-none z-0" style={pattern} />
      )}

      {/* Blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-white/25 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%]  w-[350px] h-[350px] rounded-full bg-blue-400/10 blur-[100px]" />
      </div>

      <Navbar />

      {/*
        LAYOUT:
        Móvil:   1 columna, todo apilado
        Desktop: 2 columnas [4 | 8]
      */}
      <main className="max-w-6xl mx-auto px-3 sm:px-5 pt-4 sm:pt-8 relative z-10
                        grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">

        {/* ══════════════════════════════════
            COLUMNA IZQ — Tarjeta de perfil
        ══════════════════════════════════ */}
        <aside className="lg:col-span-4 space-y-4">

          {/* ── Hero card ── */}
          <section className="sea-glass-card rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden relative">

            {/* Banner */}
            <div className="profile-banner bg-[#2B7FE8]/20 group">
              <BannerUpload currentBanner={user.banner} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity
                              flex items-center justify-center pointer-events-none">
                <Camera className="text-white" size={22} />
              </div>
            </div>

            {/* Avatar flotante sobre el banner */}
            <div className="profile-avatar-ring">
              <AvatarUpload currentAvatar={user.avatar} username={user.displayName} size="lg" frameCss={user?.activeFrame?.cssValue} />
            </div>

            {/* Info del usuario */}
            <div className="px-5 sm:px-8 pt-16 pb-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-[var(--text-primary)] uppercase leading-none">
                {user.displayName || user.username}
              </h1>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <span className="bg-[#2B7FE8] text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase">
                  AGENTE
                </span>
                <p className="text-[#2B7FE8] font-extrabold text-[10px] uppercase tracking-widest">
                  @{user.username}
                </p>
              </div>

              {/* Stats horizontales compactos */}
              <div className="flex justify-center gap-6 sm:gap-8 mt-5 pt-5
                              border-t border-[var(--glass-border)]">
                <div className="hero-stat">
                  <span className="hero-stat-val">{user.level}</span>
                  <span className="hero-stat-lbl">Nivel</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-val">{user.xp}</span>
                  <span className="hero-stat-lbl">XP</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-val">{user.streak?.current || 0}</span>
                  <span className="hero-stat-lbl">Racha</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-val">{friends.length}</span>
                  <span className="hero-stat-lbl">Aliados</span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="px-5 sm:px-8 pb-6 space-y-2.5">
              <button
                onClick={() => setEditOpen(v => !v)}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-[1.5rem]
                            font-black text-[10px] uppercase tracking-widest transition-all
                            border-2
                  ${editOpen
                    ? "bg-[var(--text-accent)]/10 text-[var(--text-accent)] border-[var(--text-accent)]"
                    : "bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--glass-border)] hover:border-[var(--text-accent)] hover:text-[var(--text-accent)]"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Settings size={14} />
                  {editOpen ? "Cerrar Ajustes" : "Configuración"}
                </div>
                <ChevronRight size={13} className={`transition-transform ${editOpen ? "rotate-90" : ""}`} />
              </button>

              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-[1.5rem]
                           border-2 border-[var(--glass-border)] text-[var(--text-secondary)]
                           font-black text-[10px] uppercase tracking-widest
                           hover:border-rose-400 hover:text-rose-500 transition-all"
              >
                <LogOut size={14} /> Cerrar Sesión
              </button>
            </div>
          </section>

          {/* ── Liga ── */}
          <section className="sea-glass-card rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7">
            <h3 className="text-[9px] font-black uppercase tracking-[0.28em] text-[var(--text-secondary)]
                           mb-4 flex items-center justify-between">
              Estatus de Competencia <Trophy size={13} />
            </h3>
            <div className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl relative overflow-hidden"
                 style={{ background: league.bg, border: `1px solid ${league.color}22` }}>
              <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                <Trophy size={55} />
              </div>
              <span className="text-4xl sm:text-5xl drop-shadow z-10">{league.icon}</span>
              <div className="z-10">
                <p className="font-black text-xl sm:text-2xl italic leading-none uppercase tracking-tighter"
                   style={{ color: league.color }}>
                  {league.name}
                </p>
                <p className="text-[9px] font-extrabold text-[var(--text-secondary)] uppercase mt-1.5">
                  Ranking:{" "}
                  <span className="text-[var(--text-primary)]">#{leagueData?.myRank || "—"}</span>
                </p>
              </div>
            </div>
          </section>

          {/* ── Logros — visible en desktop sidebar, oculto en móvil (aparece más abajo) ── */}
          <section className="sea-glass-card rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 hidden lg:block">
            <h3 className="text-[9px] font-black uppercase tracking-[0.28em] text-[var(--text-secondary)]
                           mb-5 flex items-center gap-2">
              <Star size={13} className="text-yellow-500 fill-yellow-500" /> Condecoraciones
            </h3>
            <AchievementsGrid user={user} />
          </section>
        </aside>

        {/* ══════════════════════════════════
            COLUMNA DER — Contenido dinámico
        ══════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-4">

          {/* ── Panel de edición ──
              Móvil: se renderiza como overlay+bottom-sheet cuando editOpen=true
              Desktop: se renderiza inline reemplazando el contenido de stats
          ── */}

          {/* Overlay móvil */}
          {editOpen && (
            <div className="lg:hidden">
              <div className="edit-overlay" onClick={() => setEditOpen(false)} />
              <div className="edit-sheet sea-glass-card">
                <EditPanelContent
                  displayName={displayName} setDisplayName={setDisplayName}
                  newUsername={newUsername} setNewUsername={setNewUsername}
                  loading={loading} msg={msg} daysLeft={daysLeft}
                  onSave={handleUpdate} onClose={() => setEditOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Desktop: inline */}
          {editOpen && (
            <div className="hidden lg:block edit-sheet sea-glass-card">
              <EditPanelContent
                displayName={displayName} setDisplayName={setDisplayName}
                newUsername={newUsername} setNewUsername={setNewUsername}
                loading={loading} msg={msg} daysLeft={daysLeft}
                onSave={handleUpdate} onClose={() => setEditOpen(false)}
              />
            </div>
          )}

          {/* Stats + social — siempre visible en desktop; en móvil visible cuando !editOpen */}
          {(!editOpen || true /* siempre en desktop vía css */) && (
            <div className={`space-y-4 ${editOpen ? "hidden lg:block" : ""}`}>

              {/* ── Nivel + barra de progreso ── */}
              <section className="sea-glass-card rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 relative overflow-hidden">
                <div className="flex items-end justify-between mb-5 sm:mb-7 relative z-10 gap-2">
                  <div>
                    <span className="text-[9px] sm:text-[10px] font-black text-[var(--text-accent)]
                                     uppercase tracking-[0.35em] block mb-1">
                      Experiencia de Combate
                    </span>
                    <h2 className="font-black italic text-[var(--text-primary)] leading-none
                                   uppercase tracking-tighter
                                   text-4xl sm:text-5xl lg:text-6xl">
                      NIVEL {user.level}
                    </h2>
                  </div>
                  <p className="text-xl sm:text-2xl font-black italic text-[var(--text-accent)] tracking-tight shrink-0">
                    {user.xp}
                    <span className="text-[var(--text-muted)] text-xs not-italic font-bold"> / 1000 XP</span>
                  </p>
                </div>
                <div className="h-4 sm:h-5 w-full bg-black/5 rounded-full p-0.5 border-2 border-white/20">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--text-accent)] to-[#10B981]
                               rounded-full transition-all duration-1000
                               shadow-[0_0_12px_rgba(43,127,232,0.35)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </section>

              {/* ── Grid de stats ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={<Zap    size={20} />} label="Energía"   value={user.xp}                      color="text-blue-500"   />
                <StatCard icon={<Flame  size={20} />} label="Racha"     value={`${user.streak?.current || 0}D`} color="text-orange-500" />
                <StatCard icon={<Diamond size={20} />} label="Gemas"    value={user.gems}                    color="text-cyan-500"   />
                <StatCard icon={<Heart  size={20} />} label="Vidas"     value={`${user.hearts?.current ?? 5}/5`} color="text-rose-500" />
              </div>

              {/* ── Social + Logros en móvil ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Amigos */}
                <section className="sea-glass-card rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.25em]
                                   flex items-center gap-2 text-[var(--text-primary)]">
                      <Users size={14} className="text-[#2B7FE8]" /> Aliados
                    </h3>
                    <Link to="/friends"
                      className="text-[9px] font-black text-[#2B7FE8] hover:bg-[#2B7FE8]/10
                                 px-2.5 py-1 rounded-full transition-all uppercase">
                      Ver todos
                    </Link>
                  </div>
                  <div className="space-y-1">
                    {friends.length === 0 && (
                      <p className="text-[10px] font-bold text-[var(--text-secondary)] text-center py-6 uppercase">
                        Sin aliados aún
                      </p>
                    )}
                    {friends.map(f => (
                      <div key={f._id} className="friend-row"
                           onClick={() => navigate(`/profile/${f.username}`)}>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2B7FE8] to-[#5B9FFF]
                                        flex items-center justify-center text-white font-black italic
                                        text-sm shadow-md shrink-0">
                          {(f.displayName || f.username)[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-[11px] uppercase italic truncate text-[var(--text-primary)]">
                            {f.displayName || f.username}
                          </p>
                          <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase">
                            Nivel {f.level}
                          </p>
                        </div>
                        <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0" />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Logros — visible en móvil/tablet (en desktop está en el sidebar) */}
                <section className="sea-glass-card rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 lg:hidden">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.25em]
                                 flex items-center gap-2 text-[var(--text-primary)] mb-4">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" /> Condecoraciones
                  </h3>
                  <AchievementsGrid user={user} />
                </section>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Edit panel — extraído como componente
   (se usa en mobile bottom sheet Y en desktop inline)
───────────────────────────────────────────── */
function EditPanelContent({
  displayName, setDisplayName,
  newUsername, setNewUsername,
  loading, msg, daysLeft,
  onSave, onClose,
}) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-7 bg-[#2B7FE8] rounded-full" />
          <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter">
            Ajustes del Sistema
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {msg && (
            <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider
              ${msg.type === "ok" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
              {msg.text}
            </span>
          )}
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[var(--card-bg)] border-2 border-[var(--glass-border)]
                       flex items-center justify-center hover:border-rose-300 hover:text-rose-400 transition-all">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Campos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Display name */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest block">
            Nombre de Operativo
          </label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full bg-[var(--card-bg)] border-2 border-[var(--glass-border)]
                       rounded-2xl px-4 py-3.5 text-sm font-bold text-[var(--text-primary)]
                       focus:border-[var(--text-accent)] outline-none transition-all"
          />
          <button
            onClick={() => onSave("display")}
            disabled={loading.display || displayName === ""}
            className="w-full py-3 rounded-xl bg-[var(--text-accent)] text-[var(--btn-text)]
                       text-[10px] font-black uppercase tracking-widest disabled:opacity-30
                       transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            {loading.display
              ? <Loader2 size={14} className="animate-spin" />
              : "Guardar Nombre"}
          </button>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest block">
            ID de Usuario{" "}
            {daysLeft && (
              <span className="text-rose-500 normal-case">
                (cooldown: {daysLeft}d)
              </span>
            )}
          </label>
          <UsernameInput value={newUsername} onChange={setNewUsername} disabled={!!daysLeft} />
          <button
            onClick={() => onSave("user")}
            disabled={loading.user || !!daysLeft}
            className="w-full py-3 rounded-xl bg-[var(--text-accent)] text-[var(--btn-text)]
                       text-[10px] font-black uppercase tracking-widest disabled:opacity-30
                       transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            {loading.user
              ? <Loader2 size={14} className="animate-spin" />
              : "Guardar Username"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Achievements grid — reutilizable
───────────────────────────────────────────── */
function AchievementsGrid({ user }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {user.achievements?.map(ach => (
        <div key={ach.key} title={ach.name} className="ach-badge relative">
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#2B7FE8] rounded-full
                          border-2 border-white flex items-center justify-center" />
          {ach.icon}
        </div>
      ))}
      {/* Slot vacío decorativo */}
      <div className="ach-badge opacity-30 border-dashed !border-[var(--text-muted)]">
        <Star size={18} className="text-[var(--text-muted)]" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   StatCard
───────────────────────────────────────────── */
function StatCard({ icon, label, value, color }) {
  return (
    <div className="sea-stat-card p-4 sm:p-5 rounded-[1.8rem] sm:rounded-[2.5rem]
                    flex flex-col items-center justify-center shadow-sm relative overflow-hidden group">
      <div className={`${color} mb-2 group-hover:scale-110 transition-transform duration-400`}>{icon}</div>
      <span className="text-xl sm:text-2xl font-black text-[var(--text-primary)] italic tracking-tighter">
        {value}
      </span>
      <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase
                       tracking-[0.18em] mt-1 text-center leading-tight">
        {label}
      </span>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r
                      from-transparent via-[#2B7FE8]/25 to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}