import { useState, useEffect, useCallback } from "react";
// Importaciones críticas de React Router
import { Link, useNavigate, useLocation } from "react-router-dom"; 
import { Heart, Diamond, Flame, Trophy, Users, LogOut } from "lucide-react";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

// ── CSS Personalizado para la estética SEA ────────────────────────────────────
const FLUENT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
  .sea-nav { font-family: 'Nunito', sans-serif; }

  @keyframes nav-fadeDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes heart-bounce {
    0%,100% { transform: translateY(0);  }
    50%      { transform: translateY(-3px); }
  }

  .sea-nav-wrap  { animation: nav-fadeDown .4s ease both; }
  .sea-glass     {
    background: rgba(255,255,255,0.55);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid rgba(255,255,255,0.72);
    box-shadow: 0 8px 24px rgba(43,127,232,.1), inset 0 1px 0 rgba(255,255,255,.85);
  }
  .sea-glass-scrolled {
    box-shadow: 0 12px 40px rgba(43,127,232,.18), inset 0 1px 0 rgba(255,255,255,.9);
  }
  .sea-logo-shadow {
    box-shadow: 0 4px 14px rgba(43,127,232,.35), inset 0 1px 0 rgba(255,255,255,.25);
  }
  .sea-avatar-shadow {
    box-shadow: 0 4px 12px rgba(43,127,232,.25);
  }
  .sea-avatar-shadow:hover {
    box-shadow: 0 0 0 3px rgba(43,127,232,.3), 0 4px 16px rgba(43,127,232,.2);
  }
  .sea-heart-bounce { animation: heart-bounce 1s ease-in-out infinite; }
  .sea-btn-active {
    background: #2B7FE8 !important;
    color: #fff !important;
    box-shadow: 0 4px 12px rgba(43,127,232,.35);
  }
`;

export default function Navbar() {
  const navigate = useNavigate(); // Ahora sí está definido e importado
  const location = useLocation();
  const { user, token, logout, fetchMe } = useAuthStore();

  const [refilling, setRefilling] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Sincronizar al cambiar de ruta
  useEffect(() => {
    if (token) fetchMe();
  }, [location.pathname, token, fetchMe]);

  // Detector de Scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const handleRefill = useCallback(async () => {
    if (refilling || (user?.gems ?? 0) < 50) return;
    setRefilling(true);
    try {
      await api.post("/progress/refill-hearts");
      await fetchMe();
    } catch (err) {
      alert(err.response?.data?.message || "Error al recargar");
    } finally {
      setRefilling(false);
    }
  }, [refilling, user?.gems, fetchMe]);

  if (location.pathname.startsWith("/lesson/")) return null;

  // ── EXTRACCIÓN SEGURA DE DATOS (Evita el error de objetos) ──
  const hearts    = user?.hearts?.current ?? 0;
  const gems      = user?.gems ?? 0;
  const streak    = user?.streak?.current ?? 0;
  const initials  = (user?.displayName || user?.username || "?")[0].toUpperCase();
  const canRefill = hearts < 5 && gems >= 50;
  const isLeague  = location.pathname === "/league";
  const isFriends = location.pathname === "/friends";

  return (
    <>
      <style>{FLUENT_CSS}</style>

      <div className="sea-nav fixed top-0 left-0 right-0 z-[200] pointer-events-none">
        <div className={`sea-nav-wrap pointer-events-auto mx-auto px-4 transition-all duration-350 ${
            scrolled ? "max-w-3xl mt-2" : "max-w-4xl mt-3"
          }`}
        >
          <div className={`sea-glass flex items-center justify-between gap-3 transition-all duration-350 ${
              scrolled ? "sea-glass-scrolled rounded-[18px] px-4 py-2" : "rounded-[22px] px-5 py-2.5"
            }`}
          >
            {/* LOGO */}
            <Link to="/" className="flex items-center gap-2 no-underline flex-shrink-0 group">
              <div
                className={`sea-logo-shadow flex items-center justify-center rounded-[10px] font-black italic text-white transition-all duration-350 group-hover:scale-105 ${
                  scrolled ? "w-8 h-8 text-[11px]" : "w-9 h-9 text-[13px]"
                }`}
                style={{ background: "linear-gradient(135deg,#2B7FE8,#6B9FFF)" }}
              >
                SEA
              </div>
              {!scrolled && (
                <div className="leading-none hidden sm:block">
                  <p className="text-[13px] font-extrabold text-[#0F2547] tracking-tight m-0 uppercase">SEA</p>
                  <p className="text-[9px] font-semibold text-[#7A9CC5] tracking-wider m-0">SENA · ADSO</p>
                </div>
              )}
            </Link>

            {/* SECCIÓN DE USUARIO */}
            {user && (
              <div className="flex items-center gap-2">
                {/* Navegación */}
                <div className="flex items-center gap-1 bg-white/40 border border-white/60 rounded-[10px] p-1">
                  <Link to="/league" title="Ranking" className={`flex p-1.5 rounded-lg transition-all ${isLeague ? "sea-btn-active" : "text-[#7A9CC5] hover:text-[#2B7FE8]"}`}>
                    <Trophy size={scrolled ? 14 : 16} />
                  </Link>
                  <Link to="/friends" title="Amigos" className={`flex p-1.5 rounded-lg transition-all ${isFriends ? "sea-btn-active" : "text-[#7A9CC5] hover:text-[#2B7FE8]"}`}>
                    <Users size={scrolled ? 14 : 16} />
                  </Link>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2.5 bg-white/45 border border-white/65 rounded-xl px-3 py-1.5">
                  <div className="flex items-center gap-1" title="Racha">
                    <Flame size={15} className="text-orange-500" fill="currentColor" />
                    <span className="text-xs font-extrabold text-[#0F2547]">{streak}</span>
                  </div>
                  <div className="w-px h-3.5 bg-blue-200/50" />
                  <div className="flex items-center gap-1" title="Gemas">
                    <Diamond size={15} className="text-cyan-500" fill="currentColor" />
                    <span className="text-xs font-extrabold text-[#0F2547]">{gems}</span>
                  </div>
                  <div className="w-px h-3.5 bg-blue-200/50" />
                  <button
                    onClick={handleRefill}
                    disabled={!canRefill || refilling}
                    className={`flex items-center gap-1 bg-transparent border-none p-0 transition-all ${canRefill ? "cursor-pointer hover:scale-110" : "cursor-default opacity-70"}`}
                  >
                    <Heart
                      size={15}
                      className={`${hearts === 0 ? "text-slate-400" : "text-rose-500"} ${canRefill ? "sea-heart-bounce" : ""}`}
                      fill="currentColor"
                    />
                    <span className={`text-xs font-extrabold ${canRefill ? "text-[#2B7FE8]" : "text-[#0F2547]"}`}>
                      {hearts}
                    </span>
                  </button>
                </div>

                {/* Perfil */}
                <Link to="/profile" className="no-underline">
                  <div
                    className={`sea-avatar-shadow flex items-center justify-center rounded-full font-extrabold text-white border-2 border-white/75 transition-all ${
                      scrolled ? "w-8 h-8 text-[11px]" : "w-9 h-9 text-[13px]"
                    }`}
                    style={{ background: "linear-gradient(135deg,#2B7FE8,#8BAEFF)" }}
                  >
                    {initials}
                  </div>
                </Link>

                {!scrolled && (
                  <button onClick={handleLogout} className="flex p-1.5 rounded-lg bg-transparent border-none cursor-pointer text-[#7A9CC5] hover:text-rose-500 transition-all">
                    <LogOut size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}