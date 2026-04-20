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
    width: min(88%, 1200px);
    height: 58px;
    z-index: 200;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20px;
    border-bottom: 1px solid var(--glass-border);
    border-radius: 0 0 20px 20px;
    box-shadow: 0 4px 24px var(--glass-shadow);
  }

  .nb-chip {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 10px; border-radius: 99px;
    border: 1px solid var(--glass-border);
    background: var(--progress-track);
    cursor: default; user-select: none;
    white-space: nowrap;
  }
  .nb-chip.clickable { cursor: pointer; }
  .nb-chip:hover {
    background: var(--card-bg); border-color: var(--text-accent);
    transform: translateY(-1px); box-shadow: 0 4px 12px var(--glass-shadow);
  }
  .nb-stat-val {
    font-weight: 900; font-size: 11px; font-style: italic;
    color: var(--text-primary);
  }

  /* En pantallas md→lg, oculta la etiqueta XP para ahorrar espacio */
  @media (max-width: 1023px) {
    .nb-chip .nb-chip-lbl { display: none; }
  }

  .nb-icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 34px; height: 34px; border-radius: 12px;
    border: 1px solid var(--glass-border); background: var(--progress-track);
    cursor: pointer; flex-shrink: 0;
  }
  .nb-icon-btn:hover {
    background: var(--card-bg); border-color: var(--text-accent);
    transform: translateY(-1px);
  }

  .nb-avatar-btn {
    width: 34px; height: 34px; border-radius: 12px; overflow: hidden;
    border: 2px solid var(--glass-border);
    background: linear-gradient(135deg, #2B7FE8, #5B9FFF);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .nb-avatar-btn:hover { border-color: var(--text-accent); transform: scale(1.05); }

  .nb-navlink {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 10px; border-radius: 12px; text-decoration: none;
    white-space: nowrap;
  }
  .nb-navlink:hover { background: var(--progress-track); }
  .nb-navlink .lbl {
    font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--text-primary);
  }
  .nb-sep { width: 1px; height: 20px; background: var(--glass-border); margin: 0 2px; }

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

  .nb-hearts-row { display: flex; justify-content: center; gap: 6px; margin-bottom: 10px; }
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
    /* Padding bottom respeta safe-area en iOS */
    padding: 6px 4px calc(6px + env(safe-area-inset-bottom, 0px));
  }
  .nb-tab {
    display: flex; flex-direction: column; align-items: center;
    gap: 3px; padding: 6px 10px; border-radius: 14px;
    text-decoration: none; position: relative;
    border: none; background: transparent; cursor: pointer;
    /* Mínimo toque de 44px para accesibilidad */
    min-width: 44px; min-height: 44px; justify-content: center;
  }
  .nb-tab .t-icon { color: var(--text-muted); transition: color 0.15s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1); }
  .nb-tab .t-label {
    font-size: 9px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--text-muted); transition: color 0.15s;
    line-height: 1;
  }
  .nb-tab.active .t-icon  { color: var(--text-accent); transform: scale(1.15) translateY(-1px); }
  .nb-tab.active .t-label { color: var(--text-accent); }
  .nb-tab.active::after {
    content: ''; display: block; width: 4px; height: 4px; border-radius: 50%;
    background: var(--text-accent);
    position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
  }

  /* ─── Stats slide-up panel ─── */
  .nb-stats-panel {
    position: fixed; left: 0; right: 0;
    /* Se posiciona dinámicamente sobre la barra */
    z-index: 199;
    border-radius: 20px 20px 0 0;
    border: 1px solid var(--card-border); border-bottom: none;
    padding: 14px 14px 12px;
    box-shadow: 0 -8px 32px var(--glass-shadow);
    animation: nb-slide-up 0.22s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes nb-slide-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: none; }
  }

  /* Grid 2x2 ajustado */
  .nb-stats-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
    margin-bottom: 10px;
  }
  .nb-stat-card {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    background: var(--card-bg); border: 1px solid var(--glass-border);
    border-radius: 14px;
  }

  .nb-actions-row { display: flex; gap: 8px; align-items: center; }
  .nb-action-btn {
    display: flex; align-items: center; justify-content: center;
    gap: 6px; flex: 1; padding: 10px 12px;
    background: var(--card-bg); border: 1px solid var(--glass-border);
    border-radius: 14px; cursor: pointer; font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.12em;
    color: var(--text-primary); text-decoration: none;
    transition: background 0.15s, border-color 0.15s;
  }
  .nb-action-btn:hover { border-color: var(--text-accent); }

  /* Overlay semitransparente detrás del panel */
  .nb-overlay {
    position: fixed; inset: 0; z-index: 198;
    background: rgba(0,0,0,0.25);
    animation: nb-fade-in 0.15s ease both;
  }
  @keyframes nb-fade-in {
    from { opacity: 0; } to { opacity: 1; }
  }
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

