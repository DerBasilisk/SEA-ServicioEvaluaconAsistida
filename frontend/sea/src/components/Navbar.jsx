// src/components/Navbar.jsx
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  User, Settings, LogOut, Heart, Zap, Trophy,
  Users, Eye, Sun, Moon, Home, BarChart2, X, ShoppingCart
} from "lucide-react";
import useAuthStore from "../store/authStore";
import useThemeStore from "../store/themeStore";
import api from "../api/axios";

/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
const NAV_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  .nb { font-family: 'Nunito', sans-serif; }
  .nb * { box-sizing: border-box; }

  .nb-glass {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  /* ═══════ DESKTOP TOP NAV ═══════ */
  .nb-top {
    position: fixed;
    top: 12px; left: 50%; transform: translateX(-50%);
    width: min(92%, 1180px);
    height: 65px;
    z-index: 200;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 14px;
    border: 2px solid var(--glass-border);
    border-radius: 18px;
    box-shadow: 0 4px 28px var(--glass-shadow);
  }

  /* Nav links */
  .nb-navlink {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 10px; border-radius: 11px; text-decoration: none;
    transition: background 0.15s ease;
    white-space: nowrap;
  }
  .nb-navlink:hover { background: var(--progress-track); }
  .nb-navlink .lbl {
    font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--text-primary);
  }
  .nb-sep { width: 1px; height: 20px; background: var(--glass-border); margin: 0 4px; }

  /* Stats group */
  .nb-stats-group {
    display: flex; align-items: center; gap: 2px;
    padding: 4px 5px;
    background: var(--progress-track);
    border: 2px solid var(--glass-border);
    border-radius: 14px;
  }

  .nb-chip {
    display: flex; align-items: center; gap: 4px;
    padding: 1px 10px; border-radius: 10px;
    cursor: default; user-select: none; white-space: nowrap;
    transition: background 0.15s ease, transform 0.15s ease;
    border: 2px solid transparent;
  }
  .nb-chip.clickable { cursor: pointer; }
  .nb-chip.clickable:hover {
    background: var(--card-bg);
    border-color: var(--glass-border);
    transform: translateY(-1px);
  }
  .nb-chip.hearts-empty { border-color: color-mix(in srgb, #ef4444 30%, transparent); }

  .nb-stat-val {
    font-weight: 900; font-size: 11px; font-style: italic;
    color: var(--text-primary);
  }

  /* Separator between chips */
  .nb-chip-sep {
    width: 2px; height: 14px; border-radius: 1px;
    background: var(--glass-border);
    margin: 0 1px;
    flex-shrink: 0;
  }

  /* Hide XP label on smaller screens */
  @media (max-width: 1023px) {
    .nb-chip .xp-lbl { display: none; }
    .nb-navlink .lbl { display: none; }
  }

  /* Icon buttons */
  .nb-icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 42px; height: 42px; border-radius: 11px;
    border: 2px solid var(--glass-border);
    background: var(--progress-track);
    cursor: pointer; flex-shrink: 0;
    transition: all 0.15s ease;
  }
  .nb-icon-btn:hover {
    background: var(--card-bg);
    border-color: color-mix(in srgb, var(--text-accent) 40%, transparent);
    transform: translateY(-1px);
  }

  /* Avatar button */
  .nb-avatar-btn {
    width: 42px; height: 42px; border-radius: 11px; overflow: hidden;
    border: 2px solid var(--glass-border);
    background: linear-gradient(135deg, #2B7FE8, #5B9FFF);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s ease;
  }
  .nb-avatar-btn:hover {
    border-color: var(--text-accent);
    transform: scale(1.06);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent) 20%, transparent);
  }

  /* ═══════ DROPDOWN PANELS ═══════ */
  .nb-panel {
    background: var(--card-bg);
    border: 2px solid var(--card-border);
    border-radius: 16px;
    box-shadow: 0 12px 40px var(--glass-shadow);
    animation: nb-drop 0.16s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  @keyframes nb-drop {
    from { opacity: 0; transform: translateY(-8px) scale(0.96); }
    to   { opacity: 1; transform: none; }
  }

  .nb-panel-header {
    padding: 13px 15px;
    background: var(--progress-track);
    border-bottom: 1.5px solid var(--card-border);
    border-radius: 16px 16px 0 0;
  }
  .nb-panel-body { padding: 5px; }

  .nb-menu-item {
    display: flex; align-items: center; gap: 9px;
    width: 100%; padding: 9px 11px; border-radius: 10px;
    border: none; background: transparent; text-decoration: none;
    color: var(--text-primary); font-weight: 700; font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.11em; cursor: pointer;
    transition: background 0.12s ease, color 0.12s ease;
  }
  .nb-menu-item:hover { background: var(--progress-track); color: #2B7FE8; }
  .nb-menu-item.danger:hover { background: color-mix(in srgb, #ef4444 8%, transparent); color: #ef4444; }

  .nb-hearts-row { display: flex; justify-content: center; gap: 5px; margin-bottom: 10px; }
  .nb-refill-btn {
    width: 100%; padding: 9px 12px;
    background: var(--text-accent, #2B7FE8); color: #fff;
    border: none; border-radius: 11px; font-weight: 900; font-size: 10px;
    text-transform: uppercase; letter-spacing: 0.16em; cursor: pointer;
    transition: opacity 0.15s ease, filter 0.15s ease;
  }
  .nb-refill-btn:hover:not(:disabled) { filter: brightness(1.1); }
  .nb-refill-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  /* ═══════ MOBILE BOTTOM NAV ═══════ */
  .nb-bottom {
    position: fixed; 
    bottom: 0; 
    left: 0; 
    right: 0; 
    z-index: 200;
    border-top: 2px solid var(--glass-border);
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -4px 28px var(--glass-shadow);
  }
  .nb-tabs {
    display: flex; justify-content: space-around; align-items: center;
    padding: 6px 8px calc(8px + env(safe-area-inset-bottom, 0px));
    position: relative;
  }

  .nb-tab {
    display: flex; 
    flex-direction: column; 
    align-items: center;
    gap: 2px; 
    margin: 4px;
    padding: 7px 10px; 
    border-radius: 14px;
    text-decoration: none; 
    position: relative;
    border: none; 
    background: transparent; 
    cursor: pointer;
    min-width: 54px; 
    min-height: 50px; 
    justify-content: center;
    transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .nb-tab:active { transform: scale(0.93); }

  .nb-tab .t-icon {
    color: var(--text-muted);
    transition: color 0.15s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .nb-tab .t-label {
    font-size: 9px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--text-muted);
    transition: color 0.15s ease;
    line-height: 1;
  }

  /* Active pill */
  .nb-tab.active .t-icon  { color: var(--text-accent); transform: translateY(-2px) scale(1.12); }
  .nb-tab.active .t-label { color: var(--text-accent); }
  .nb-tab.active::before {
    content: '';
    position: absolute;
    top: 48%; left: 50%;
    transform: translate(-50%, -50%);
    width: 50px; height: 50px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--text-accent) 12%, transparent);
    z-index: -1;
  }

  /* ─── Stats slide-up panel ─── */
  .nb-stats-panel {
    position: fixed; left: 8px; right: 8px;
    margin-bottom: 14px;
    z-index: 199;
    border-radius: 20px;
    border: 2px solid var(--card-border);
    padding: 6px 12px 14px;
    box-shadow: 0 -8px 40px var(--glass-shadow);
    animation: nb-slide-up 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  @keyframes nb-slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: none; }
  }

  .nb-stats-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 7px;
    margin: 10px 0;
  }
  .nb-stat-card {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    background: var(--progress-track);
    border: 2px solid var(--glass-border);
    border-radius: 14px;
  }

  .nb-actions-row { display: flex; gap: 7px; align-items: center; }
  .nb-action-btn {
    display: flex; align-items: center; justify-content: center;
    gap: 5px; flex: 1; padding: 9px 12px;
    background: var(--progress-track);
    border: 2px solid var(--glass-border);
    border-radius: 13px; cursor: pointer; font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.11em;
    color: var(--text-primary); text-decoration: none;
    transition: background 0.14s ease, border-color 0.14s ease;
  }
  .nb-action-btn:hover {
    background: var(--card-bg);
    border-color: color-mix(in srgb, var(--text-accent) 40%, transparent);
  }

  /* Overlay */
  .nb-overlay {
    position: fixed; inset: 0; z-index: 198;
    background: rgba(0, 0, 0, 0.28);
    animation: nb-fade 0.15s ease both;
  }
  @keyframes nb-fade {
    from { opacity: 0; } to { opacity: 1; }
  }

  /* Drag handle */
  .nb-drag-handle {
    width: 34px; height: 4px; border-radius: 99px;
    background: var(--glass-border); margin: 0 auto 4px;
  }
`;

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function useOutsideClick(ref, handler) {
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [ref, handler]);
}

function ThemeIcon({ theme, size = 25 }) {
  if (theme === "dark")          return <Moon  size={size} className="text-indigo-400" />;
  if (theme === "high-contrast") return <Eye   size={size} className="text-yellow-400" />;
  return <Sun size={size} className="text-blue-500" />;
}

function AvatarContent({ user }) {
  if (user?.avatar)
    return <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  return (
    <span style={{ color: "#fff", fontWeight: 900, fontSize: 13, fontStyle: "italic" }}>
      {user?.username?.[0]?.toUpperCase()}
    </span>
  );
}

function LogoMark() {
  const { theme } = useThemeStore();

  const getLogoSrc = (theme) => {
    switch (theme) {
      case 'light':        return '/logos/LogoBlue.svg';
      case 'dark':         return '/logos/LogoWhite.svg';
      case 'high-contrast': return '/logos/LogoCyan.svg';
      default:             return '/logos/LogoWhite.svg';
    }
  };

  return (
    <Link 
      to="/" 
      style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 8, 
        textDecoration: "none", 
        flexShrink: 0 
      }}
    >
      <img 
        src={getLogoSrc(theme)}
        width={60} 
        alt="SEA" 
        style={{ 
          display: "block",
          transition: "opacity 0.4s ease, transform 0.3s ease"
        }} 
      />
    </Link>
  );
}


function StatCard({ icon, val, lbl, danger }) {
  return (
    <div className="nb-stat-card">
      <div style={{ flexShrink: 0, lineHeight: 0 }}>{icon}</div>
      <div>
        <div style={{
          fontWeight: 900, fontSize: 15, fontStyle: "italic",
          color: danger ? "#ef4444" : "var(--text-primary)", lineHeight: 1,
        }}>{val}</div>
        <div style={{
          fontSize: 9, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.12em", color: "var(--text-secondary)", marginTop: 2,
        }}>{lbl}</div>
      </div>
    </div>
  );
}

function HeartsContent({ hearts, canRefill, refilling, onRefill }) {
  return (
    <>
      <div className="nb-hearts-row">
        {[...Array(5)].map((_, i) => (
          <Heart key={i} size={18}
            className={i < hearts ? "text-rose-500 fill-rose-500" : "text-slate-300"} />
        ))}
      </div>
      <p style={{ textAlign: "center", fontWeight: 900, fontSize: 12, fontStyle: "italic", textTransform: "uppercase", color: "var(--text-primary)", marginBottom: 3 }}>
        {hearts} / 5 Vidas
      </p>
      <p style={{ textAlign: "center", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
        {hearts < 5 ? "Se regeneran con el tiempo o con gemas." : "¡Energía al máximo, Agente!"}
      </p>
      {hearts < 5 && (
        <button className="nb-refill-btn" onClick={onRefill} disabled={!canRefill || refilling}>
          {refilling ? "Procesando..." : "Recargar — 50 💎"}
        </button>
      )}
    </>
  );
}

function UserMenuContent({ user, onLogout, onClose }) {
  return (
    <>
      <div className="nb-panel-header">
        <p style={{ fontWeight: 900, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user?.displayName || user?.username}
        </p>
        <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-secondary)", marginTop: 3 }}>
          Nivel {user?.level || 1} · Agente
        </p>
      </div>
      <div className="nb-panel-body">
        <Link to="/profile"  className="nb-menu-item" onClick={onClose}><User     size={14} /> Mi Expediente</Link>
        <Link to="/settings" className="nb-menu-item" onClick={onClose}><Settings size={14} /> Configuración</Link>
        <div style={{ height: 1, background: "var(--card-border)", margin: "4px 6px" }} />
        <button className="nb-menu-item danger w-full" onClick={onLogout}><LogOut size={14} /> Salir del Sistema</button>
      </div>
    </>
  );
}

function TabItem({ to, icon, label, active }) {
  return (
    <Link to={to} className={`nb-tab${active ? " active" : ""}`}>
      <span className="t-icon">{icon}</span>
      <span className="t-label">{label}</span>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   Desktop Nav
───────────────────────────────────────────── */
function DesktopNav({ user, theme, cycleTheme, onLogout, onRefill, refilling }) {
  const [dropOpen,   setDropOpen]   = useState(false);
  const [heartsOpen, setHeartsOpen] = useState(false);

  const dropRef   = useRef(null);
  const heartsRef = useRef(null);

  useOutsideClick(dropRef,   () => setDropOpen(false));
  useOutsideClick(heartsRef, () => setHeartsOpen(false));

  const hearts    = user?.hearts?.current ?? 5;
  const gems      = user?.gems   || 0;
  const streak    = user?.streak?.current || 0;
  const xp        = user?.xp    || 0;
  const canRefill = hearts < 5 && gems >= 50;

  return (
    <>
      {/* Spacer */}
      <div style={{ height: 52 + 12 + 12 }} />

      <nav className="nb-top nb-glass">
        {/* Left: Logo + nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <LogoMark />
          <div className="nb-sep" style={{ marginLeft: 8 }} />
          <Link to="/league"  className="nb-navlink"><Trophy size={24} className="text-yellow-500" /><span className="lbl">Liga</span></Link>
          <Link to="/friends" className="nb-navlink"><Users  size={24} className="text-blue-500"   /><span className="lbl">Social</span></Link>
          <Link to="/shop" className="nb-navlink"><ShoppingCart size={24} className="text-green-500" /><span className="lbl">Tienda</span></Link>
        </div>

        {/* Right: stats + controls */}
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>

            {/* Unified stats group */}
            <div className="nb-stats-group">
              {/* Streak */}
              <div className="nb-chip">
                <img src="/streak.png" style={{ width: 25, height: 25, objectFit: "contain" }} alt="racha" />
                <span className="nb-stat-val">{streak}</span>
              </div>
              <span className="nb-chip-sep" />

              {/* Gems */}
              <div className="nb-chip">
                <img src="/gems.png" style={{ width: 25, height: 25, objectFit: "contain" }} alt="gemas" />
                <span className="nb-stat-val">{gems}</span>
              </div>
              <span className="nb-chip-sep" />

              {/* XP */}
              <div className="nb-chip">
                <Zap size={25} className="text-violet-400 fill-violet-400" />
                <span className="nb-stat-val">{xp}</span>
                <span className="nb-stat-val xp-lbl" style={{ opacity: 0.5, fontStyle: "normal", fontWeight: 700, fontSize: 9 }}>XP</span>
              </div>
              <span className="nb-chip-sep" />

              {/* Hearts */}
              <div style={{ position: "relative" }} ref={heartsRef}>
                <button
                  className={`nb-chip clickable${hearts === 0 ? " hearts-empty" : ""}`}
                  onClick={() => { setHeartsOpen(v => !v); setDropOpen(false); }}
                >
                  <Heart size={25} className={hearts === 0 ? "text-red-400 fill-red-400" : "text-rose-500 fill-rose-500"} />
                  <span className={`nb-stat-val${hearts === 0 ? " text-red-500" : ""}`}>{hearts}</span>
                </button>
                {heartsOpen && (
                  <div className="nb-panel" style={{ position: "absolute", right: -4, top: "calc(100% + 10px)", width: 225, padding: 16, zIndex: 300 }}>
                    <HeartsContent hearts={hearts} canRefill={canRefill} refilling={refilling} onRefill={onRefill} />
                  </div>
                )}
              </div>
            </div>

            {/* Theme toggle */}
            <button className="nb-icon-btn" onClick={cycleTheme} aria-label="Cambiar tema">
              <ThemeIcon theme={theme} />
            </button>

            {/* User dropdown */}
            <div style={{ position: "relative" }} ref={dropRef}>
              <button
                className="nb-avatar-btn"
                onClick={() => { setDropOpen(v => !v); setHeartsOpen(false); }}
                aria-expanded={dropOpen}
              >
                <AvatarContent user={user} />
              </button>
              {dropOpen && (
                <div className="nb-panel" style={{ position: "absolute", right: 0, top: "calc(100% + 10px)", minWidth: 210, zIndex: 300 }}>
                  <UserMenuContent user={user} onLogout={onLogout} onClose={() => setDropOpen(false)} />
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

/* ─────────────────────────────────────────────
   Mobile Nav
───────────────────────────────────────────── */
function MobileNav({ user, theme, cycleTheme, onLogout, onRefill, refilling }) {
  const location = useLocation();
  const [statsOpen, setStatsOpen] = useState(false);
  const panelRef = useRef(null);

  const closePanel = () => setStatsOpen(false);

  useEffect(() => { closePanel(); }, [location.pathname]);

  const TAB_BAR_H = 64;

  const hearts    = user?.hearts?.current ?? 5;
  const gems      = user?.gems   || 0;
  const streak    = user?.streak?.current || 0;
  const xp        = user?.xp    || 0;
  const canRefill = hearts < 5 && gems >= 50;

  const isActive   = (path) => location.pathname === path;
  const themeLabel = { light: "Claro", dark: "Oscuro", "high-contrast": "Alto" }[theme] ?? "Tema";

  return (
    <>
      {statsOpen && (
        <div className="nb-overlay" onClick={closePanel} aria-hidden="true" />
      )}

      {statsOpen && (
        <div
          ref={panelRef}
          className="nb-stats-panel nb-glass"
          style={{ bottom: TAB_BAR_H + 8 }}
        >
          <div className="nb-drag-handle" />
          <div className="nb-stats-grid">
            <StatCard
              icon={<img src="/streak.png" style={{ width: 30, height: 30, objectFit: "contain" }} alt="" />}
              val={streak} lbl="Racha"
            />
            <StatCard
              icon={<img src="/gems.png" style={{ width: 30, height: 30, objectFit: "contain" }} alt="" />}
              val={gems} lbl="Gemas"
            />
            <StatCard
              icon={<Zap size={30} className="text-violet-400 fill-violet-400" />}
              val={`${xp} XP`} lbl="Experiencia"
            />
            <StatCard
              icon={<Heart size={30} className={hearts === 0 ? "text-red-400 fill-red-400" : "text-rose-500 fill-rose-500"} />}
              val={`${hearts}/5`} lbl="Vidas" danger={hearts === 0}
            />
          </div>

          {hearts < 5 && (
            <div style={{ marginBottom: 8 }}>
              <button className="nb-refill-btn" onClick={onRefill} disabled={!canRefill || refilling}>
                {refilling ? "Procesando..." : "Recargar vidas — 50 💎"}
              </button>
            </div>
          )}

          <div className="nb-actions-row">
            <button className="nb-action-btn" onClick={cycleTheme}>
              <ThemeIcon theme={theme} size={20} />
              {themeLabel}
            </button>
            <Link to="/shop" className="nb-action-btn" onClick={closePanel}>
              <ShoppingCart size={20} />
            </Link>
            <Link to="/settings" className="nb-action-btn" onClick={closePanel}>
              <Settings size={20} />
            </Link>
            <button
              className="nb-action-btn"
              onClick={onLogout}
              style={{ flex: "none", padding: "9px 13px", color: "#ef4444", borderColor: "color-mix(in srgb, #ef4444 30%, transparent)" }}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      )}

      <nav className="nb-bottom nb-glass">
        <div className="nb-tabs">
          <TabItem to="/"        icon={<Home   size={30} />} label="Inicio"  active={isActive("/")} />
          <TabItem to="/league"  icon={<Trophy size={30} />} label="Liga"    active={isActive("/league")} />
          <TabItem to="/friends" icon={<Users  size={30} />} label="Social"  active={isActive("/friends")} />
          <TabItem to="/profile" icon={<User   size={30} />} label="Perfil"  active={isActive("/profile")} />
          <button
            className={`nb-tab${statsOpen ? " active" : ""}`}
            onClick={() => setStatsOpen(v => !v)}
            aria-expanded={statsOpen}
            aria-label={statsOpen ? "Cerrar estadísticas" : "Ver estadísticas"}
          >
            <span className="t-icon">
              {statsOpen ? <X size={30} /> : <BarChart2 size={30} />}
            </span>
            <span className="t-label">Stats</span>
          </button>
        </div>
      </nav>
    </>
  );
}

/* ─────────────────────────────────────────────
   Root export
───────────────────────────────────────────── */
export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout, fetchMe } = useAuthStore();
  const { theme, cycleTheme }     = useThemeStore();
  const [refilling, setRefilling] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  if (location.pathname.startsWith("/lesson/")) return null;

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleRefill = async () => {
    if (refilling) return;
    setRefilling(true);
    try {
      await api.post("/progress/refill-hearts");
      await fetchMe();
    } catch (err) { console.error(err); }
    finally { setRefilling(false); }
  };

  const shared = { user, theme, cycleTheme, onLogout: handleLogout, onRefill: handleRefill, refilling };

  return (
    <div className="nb">
      <style>{NAV_CSS}</style>

      <div className="hidden lg:block">
        <DesktopNav {...shared} />
      </div>

      {user && (
        <div className="lg:hidden">
          <MobileNav {...shared} />
        </div>
      )}
    </div>
  );
}