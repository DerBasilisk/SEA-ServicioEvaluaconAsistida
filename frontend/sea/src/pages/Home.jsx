import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus, ChevronRight,
  GraduationCap, Zap,
  Flame, Star, Award, TrendingUp, BookOpen
} from "lucide-react";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import api from "../api/axios";
import Avatar from "../components/Avatar";

/* ─────────────────────────────────────────────
   CSS global del módulo
───────────────────────────────────────────── */
const HOME_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,800;1,900&display=swap');

  .sea-home { font-family: 'Nunito', sans-serif; }

  /* ── Focus visible global: accesibilidad teclado ── */
  .sea-home *:focus-visible {
    outline: 3px solid var(--text-accent);
    outline-offset: 3px;
    border-radius: 0.5rem;
  }

  /* ── Glass cards ── */
  .sea-glass-main {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 8px 32px var(--glass-shadow);
    color: var(--text-primary);
  }
  .sea-sidebar-card {
    background: var(--sidebar-bg);
    border: 1.5px solid var(--sidebar-border);
    backdrop-filter: blur(10px);
  }

  /* ── Hero XP bar ── */
  .xp-bar-track {
    background: rgba(0,0,0,0.08);
    border: 1px solid var(--glass-border);
    border-radius: 99px;
    overflow: hidden;
    height: 12px;
  }
  .xp-bar-fill {
    height: 100%;
    border-radius: 99px;
    background: linear-gradient(90deg, var(--text-accent), #10B981);
    transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ── Número de nivel grande ── */
  .level-display {
    font-size: clamp(2.8rem, 9vw, 5.5rem);
    font-weight: 900;
    font-style: italic;
    line-height: 1;
    letter-spacing: -0.04em;
    color: var(--text-primary);
  }

  /* ── Subject Cards ── */
  .subject-card {
    background: var(--card-bg);
    border: 2px solid var(--card-border);
    border-radius: 1.5rem;
    cursor: pointer;
    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                box-shadow 0.35s ease,
                border-color 0.25s ease;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    text-align: left;
  }
  .subject-card:hover,
  .subject-card:focus-visible {
    transform: translateY(-5px) scale(1.015);
    border-color: var(--text-accent);
    box-shadow: 0 16px 36px var(--glass-shadow);
  }
  .subject-card:active { transform: scale(0.98); }

  /* ── Accent stripe lateral ── */
  .card-stripe {
    position: absolute;
    top: 0; left: 0; bottom: 0;
    width: 5px;
    border-radius: 99px 0 0 99px;
    opacity: 0.85;
  }

  /* ── Add card ── */
  .add-card {
    border: 2px dashed rgba(var(--card-border), 0.4);
    border-color: color-mix(in srgb, var(--text-accent) 25%, transparent);
    border-radius: 1.5rem;
    background: color-mix(in srgb, var(--glass-bg) 60%, transparent);
    cursor: pointer;
    transition: border-color 0.25s, background 0.25s, transform 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    min-height: 80px;
    padding: 1.25rem;
  }
  .add-card:hover, .add-card:focus-visible {
    border-color: var(--text-accent);
    background: color-mix(in srgb, var(--text-accent) 8%, transparent);
    transform: scale(1.01);
  }

  /* ── Leaderboard item ── */
  .rank-item {
    border-radius: 1rem;
    padding: 0.6rem 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    transition: background 0.2s;
  }
  .rank-item:hover { background: rgba(255,255,255,0.08); }

  /* ── Stat pill ── */
  .stat-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.75rem;
    border-radius: 99px;
    font-size: 0.65rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.3);
  }

  /* ── Skeleton loader ── */
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .skeleton {
    border-radius: 1rem;
    background: linear-gradient(90deg,
      rgba(255,255,255,0.06) 25%,
      rgba(255,255,255,0.14) 50%,
      rgba(255,255,255,0.06) 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s infinite;
  }

  /* ── Responsive grid ── */
  @media (max-width: 1023px) {
    .subject-card { border-radius: 1.25rem; }
  }
  @media (max-width: 639px) {
    .add-card { min-height: 64px; }
  }

  /* ── Progress circle rotate ── */
  .prog-svg { transform: rotate(-90deg); }

  /* ── Entrada suave ── */
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-in { animation: fadeSlideUp 0.45s ease both; }
  .delay-1 { animation-delay: 0.08s; }
  .delay-2 { animation-delay: 0.16s; }
  .delay-3 { animation-delay: 0.24s; }
  .delay-4 { animation-delay: 0.32s; }
`;

/* ─────────────────────────────────────────────
   Componente principal
───────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [subjects,    setSubjects]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, leadRes] = await Promise.all([
          api.get("/subjects"),
          api.get("/friends/leaderboard"),
        ]);
        const allSubjects = subRes.data.data || [];
        const myActiveMissions = allSubjects.filter(sub =>
          user?.favoriteSubjects?.some(fav => (fav._id || fav) === sub._id)
        );
        setSubjects(myActiveMissions);
        setLeaderboard(leadRes.data.data?.slice(0, 5) || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user?.favoriteSubjects]);

  const xpProgress  = user ? Math.min(100, (user.xp / 1000) * 100) : 0;
  const currentLevel = user?.level || 1;
  const nextLevel    = currentLevel + 1;

  return (
    <div
      className="sea-home min-h-screen pb-24 lg:pb-10 relative overflow-x-hidden"
      style={{ background: "var(--bg-gradient)", color: "var(--text-primary)" }}
    >
      <style>{HOME_CSS}</style>

      {/* Blobs decorativos */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-8%] left-[-12%] w-[280px] sm:w-[520px] lg:w-[700px] h-[280px] sm:h-[520px] lg:h-[700px] rounded-full"
          style={{ background: "var(--deco-blob)", filter: "blur(90px)" }} />
        <div className="absolute bottom-[-8%] right-[-12%] w-[240px] sm:w-[480px] lg:w-[600px] h-[240px] sm:h-[480px] lg:h-[600px] rounded-full"
          style={{ background: "var(--deco-blob2)", filter: "blur(100px)" }} />
      </div>

      <Navbar />

      {/*
        Layout:
        - Móvil (<lg):   1 columna, orden Hero → Ranking → Misiones → Perfil
        - Desktop (≥lg): 3 columnas 2|8|2 → Perfil | Centro | Ranking
      */}
      <main
        id="main-content"
        className="w-full max-w-[1600px] mx-auto px-3 sm:px-5 pt-4 sm:pt-6 relative z-10
                   grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6"
        aria-label="Panel principal"
      >

        {/* ════════════════════════════════
            PANEL PERFIL  (orden 4 móvil | col 1 desktop)
        ════════════════════════════════ */}
        <aside
          className="lg:col-span-2 order-4 lg:order-1 flex flex-col gap-3"
          aria-label="Perfil de usuario"
        >
          {/* Card de usuario */}
          <section
            className="sea-glass-main rounded-2xl lg:rounded-[2rem] p-4 animate-in delay-4
                       flex flex-row lg:flex-col items-center lg:items-center gap-4 lg:gap-3 lg:text-center"
          >
            {/* Avatar */}
            <div className="shrink-0 relative">
              <div className="w-14 h-14 lg:w-18 lg:h-18 rounded-2xl overflow-hidden border-2"
                style={{ borderColor: "var(--text-accent)" }}>
                <Avatar
                  src={user?.avatar}
                  name={user?.displayName}
                  size="xl"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Indicador de racha superpuesto */}
              {user?.streak?.current > 0 && (
                <div
                  className="absolute -bottom-1.5 -right-1.5 flex items-center gap-0.5
                             px-1.5 py-0.5 rounded-full text-[9px] font-black"
                  style={{ background: "#f97316", color: "white" }}
                  aria-label={`Racha de ${user.streak.current} días`}
                >
                  <Flame size={9} fill="white" />
                  {user.streak.current}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 lg:w-full">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">Agente</p>
              <h2 className="font-black italic uppercase tracking-tighter text-base lg:text-lg
                             leading-tight truncate lg:whitespace-normal" title={user?.username}>
                {user?.username}
              </h2>

              {/* Stats en línea */}
              <div className="flex lg:flex-col gap-2 mt-2.5">
                <span className="stat-pill" aria-label={`Racha de ${user?.streak?.current || 0} días`}>
                  <Flame size={11} style={{ color: "#f97316", fill: "#f97316" }} />
                  {user?.streak?.current || 0} días
                </span>
                <span className="stat-pill" aria-label={`Nivel ${currentLevel}`}>
                  <Zap size={11} fill="currentColor" style={{ color: "var(--text-accent)" }} />
                  Lvl {currentLevel}
                </span>
              </div>
            </div>

            {/* Botón expediente — desktop */}
            <Link
              to="/profile"
              className="hidden lg:flex w-full items-center justify-center gap-2 py-2.5 rounded-xl
                         font-black text-[10px] uppercase tracking-widest transition-all
                         hover:opacity-90 hover:scale-[1.02] mt-1"
              style={{ background: "var(--text-accent)", color: "white" }}
              aria-label="Ver mi expediente completo"
            >
              Expediente <ChevronRight size={12} aria-hidden="true" />
            </Link>
          </section>

          {/* Medallas — solo desktop */}
          {user?.achievements?.length > 0 && (
            <section
              className="sea-sidebar-card rounded-[2rem] p-4 hidden lg:block animate-in delay-4"
              aria-label="Medallas obtenidas"
            >
              <h3 className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-3">
                <Award size={12} style={{ color: "var(--text-accent)" }} aria-hidden="true" />
                Medallas
              </h3>
              <div className="grid grid-cols-3 gap-2" role="list">
                {user.achievements.slice(0, 6).map((ach, idx) => (
                  <div
                    key={idx}
                    role="listitem"
                    title={ach.name || "Medalla"}
                    className="aspect-square bg-white/10 rounded-xl flex items-center justify-center
                               text-xl border-2 border-white/20 cursor-default"
                    aria-label={ach.name || `Medalla ${idx + 1}`}
                  >
                    {ach.icon}
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>

        {/* ════════════════════════════════
            CENTRO: Hero + Misiones  (orden 1 móvil | col 2 desktop)
        ════════════════════════════════ */}
        <section className="lg:col-span-8 order-1 lg:order-2 flex flex-col gap-4 lg:gap-6">

          {/* ── Hero de nivel ── */}
          <section
            className="sea-glass-main rounded-2xl lg:rounded-[2.5rem] p-5 sm:p-7 relative overflow-hidden animate-in"
            aria-label={`Estado actual: Nivel ${currentLevel}, ${user?.xp || 0} XP`}
          >
            {/* Ícono decorativo */}
            <GraduationCap
              size={180}
              aria-hidden="true"
              className="absolute -top-4 -right-6 opacity-[0.04] rotate-12 pointer-events-none"
              style={{ color: "var(--text-primary)" }}
            />

            <div className="relative z-10 flex items-start justify-between gap-4">
              {/* Nivel */}
              <div>
                <div
                  className="stat-pill mb-2"
                  style={{ color: "var(--text-accent)" }}
                  aria-hidden="true"
                >
                  <Zap size={10} fill="currentColor" /> Estatus
                </div>
                <p className="level-display" aria-label={`Nivel ${currentLevel}`}>
                  Nivel {currentLevel}
                </p>
              </div>

              {/* XP */}
              <div className="text-right shrink-0">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">
                  Meta: Lvl {nextLevel}
                </p>
                <p
                  className="text-3xl sm:text-4xl font-black italic"
                  style={{ color: "var(--text-accent)" }}
                  aria-label={`${user?.xp || 0} de 1000 XP`}
                >
                  {user?.xp || 0}
                  <span className="text-sm not-italic opacity-50"> / 1000 XP</span>
                </p>
              </div>
            </div>

            {/* Barra XP */}
            <div className="mt-5 space-y-1.5">
              <div
                className="xp-bar-track"
                role="progressbar"
                aria-valuenow={user?.xp || 0}
                aria-valuemin={0}
                aria-valuemax={1000}
                aria-label={`Progreso XP: ${Math.round(xpProgress)}%`}
              >
                <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-black opacity-40 px-0.5">
                <span>Lvl {currentLevel}</span>
                <span>{Math.round(xpProgress)}%</span>
                <span>Lvl {nextLevel}</span>
              </div>
            </div>
          </section>

          {/* ── Cabecera Misiones ── */}
          <div className="flex items-center justify-between px-1 animate-in delay-1">
            <div className="flex items-center gap-2.5">
              <div
                className="w-1 h-8 rounded-full"
                style={{ background: "var(--text-accent)" }}
                aria-hidden="true"
              />
              <h2 className="text-2xl lg:text-3xl font-black italic uppercase tracking-tighter">
                Misiones
              </h2>
            </div>
            <span
              className="text-[10px] font-black uppercase tracking-widest opacity-40"
              aria-label={`${subjects.length} materias activas`}
            >
              {subjects.length} {subjects.length === 1 ? "materia" : "materias"}
            </span>
          </div>

          {/* ── Grid de materias ── */}
          {loading ? (
            <SkeletonGrid />
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4 animate-in delay-2"
              role="list"
              aria-label="Lista de materias activas"
            >
              {subjects.map((subject, i) => (
                <SubjectCard
                  key={subject._id}
                  subject={subject}
                  onClick={() => navigate(`/subject/${subject.slug}`)}
                  animDelay={i * 0.06}
                />
              ))}

              {/* Botón añadir */}
              <button
                onClick={() => navigate("/subject-catalog")}
                className="add-card group"
                aria-label="Añadir nueva materia al catálogo"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center
                             border-2 transition-all group-hover:scale-110 group-hover:rotate-90"
                  style={{
                    borderColor: "var(--text-accent)",
                    color: "var(--text-accent)",
                  }}
                >
                  <Plus size={18} aria-hidden="true" />
                </div>
                <span
                  className="text-[11px] font-black uppercase tracking-widest"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Añadir materia
                </span>
              </button>
            </div>
          )}

          {/* Estado vacío */}
          {!loading && subjects.length === 0 && (
            <EmptyMissions onAdd={() => navigate("/subject-catalog")} />
          )}
        </section>

        {/* ════════════════════════════════
            RANKING  (orden 2 móvil | col 3 desktop)
        ════════════════════════════════ */}
        <aside
          className="lg:col-span-2 order-2 lg:order-3"
          aria-label="Tabla de clasificación"
        >
          <section className="sea-sidebar-card rounded-2xl lg:rounded-[2rem] p-4 lg:p-5 animate-in delay-1">
            <h3
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest opacity-60 mb-3"
              id="leaderboard-heading"
            >
              <Star size={12} style={{ color: "#f59e0b", fill: "#f59e0b" }} aria-hidden="true" />
              TOP Rango
            </h3>

            {/* Móvil: scroll horizontal | Desktop: columna */}
            <div
              className="flex flex-row lg:flex-col gap-2 lg:gap-1
                         overflow-x-auto pb-1 lg:pb-0
                         [scrollbar-width:none] [-ms-overflow-style:none]
                         [&::-webkit-scrollbar]:hidden"
              role="list"
              aria-labelledby="leaderboard-heading"
            >
              {leaderboard.length === 0 && (
                <p className="text-[11px] opacity-40 font-bold py-2 shrink-0">
                  Sin datos aún
                </p>
              )}
              {leaderboard.map((entry, i) => {
                const isFirst = i === 0;
                const barW    = Math.min(100, (entry.xpEarned / 1000) * 100);
                return (
                  <div
                    key={entry.user._id}
                    role="listitem"
                    className="rank-item shrink-0 lg:shrink min-w-[150px] lg:min-w-0"
                    aria-label={`Posición ${i + 1}: ${entry.user.displayName}, ${entry.xpEarned} XP`}
                  >
                    {/* Badge posición */}
                    <div
                      className="w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black"
                      style={{
                        background: isFirst ? "var(--rank-1-bg)" : "var(--rank-n-bg)",
                        color:      isFirst ? "var(--rank-1-text)" : "var(--rank-n-text)",
                      }}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase truncate leading-tight">
                        {entry.user.displayName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div
                          className="h-1.5 flex-1 rounded-full overflow-hidden"
                          style={{ background: "rgba(0,0,0,0.1)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${barW}%`,
                              background: isFirst
                                ? "linear-gradient(90deg,#f59e0b,#f97316)"
                                : "var(--text-accent)",
                            }}
                          />
                        </div>
                        <span
                          className="text-[9px] font-black shrink-0"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {entry.xpEarned}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SubjectCard — responsive mejorada
