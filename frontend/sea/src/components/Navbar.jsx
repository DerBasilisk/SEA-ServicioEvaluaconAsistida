import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  User, Settings, LogOut, Heart, Zap, Trophy,
  Users, Eye, Sun, Moon, Home, BarChart2, X,
} from "lucide-react";
import useAuthStore from "../store/authStore";
import useThemeStore from "../store/themeStore";
import api from "../api/axios";

/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
const NAV_CSS = `
  .nb * {
    box-sizing: border-box;
    transition: background-color 0.22s ease, border-color 0.22s ease,
                color 0.22s ease, box-shadow 0.22s ease, opacity 0.22s ease;
  }
  .nb img { transition: none !important; }

  .nb-glass {
    background: var(--glass-bg);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  /* ═══════ DESKTOP TOP NAV ═══════ */
  .nb-top {
    position: fixed;
    top: 0; left: 50%; transform: translateX(-50%);
    width: min(84%, 1100px);
    height: 58px;
    z-index: 200;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20px;
    border-bottom: 1px solid var(--glass-border);
    border-radius: 0 0 20px 20px;
    box-shadow: 0 4px 24px var(--glass-shadow);
  }

  .nb-chip {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 12px; border-radius: 99px;
    border: 1px solid var(--glass-border);
    background: var(--progress-track);
    cursor: default; user-select: none;
  }
  .nb-chip.clickable { cursor: pointer; }
  .nb-chip:hover {
    background: var(--card-bg); border-color: var(--text-accent);
    transform: translateY(-1px); box-shadow: 0 4px 12px var(--glass-shadow);
  }
  .nb-stat-val {
    font-weight: 900; font-size: 12px; font-style: italic;
    color: var(--text-primary);
  }

  .nb-icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: 12px;
    border: 1px solid var(--glass-border); background: var(--progress-track);
    cursor: pointer;
  }
  .nb-icon-btn:hover {
    background: var(--card-bg); border-color: var(--text-accent);
    transform: translateY(-1px);
  }

  .nb-avatar-btn {
    width: 36px; height: 36px; border-radius: 12px; overflow: hidden;
    border: 2px solid var(--glass-border);
    background: linear-gradient(135deg, #2B7FE8, #5B9FFF);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
  }
  .nb-avatar-btn:hover { border-color: var(--text-accent); transform: scale(1.05); }

  .nb-navlink {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 12px; border-radius: 12px; text-decoration: none;
  }
  .nb-navlink:hover { background: var(--progress-track); }
  .nb-navlink .lbl {
    font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--text-primary);
  }
  .nb-sep { width: 1px; height: 20px; background: var(--glass-border); margin: 0 4px; }

  /* ═══════ SHARED PANELS ═══════ */
  .nb-panel {
    background: var(--card-bg);
    border: 1px solid var(--card-border); border-radius: 18px;
    box-shadow: 0 16px 48px var(--glass-shadow);
    animation: nb-drop 0.18s ease both;
  }
  @keyframes nb-drop {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: none; }
  }
  .nb-panel.up { animation-name: nb-pop-up; }
  @keyframes nb-pop-up {
    from { opacity: 0; transform: translateY(8px) scale(0.97); }
    to   { opacity: 1; transform: none; }
  }

  .nb-panel-header {
    padding: 14px 16px; background: var(--progress-track);
    border-bottom: 1px solid var(--card-border);
    border-radius: 18px 18px 0 0;
  }
  .nb-panel-body { padding: 6px; }

  .nb-menu-item {
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 10px 12px; border-radius: 12px;
    border: none; background: transparent; text-decoration: none;
    color: var(--text-primary); font-weight: 700; font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.12em; cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .nb-menu-item:hover { background: var(--progress-track); color: #2B7FE8; }
  .nb-menu-item.danger:hover { background: #fff1f0; color: #ef4444; }

  .nb-hearts-row { display: flex; justify-content: center; gap: 6px; margin-bottom: 12px; }
  .nb-refill-btn {
    width: 100%; padding: 10px; background: #2B7FE8; color: #fff;
    border: none; border-radius: 12px; font-weight: 900; font-size: 10px;
    text-transform: uppercase; letter-spacing: 0.18em; cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
  }
  .nb-refill-btn:hover:not(:disabled) { background: #1A6FD8; }
  .nb-refill-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  /* ═══════ MOBILE BOTTOM NAV ═══════ */
  .nb-bottom {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
    border-top: 1px solid var(--glass-border);
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -4px 24px var(--glass-shadow);
  }
  .nb-tabs {
    display: flex; justify-content: space-around; align-items: center;
    padding: 8px 4px 10px;
  }
  .nb-tab {
    display: flex; flex-direction: column; align-items: center;
    gap: 3px; padding: 6px 12px; border-radius: 14px;
    text-decoration: none; position: relative;
    border: none; background: transparent; cursor: pointer;
  }
  .nb-tab .t-icon { color: var(--text-muted); transition: color 0.15s, transform 0.15s; }
  .nb-tab .t-label {
    font-size: 15px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.12em; color: var(--text-muted); transition: color 0.15s;
  }
  .nb-tab.active .t-icon  { color: var(--text-accent); transform: scale(1.1); }
  .nb-tab.active .t-label { color: var(--text-accent); }
  .nb-tab.active::after {
    content: ''; display: block; width: 4px; height: 4px; border-radius: 50%;
    background: var(--text-accent);
    position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  }

  /* Stats slide-up panel */
  .nb-stats-panel {
    position: fixed; left: 0; right: 0; bottom: 64px; z-index: 199;
    border-radius: 20px 20px 0 0;
    border: 1px solid var(--card-border); border-bottom: none;
    padding: 18px 16px 14px;
    box-shadow: 0 -8px 32px var(--glass-shadow);
    animation: nb-slide-up 0.22s ease both;
  }
  @keyframes nb-slide-up {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: none; }
  }

  .nb-stats-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    margin-bottom: 12px;
  }
  .nb-stat-card {
    display: flex; align-items: center; gap: 10px; padding: 12px 14px;
    background: var(--card-bg); border: 1px solid var(--glass-border);
    border-radius: 14px;
  }

  .nb-actions-row { display: flex; gap: 10px; align-items: center; }
  .nb-action-btn {
    display: flex; align-items: center; justify-content: center;
    gap: 7px; flex: 1; padding: 11px 12px;
    margin-bottom: 15px;
    background: var(--card-bg); border: 1px solid var(--glass-border);
    border-radius: 14px; cursor: pointer; font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.12em;
    color: var(--text-primary); text-decoration: none;
    transition: background 0.15s, border-color 0.15s;
  }
  .nb-action-btn:hover { background: var(--card-bg); border-color: var(--text-accent); }
`;

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function useOutsideClick(ref, handler) {
  useEffect(() => {
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handler();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [ref, handler]);
}

function ThemeIcon({ theme, size = 16 }) {
  if (theme === "dark")          return <Moon  size={size} className="text-indigo-400" />;
  if (theme === "high-contrast") return <Eye   size={size} className="text-yellow-400" />;
  return <Sun size={size} className="text-blue-500" />;
}

function AvatarContent({ user }) {
  if (user?.avatar) return <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  return (
    <span style={{ color: "#fff", fontWeight: 900, fontSize: 13, fontStyle: "italic" }}>
      {user?.username?.[0]?.toUpperCase()}
    </span>
  );
}

function LogoMark({ small }) {
  const imgSize = small ? 22 : 30;
  const fontSize = small ? 15 : 18;
  return (
    <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
      <div style={{
        background: "#2B7FE8", borderRadius: 10, padding: small ? 5 : 6,
        transform: "rotate(-3deg)", flexShrink: 0,
        boxShadow: "0 2px 8px rgba(43,127,232,.35)",
      }}>
        <img src="/sealogo.png" width={imgSize} alt="SEA" style={{ filter: "brightness(0) invert(1)", display: "block" }} />
      </div>
      <span style={{ fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "-0.03em", fontSize, color: "var(--text-primary)" }}>
        SEA
      </span>
    </Link>
  );
}

function StatCard({ icon, val, lbl, danger }) {
  return (
    <div className="nb-stat-card">
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 900, fontSize: 16, fontStyle: "italic", color: danger ? "#ef4444" : "var(--text-primary)", lineHeight: 1 }}>
          {val}
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-secondary)", marginTop: 3 }}>
          {lbl}
        </div>
      </div>
    </div>
  );
}

