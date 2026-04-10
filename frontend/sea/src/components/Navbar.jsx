import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, Settings, LogOut, Heart, Zap, Trophy, Users, Eye, Sun, Moon, } from "lucide-react";
import useAuthStore from "../store/authStore";
import useThemeStore from "../store/themeStore";
import api from "../api/axios";

const NAV_CSS = `
  * {
    transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
  }
    
  .sea-nav {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1.5px solid var(--glass-border);
    border-radius: 0 0 30px 30px; /* Ajustado para que encaje mejor arriba */
    box-shadow: 0 10px 30px var(--glass-shadow);
  }
  
  .stat-capsule {
    background: var(--progress-track); /* Usamos el track como base sutil */
    border: 1px solid var(--glass-border);
    box-shadow: 0 4px 15px var(--glass-shadow);
    transition: all 0.3s ease;
  }
  
  .stat-capsule:hover {
    background: var(--card-bg);
    transform: translateY(-2px);
    border-color: var(--text-accent);
  }

  .nav-dropdown {
    background: var(--card-bg);
    backdrop-filter: blur(25px);
    border: 1.5px solid var(--card-border);
    box-shadow: 0 20px 40px var(--glass-shadow);
  }

  /* Animación para el cambio de tema */
  .sea-nav, .stat-capsule, .nav-dropdown {
    transition: background 0.4s ease, border 0.4s ease, color 0.4s ease;
  }

  img, .avatar-container {
  transition: none;
}
`;

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, fetchMe } = useAuthStore();
  const [refilling, setRefilling] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [heartsOpen, setHeartsOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const heartsRef = useRef(null);
  const { theme, cycleTheme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (heartsRef.current && !heartsRef.current.contains(e.target)) setHeartsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (location.pathname.startsWith("/lesson/")) return null;

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleRefill = async () => {
    if (refilling) return;
    setRefilling(true);
    try {
      await api.post("/progress/refill-hearts");
      await fetchMe();
      setHeartsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setRefilling(false);
    }
  };

  const hearts = user?.hearts?.current ?? 5;
  const gems = user?.gems || 0;
  const canRefill = hearts < 5 && gems >= 50;

  return (
    <div className="sticky top-0 z-[100] mb-12">
    <nav className="sea-nav fixed w-[75%] left-[10%] top-0 z-[100] px-6 py-3">
      <style>{NAV_CSS}</style>
      <div className="max-w-[98%] mx-auto flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 group transition-transform active:scale-95">
          <div className="bg-[#2B7FE8] p-1.5 rounded-xl shadow-lg shadow-blue-200 rotate-[-3deg] group-hover:rotate-0 transition-all">
             <img src="/sealogo.png" width="40" alt="SEA" className="brightness-0 invert" />
          </div>
          <span className="text-[--text-primary] font-black italic tracking-tighter text-xl uppercase">SEA</span>
        </Link>

        {/* STATS & ACTIONS */}
        {user && (
          <div className="flex items-center gap-3">
            
            {/* Nav Links Iconos */}
            <div className="hidden md:flex items-center gap-2 mr-4 border-r border-slate-200 pr-4">
               <NavLink to="/league" icon={<Trophy size={18} />} label="Liga" color="text-yellow-500" />
               <NavLink to="/friends" icon={<Users size={18} />} label="Social" color="text-[#2B7FE8]" />
            </div>

            {/* Streak */}
            <div className="stat-capsule flex items-center gap-2 px-3 py-1.5 rounded-2xl">
              <img src="/streak.png" className="w-6 h-6 object-contain" alt="racha" />
              <span className="font-black text-[--text-primary] text-xs">{user.streak?.current || 0}</span>
            </div>

            {/* Gems */}
            <div className="stat-capsule flex items-center gap-2 px-3 py-1.5 rounded-2xl">
              <img src="/gems.png" className="w-6 h-6 object-contain" alt="gemas" />
              <span className="font-black text-[--text-primary] text-xs">{gems}</span>
            </div>

            {/* XP */}
            <div className="hidden sm:flex stat-capsule items-center gap-2 px-3 py-1.5 rounded-2xl">
              <Zap size={16} className="text-violet-400 fill-violet-400" />
              <span className="font-black text-[var(--text-primary)] text-[10px] uppercase">
                {user.xp || 0} XP
              </span>
            </div>

            {/* Hearts Popover */}
            <div className="relative" ref={heartsRef}>
              <button
                onClick={() => setHeartsOpen(!heartsOpen)}
                className={`stat-capsule flex items-center gap-2 px-3 py-1.5 rounded-2xl ${hearts === 0 ? "bg-red-50" : ""}`}
              >
                <Heart size={18} className={`${hearts === 0 ? "text-red-400 fill-red-400" : "text-rose-500 fill-rose-500"} animate-pulse`} />
                <span className={`font-black text-xs ${hearts === 0 ? "text-red-500" : "text-[--text-primary]"}`}>{hearts}</span>
              </button>

              {heartsOpen && (
                <div className="nav-dropdown absolute right-0 mt-4 w-64 rounded-[2rem] p-6 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-center gap-1.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Heart key={i} size={20} className={i < hearts ? "text-rose-500 fill-rose-500" : "text-slate-200"} />
                    ))}
                  </div>
                  <h4 className="text-[--text-primary] font-black uppercase italic text-center text-sm mb-1">{hearts} / 5 Vidas</h4>
                  <p className="text-[#7A9CC5] text-[10px] font-bold text-center uppercase tracking-widest mb-4 leading-relaxed">
                    {hearts < 5 ? "Las vidas se regeneran con el tiempo o con gemas." : "¡Energía al máximo, Agente!"}
                  </p>
                  
                  {hearts < 5 && (
                    <button
                      onClick={handleRefill}
                      disabled={!canRefill || refilling}
                      className="w-full bg-[#2B7FE8] hover:bg-[#1A6FD8] disabled:opacity-30 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-100"
                    >
                      {refilling ? "Procesando..." : `Recargar (50 💎)`}
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
            onClick={cycleTheme}
            className="stat-capsule flex items-center justify-center w-10 h-10 rounded-2xl transition-all"
          >
            {theme === "light" && <Sun size={20} className="text-blue-500" />}
            {theme === "dark" && <Moon size={20} className="text-indigo-400" />}
            {theme === "high-contrast" && <Eye size={20} className="text-[#FFFF00]" />}
          </button>

            {/* User Dropdown */}
            <div className="relative ml-2" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white shadow-md hover:scale-105 transition-all flex-shrink-0 bg-gradient-to-br from-[#2B7FE8] to-[#5B9FFF]"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-white font-black text-sm italic">
                    {user.username?.[0].toUpperCase()}
                  </span>
                )}
              </button>

              {dropdownOpen && (
                <div className="nav-dropdown absolute right-0 mt-4 w-56 rounded-[2rem] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  <div className="p-5 bg-[var(--progress-track)] border-b border-[var(--card-border)]">
                    <p className="text-[var(--text-primary)] font-black text-xs uppercase truncate">
                      {user.displayName || user.username}
                    </p>
                    <p className="text-[var(--text-secondary)] text-[9px] font-black uppercase tracking-widest">
                      Nivel {user.level || 1} • Agente
                    </p>
                  </div>
                  
                  <div className="p-2">
                    <DropdownLink to="/profile" icon={<User size={16} />} text="Mi Expediente" onClick={() => setDropdownOpen(false)} />
                    <DropdownLink to="/settings" icon={<Settings size={16} />} text="Configuración" onClick={() => setDropdownOpen(false)} />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[--text-primary] font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all"
                    >
                      <LogOut size={16} /> Salir del Sistema
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </nav>
    </div>
  );
}

// Subcomponentes para mantener el código limpio
function NavLink({ to, icon, label, color }) {
  return (
    <Link to={to} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--glass-bg)] transition-all group">
      <span className={`${color} group-hover:scale-110 transition-transform`}>{icon}</span>
      <span className="text-[var(--text-primary)] font-black text-[9px] uppercase tracking-widest hidden lg:block">
        {label}
      </span>
    </Link>
  );
}

function DropdownLink({ to, icon, text, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 text-[--text-primary] font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 hover:text-[#2B7FE8] rounded-2xl transition-all"
    >
      {icon} {text}
    </Link>
  );
}