function ThemeIcon({ theme, size = 15 }) {
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

function LogoMark({ small }) {
  const imgSize  = small ? 20 : 28;
  const fontSize = small ? 14 : 17;
  return (
    <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
      <div style={{
        background: "#2B7FE8", borderRadius: 10, padding: small ? 5 : 6,
        transform: "rotate(-3deg)", flexShrink: 0,
        boxShadow: "0 2px 8px rgba(43,127,232,.35)",
      }}>
        <img src="/sealogo.png" width={imgSize} alt="SEA" style={{ filter: "brightness(0) invert(1)", display: "block" }} />
      </div>
      <span style={{
        fontWeight: 900, fontStyle: "italic", textTransform: "uppercase",
        letterSpacing: "-0.03em", fontSize, color: "var(--text-primary)",
      }}>
        SEA
      </span>
    </Link>
  );
}

/** Card de stat compacta usada en el panel móvil */
function StatCard({ icon, val, lbl, danger }) {
  return (
    <div className="nb-stat-card">
      <div style={{ flexShrink: 0, lineHeight: 0 }}>{icon}</div>
      <div>
        <div style={{
          fontWeight: 900, fontSize: 15, fontStyle: "italic",
          color: danger ? "#ef4444" : "var(--text-primary)", lineHeight: 1,
        }}>
          {val}
        </div>
        <div style={{
          fontSize: 9, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.12em", color: "var(--text-secondary)", marginTop: 3,
        }}>
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
          <Heart key={i} size={17}
            className={i < hearts ? "text-rose-500 fill-rose-500" : "text-slate-300"} />
        ))}
      </div>
      <p style={{ textAlign: "center", fontWeight: 900, fontSize: 12, fontStyle: "italic", textTransform: "uppercase", color: "var(--text-primary)", marginBottom: 3 }}>
        {hearts} / 5 Vidas
      </p>
      <p style={{ textAlign: "center", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#7A9CC5", marginBottom: 12, lineHeight: 1.5 }}>
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
      <div style={{ height: 58 + 16 }} />
      <nav className="nb-top nb-glass">
        <LogoMark />

        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>

            {/* Secondary links — lg+ */}
            <div className="hidden lg:flex" style={{ alignItems: "center", gap: 2, marginRight: 6 }}>
              <Link to="/league"  className="nb-navlink"><Trophy size={13} className="text-yellow-500" /><span className="lbl">Liga</span></Link>
              <Link to="/friends" className="nb-navlink"><Users  size={13} className="text-[#2B7FE8]"  /><span className="lbl">Social</span></Link>
            </div>
            <div className="nb-sep hidden lg:block" />

            {/* Stats — en md sólo íconos, en lg+ íconos + valor */}
            <div className="nb-chip">
              <img src="/streak.png" style={{ width: 16, height: 16, objectFit: "contain" }} alt="racha" />
              <span className="nb-stat-val">{streak}</span>
            </div>
            <div className="nb-chip">
              <img src="/gems.png" style={{ width: 16, height: 16, objectFit: "contain" }} alt="gemas" />
              <span className="nb-stat-val">{gems}</span>
            </div>
            <div className="nb-chip">
              <Zap size={12} className="text-violet-400 fill-violet-400" />
              <span className="nb-stat-val">{xp}</span>
              {/* Etiqueta "XP" oculta en md, visible en lg */}
              <span className="nb-chip-lbl nb-stat-val" style={{ opacity: 0.55, fontStyle: "normal", fontWeight: 700, fontSize: 9 }}>XP</span>
            </div>

            {/* Hearts popover */}
            <div style={{ position: "relative" }} ref={heartsRef}>
              <button
                className="nb-chip clickable"
                style={{ border: hearts === 0 ? "1px solid #fca5a5" : undefined }}
                onClick={() => { setHeartsOpen(v => !v); setDropOpen(false); }}
              >
                <Heart size={13} className={hearts === 0 ? "text-red-400 fill-red-400" : "text-rose-500 fill-rose-500"} />
                <span className={`nb-stat-val${hearts === 0 ? " text-red-500" : ""}`}>{hearts}</span>
              </button>
              {heartsOpen && (
                <div className="nb-panel" style={{ position: "absolute", right: 0, top: "calc(100% + 10px)", width: 230, padding: 18, zIndex: 300 }}>
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
              <button className="nb-avatar-btn" onClick={() => { setDropOpen(v => !v); setHeartsOpen(false); }}>
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

  // Cierra el panel si se toca el overlay o se navega
  const closePanel = () => setStatsOpen(false);

  // Cierra al cambiar de ruta
  useEffect(() => { closePanel(); }, [location.pathname]);

  // Calcula la altura real de la barra para posicionar el panel justo encima
  const TAB_BAR_H = 60; // px aprox — ajusta si cambias el padding

  const hearts    = user?.hearts?.current ?? 5;
  const gems      = user?.gems   || 0;
  const streak    = user?.streak?.current || 0;
  const xp        = user?.xp    || 0;
  const canRefill = hearts < 5 && gems >= 50;

  const isActive  = (path) => location.pathname === path;
  const themeLabel = { light: "Claro", dark: "Oscuro", "high-contrast": "Alto" }[theme] ?? "Tema";

  return (
    <>
      {/* Overlay — cierra el panel al tocar fuera */}
      {statsOpen && (
        <div
          className="nb-overlay"
          onClick={closePanel}
          aria-hidden="true"
        />
      )}

      {/* Stats slide-up panel */}
      {statsOpen && (
        <div
          ref={panelRef}
          className="nb-stats-panel nb-glass"
          style={{ bottom: TAB_BAR_H }}
        >
          {/* Handle visual */}
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--glass-border)", margin: "0 auto 12px" }} />

          <div className="nb-stats-grid">
            <StatCard
              icon={<img src="/streak.png" style={{ width: 28, height: 28, objectFit: "contain" }} alt="" />}
              val={streak} lbl="Racha"
            />
            <StatCard
              icon={<img src="/gems.png" style={{ width: 28, height: 28, objectFit: "contain" }} alt="" />}
              val={gems} lbl="Gemas"
            />
            <StatCard
              icon={<Zap size={26} className="text-violet-400 fill-violet-400" />}
              val={`${xp} XP`} lbl="Experiencia"
            />
            <StatCard
              icon={<Heart size={26} className={hearts === 0 ? "text-red-400 fill-red-400" : "text-rose-500 fill-rose-500"} />}
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
            <button className="nb-action-btn" onClick={() => { cycleTheme(); }}>
              <ThemeIcon theme={theme} size={15} />
              {themeLabel}
            </button>
            <Link to="/settings" className="nb-action-btn" onClick={closePanel}>
              <Settings size={15} /> Ajustes
            </Link>
            <button className="nb-action-btn nb-action-danger" onClick={onLogout}
              style={{ flex: "none", padding: "10px 14px", color: "#ef4444", borderColor: "#fca5a5" }}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="nb-bottom nb-glass">
        <div className="nb-tabs">
          <TabItem to="/"        icon={<Home   size={22} />} label="Inicio"  active={isActive("/")} />
          <TabItem to="/league"  icon={<Trophy size={22} />} label="Liga"    active={isActive("/league")} />
          <TabItem to="/friends" icon={<Users  size={22} />} label="Social"  active={isActive("/friends")} />
          <TabItem to="/profile" icon={<User   size={22} />} label="Perfil"  active={isActive("/profile")} />

          {/* Stats toggle — ícono cambia al abrir */}
          <button
            className={`nb-tab${statsOpen ? " active" : ""}`}
            onClick={() => setStatsOpen(v => !v)}
            aria-expanded={statsOpen}
            aria-label={statsOpen ? "Cerrar estadísticas" : "Ver estadísticas"}
          >
            <span className="t-icon">
              {statsOpen ? <X size={22} /> : <BarChart2 size={22} />}
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

      {/* Desktop: md y arriba */}
      <div className="hidden md:block">
        <DesktopNav {...shared} />
      </div>

      {/* Mobile: debajo de md */}
      {user && (
        <div className="md:hidden">
          <MobileNav {...shared} />
        </div>
      )}
    </div>
  );
}