function HeartsContent({ hearts, canRefill, refilling, onRefill }) {
  return (
    <>
      <div className="nb-hearts-row">
        {[...Array(5)].map((_, i) => (
          <Heart key={i} size={18} className={i < hearts ? "text-rose-500 fill-rose-500" : "text-slate-300"} />
        ))}
      </div>
      <p style={{ textAlign: "center", fontWeight: 900, fontSize: 12, fontStyle: "italic", textTransform: "uppercase", color: "var(--text-primary)", marginBottom: 4 }}>
        {hearts} / 5 Vidas
      </p>
      <p style={{ textAlign: "center", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#7A9CC5", marginBottom: 14, lineHeight: 1.5 }}>
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
        <p style={{ fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user?.displayName || user?.username}
        </p>
        <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-secondary)", marginTop: 3 }}>
          Nivel {user?.level || 1} · Agente
        </p>
      </div>
      <div className="nb-panel-body">
        <Link to="/profile"  className="nb-menu-item" onClick={onClose}><User     size={14} /> Mi Expediente</Link>
        <Link to="/settings" className="nb-menu-item" onClick={onClose}><Settings size={14} /> Configuración</Link>
        <button className="nb-menu-item danger" onClick={onLogout}><LogOut size={14} /> Salir del Sistema</button>
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
   Desktop Nav — fully isolated state
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
      <div style={{ height: 58 + 16 }} />
      <nav className="nb-top nb-glass">
        <LogoMark />

        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Secondary links — lg+ */}
            <div className="hidden lg:flex" style={{ alignItems: "center", gap: 4, marginRight: 8 }}>
              <Link to="/league"  className="nb-navlink"><Trophy size={14} className="text-yellow-500" /><span className="lbl">Liga</span></Link>
              <Link to="/friends" className="nb-navlink"><Users  size={14} className="text-[#2B7FE8]"  /><span className="lbl">Social</span></Link>
            </div>
            <div className="nb-sep hidden lg:block" />

            {/* Stats */}
            <div className="nb-chip">
              <img src="/streak.png" style={{ width: 18, height: 18, objectFit: "contain" }} alt="racha" />
              <span className="nb-stat-val">{streak}</span>
            </div>
            <div className="nb-chip">
              <img src="/gems.png" style={{ width: 18, height: 18, objectFit: "contain" }} alt="gemas" />
              <span className="nb-stat-val">{gems}</span>
            </div>
            <div className="nb-chip">
              <Zap size={13} className="text-violet-400 fill-violet-400" />
              <span className="nb-stat-val">{xp} XP</span>
            </div>

            {/* Hearts popover */}
            <div style={{ position: "relative" }} ref={heartsRef}>
              <button
                className="nb-chip clickable"
                style={{ border: hearts === 0 ? "1px solid #fca5a5" : undefined }}
                onClick={() => setHeartsOpen(v => !v)}
              >
                <Heart size={14} className={hearts === 0 ? "text-red-400 fill-red-400" : "text-rose-500 fill-rose-500"} />
                <span className={`nb-stat-val${hearts === 0 ? " text-red-500" : ""}`}>{hearts}</span>
              </button>
              {heartsOpen && (
                <div className="nb-panel" style={{ position: "absolute", right: 0, top: "calc(100% + 10px)", width: 240, padding: 20, zIndex: 300 }}>
                  <HeartsContent hearts={hearts} canRefill={canRefill} refilling={refilling} onRefill={onRefill} />
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button className="nb-icon-btn" onClick={cycleTheme} aria-label="Cambiar tema">
              <ThemeIcon theme={theme} />
            </button>

            {/* User dropdown */}
            <div style={{ position: "relative" }} ref={dropRef}>
              <button className="nb-avatar-btn" onClick={() => setDropOpen(v => !v)}>
                <AvatarContent user={user} />
              </button>
              {dropOpen && (
                <div className="nb-panel" style={{ position: "absolute", right: 0, top: "calc(100% + 10px)", minWidth: 220, zIndex: 300 }}>
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
   Mobile Nav — fully isolated state
───────────────────────────────────────────── */
function MobileNav({ user, theme, cycleTheme, onLogout, onRefill, refilling }) {
  const location = useLocation();

  const [statsOpen, setStatsOpen] = useState(false);
  const [dropOpen,  setDropOpen]  = useState(false);

  const panelRef = useRef(null);
  const dropRef  = useRef(null);

  useOutsideClick(panelRef, () => {
    setStatsOpen(false);
    setDropOpen(false);
  });
  useOutsideClick(dropRef,  () => setDropOpen(false));

  const hearts    = user?.hearts?.current ?? 5;
  const gems      = user?.gems   || 0;
  const streak    = user?.streak?.current || 0;
  const xp        = user?.xp    || 0;
  const canRefill = hearts < 5 && gems >= 50;

  const isActive = (path) => location.pathname === path;
  const themeLabel = theme === "light" ? "Claro" : theme === "dark" ? "Oscuro" : "Contraste";

  const closeAll = () => { setStatsOpen(false); setDropOpen(false); };

  return (
    <>
      <div />

      {/* ── Stats slide-up panel ── */}
      {statsOpen && (
        <div ref={panelRef}>
          <div className="nb-stats-panel nb-glass">
            {/* Stat cards */}
            <div className="nb-stats-grid">
              <StatCard
                icon={<img src="/streak.png" style={{ width: 34, height: 34, objectFit: "contain" }} alt="" />}
                val={streak} lbl="Racha"
              />
              <StatCard
                icon={<img src="/gems.png" style={{ width: 34, height: 34, objectFit: "contain" }} alt="" />}
                val={gems} lbl="Gemas"
              />
              <StatCard
                icon={<Zap size={34} className="text-violet-400 fill-violet-400" />}
                val={`${xp} XP`} lbl="Experiencia"
              />
              <StatCard
                icon={<Heart size={34} className={hearts === 0 ? "text-red-400 fill-red-400" : "text-rose-500 fill-rose-500"} />}
                val={`${hearts}/5`} lbl="Vidas" danger={hearts === 0}
              />
            </div>

            {/* Refill button — only when hearts < 5 */}
            {hearts < 5 && (
              <div style={{ marginBottom: 10 }}>
                <button className="nb-refill-btn" onClick={onRefill} disabled={!canRefill || refilling}>
                  {refilling ? "Procesando..." : "Recargar vidas — 50 💎"}
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="nb-actions-row">
              <button className="nb-action-btn" onClick={cycleTheme}>
                <ThemeIcon theme={theme} size={34} />
                {themeLabel}
              </button>
              <Link to="/settings" className="nb-action-btn" onClick={closeAll}>
                <Settings size={34} /> Ajustes
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom tab bar ── */}
      <nav className="nb-bottom nb-glass">
          <div className="nb-tabs">
            <TabItem to="/"        icon={<Home   size={26} />} label="Inicio"  active={isActive("/")} />
            <TabItem to="/league"  icon={<Trophy size={26} />} label="Liga"    active={isActive("/league")} />
            <TabItem to="/friends" icon={<Users  size={26} />} label="Social"  active={isActive("/friends")} />
            <TabItem to="/profile" icon={<User   size={26} />} label="Perfil"  active={isActive("/profile")} />

            {/* 5th tab — Stats panel toggle */}
            <button 
              className={`nb-tab ${statsOpen ? "active" : ""}`} 
              onClick={(e) => {
                e.stopPropagation();
                setStatsOpen(prev => !prev);   // Toggle correcto
                setDropOpen(false);
              }}
              aria-expanded={statsOpen}
              aria-label={statsOpen ? "Cerrar panel de estadísticas" : "Abrir panel de estadísticas"}
            >
              <span className="t-icon">
                {statsOpen ? <X size={26} /> : <BarChart2 size={26} />}
              </span>
              <span className="t-label">
                {statsOpen ? "Stats" : "Stats"}
              </span>
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
    } catch (err) {
      console.error(err);
    } finally {
      setRefilling(false);
    }
  };

  const shared = { user, theme, cycleTheme, onLogout: handleLogout, onRefill: handleRefill, refilling };

  return (
    <div className="nb">
      <style>{NAV_CSS}</style>

      {/* Desktop: md and up — renders its own fixed top nav + spacer */}
      <div className="hidden md:block">
        <DesktopNav {...shared} />
      </div>

      {/* Mobile: below md — renders its own fixed bottom nav + spacer */}
      {user && (
        <div className="md:hidden">
          <MobileNav {...shared} />
        </div>
      )}
    </div>
  );
}