───────────────────────────────────────────── */
function SubjectCard({ subject, onClick, animDelay = 0 }) {
  const progress    = subject.progressPercent || 0;
  const accentColor = subject.color || "#2B7FE8";

  return (
    <button
      onClick={onClick}
      className="subject-card"
      style={{ animationDelay: `${animDelay}s`, borderColor: subject.color }}
      role="listitem"
      aria-label={`${subject.name}: ${progress}% completado, ${subject.completedLessons} de ${subject.totalLessons} lecciones`}
    >
      {/* Stripe lateral de color */}
      <div className="card-stripe" style={{ backgroundColor: accentColor }} aria-hidden="true" />

      {/* Contenido: fila compacta en móvil, columna en sm+ */}
      <div className="flex flex-row sm:flex-col gap-3 sm:gap-0 p-4 sm:p-5 lg:p-6 pl-5 sm:pl-5 lg:pl-6 h-full">

        {/* ── Móvil: círculo progreso + emoji ── */}
        <div className="sm:hidden shrink-0 self-center">
          <ProgressCircle progress={progress} color={accentColor} size={52}>
            <span className="text-base" aria-hidden="true">{subject.icon || "📚"}</span>
          </ProgressCircle>
        </div>

        {/* ── Desktop: emoji en bloque ── */}
        <div
          className="hidden sm:flex mb-4 w-12 h-12 lg:w-14 lg:h-14 rounded-2xl items-center justify-center text-2xl lg:text-3xl
                     border-2 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
          style={{
            background:   "var(--glass-bg)",
            borderColor:  "var(--glass-border)",
          }}
          aria-hidden="true"
        >
          {subject.icon || "📚"}
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0 flex flex-col">
          <h3
            className="font-black italic uppercase tracking-tighter leading-tight
                       text-sm sm:text-lg lg:text-xl mb-0.5 sm:mb-1
                       truncate sm:whitespace-normal"
            style={{ color: "var(--text-primary)" }}
          >
            {subject.name}
          </h3>

          {/* Descripción — solo sm+ */}
          {subject.description && (
            <p
              className="hidden sm:block text-sm font-semibold leading-snug mb-3 line-clamp-2 flex-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {subject.description}
            </p>
          )}

          {/* Etiqueta de lecciones */}
          <span
            className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border-2 self-start"
            style={{
              backgroundColor: accentColor + "18",
              borderColor:     accentColor + "35",
              color:           accentColor,
            }}
            aria-hidden="true"
          >
            <BookOpen size={9} />
            {subject.completedLessons}/{subject.totalLessons}
            <span className="hidden sm:inline"> lecciones</span>
          </span>

          {/* Barra progreso — solo sm+ */}
          <div className="hidden sm:block mt-auto pt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[10px] font-black"
                style={{ color: accentColor }}
              >
                {progress}%
              </span>
              <ChevronRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
                style={{ color: "var(--text-secondary)" }}
                aria-hidden="true"
              />
            </div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 6, background: "var(--progress-bar-bg)" }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${progress}%`, backgroundColor: accentColor }}
              />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────
   ProgressCircle — solo móvil en SubjectCard
───────────────────────────────────────────── */
function ProgressCircle({ progress, color, size = 52, children }) {
  const stroke       = 3.5;
  const radius       = size / 2 - stroke;
  const circumference = 2 * Math.PI * radius;
  const offset       = circumference * (1 - progress / 100);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="prog-svg">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(0,0,0,0.07)"
          strokeWidth={stroke}
          fill="rgba(255,255,255,0.3)"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color || "#2B7FE8"}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Skeleton loader para la grid de materias
───────────────────────────────────────────── */
function SkeletonGrid() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4"
      aria-label="Cargando materias…"
      aria-busy="true"
    >
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 160 }} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Estado vacío — sin misiones
───────────────────────────────────────────── */
function EmptyMissions({ onAdd }) {
  return (
    <div
      className="sea-glass-main rounded-2xl p-8 text-center flex flex-col items-center gap-4 animate-in delay-2"
      role="status"
      aria-live="polite"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: "var(--glass-bg)", border: "1.5px solid var(--glass-border)" }}
        aria-hidden="true"
      >
        🎯
      </div>
      <div>
        <p className="font-black text-lg italic uppercase tracking-tight mb-1">
          Sin misiones activas
        </p>
        <p className="text-sm font-semibold opacity-50 max-w-[240px] mx-auto leading-snug">
          Elige tus materias favoritas y comienza a aprender
        </p>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm
                   uppercase tracking-widest transition-all hover:opacity-90 hover:scale-[1.02]"
        style={{ background: "var(--text-accent)", color: "white" }}
        aria-label="Ir al catálogo de materias"
      >
        <Plus size={15} aria-hidden="true" />
        Explorar catálogo
      </button>
    </div>
  );
}