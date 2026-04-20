import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Plus, ChevronRight, 
  GraduationCap, Zap,
  Flame, Star, Award
} from "lucide-react";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import api from "../api/axios";
import Avatar from "../components/Avatar";

const HOME_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-home { font-family: 'Nunito', sans-serif; }
  
  .sea-glass-main {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 20px 50px var(--glass-shadow);
    color: var(--text-primary);
  }

  .subject-card {
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .subject-card h3 { color: var(--text-primary); }
  .subject-card p  { color: var(--text-secondary); }

  .subject-card:hover {
    transform: translateY(-6px) scale(1.02);
    border-color: var(--text-accent);
    box-shadow: 0 15px 30px var(--glass-shadow);
  }

  .progress-bar-inner {
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sea-sidebar-card {
    background: var(--sidebar-bg);
    border: 1.5px solid var(--sidebar-border);
    backdrop-filter: blur(10px);
  }

  /* ── HERO LEVEL: fuente grande sólo en desktop ── */
  .level-number {
    font-size: clamp(3rem, 10vw, 6rem);
    font-weight: 900;
    font-style: italic;
    line-height: 1;
    letter-spacing: -0.04em;
    text-transform: uppercase;
  }

  /* ── SUBJECT CARD en móvil: fila compacta ── */
  @media (max-width: 639px) {
    .subject-card {
      border-radius: 1.25rem;
      padding: 0.75rem 1rem 0.75rem 1.25rem;
    }
    .subject-card:hover {
      transform: translateY(-3px) scale(1.01);
    }
  }
`;

export default function Home() {
  const navigate   = useNavigate();
  const { user }   = useAuthStore();
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

  const progress = user ? Math.min(100, (user.xp / 1000) * 100) : 0;

  return (
    <div
      className="sea-home min-h-screen pb-16 relative overflow-hidden"
      style={{ background: "var(--bg-gradient)", color: "var(--text-primary)" }}
    >
      <style>{HOME_CSS}</style>

      {/* Blobs decorativos */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[-10%] w-[300px] md:w-[700px] h-[300px] md:h-[700px] rounded-full bg-[var(--deco-blob)] blur-[80px] md:blur-[140px]" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[250px] md:w-[600px] h-[250px] md:h-[600px] rounded-full bg-[var(--deco-blob2)] blur-[80px] md:blur-[140px]" />
      </div>

      <Navbar />

      {/*
        Layout general:
        - Móvil  (<lg): 1 columna, orden: Hero → Misiones → Perfil → Ranking
        - Desktop (≥lg): 3 columnas [2 | 8 | 2] (perfil | centro | ranking)
      */}
      <main className="w-full mx-auto px-3 sm:px-5 pt-5 relative z-10
                        grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 max-w-[1600px]">

        {/* ── PERFIL ── orden-3 en móvil → orden-1 en desktop */}
        <aside className="lg:col-span-2 order-3 lg:order-1 space-y-4">

          {/* Card de usuario: horizontal en móvil, vertical en desktop */}
          <section className="sea-glass-main rounded-2xl lg:rounded-[2rem] p-4 lg:p-5
                               flex flex-row lg:flex-col items-center lg:text-center gap-4 lg:gap-0">
            <div className="w-14 h-14 lg:w-20 lg:h-20 shrink-0 lg:mx-auto lg:mb-3">
              <Avatar
                src={user?.avatar}
                name={user?.displayName}
                size="xl"
                className="rounded-2xl border-2 border-white/50 shadow-lg w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 lg:w-full">
              <h2 className="text-sm lg:text-base font-black italic uppercase tracking-tighter leading-tight truncate lg:whitespace-normal lg:mb-3">
                Agente {user?.username}
              </h2>
              {/* Streak */}
              <div className="inline-flex lg:w-full items-center justify-center gap-2 px-3 py-1.5 rounded-xl
                              bg-white/20 border border-white/30 lg:mb-3">
                <Flame className="text-orange-500 fill-orange-500 shrink-0" size={13} />
                <p className="text-[10px] font-black uppercase">{user?.streak?.current || 0} Días</p>
              </div>
            </div>
            {/* Botón expediente: solo visible en desktop para no saturar móvil */}
            <Link
              to="/profile"
              className="hidden lg:flex w-full items-center justify-center gap-2 py-2.5 rounded-xl
                         bg-[var(--text-accent)] text-white font-black text-[10px] uppercase tracking-widest
                         hover:scale-[1.02] transition-transform"
            >
              Expediente <ChevronRight size={12} />
            </Link>
          </section>

          {/* Medallas — solo desktop */}
          <section className="sea-sidebar-card rounded-[2rem] p-5 hidden lg:block">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-4 flex items-center gap-2">
              <Award size={13} className="text-[var(--text-accent)]" /> Medallas
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {user?.achievements?.slice(0, 3).map((ach, idx) => (
                <div
                  key={idx}
                  className="aspect-square bg-white/10 rounded-xl flex items-center justify-center text-lg border border-white/20"
                >
                  {ach.icon}
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* ── CENTRO: Hero + Misiones ── orden-1 en móvil → orden-2 en desktop */}
        <section className="lg:col-span-8 order-1 lg:order-2 space-y-4 lg:space-y-6">

          {/* Hero de nivel */}
          <section className="sea-glass-main rounded-2xl lg:rounded-[3rem] p-5 sm:p-7 lg:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-[0.04] rotate-12 pointer-events-none text-[var(--text-primary)]">
              <GraduationCap size={160} />
            </div>

            <div className="flex flex-row items-center justify-between relative z-10 gap-3">
              {/* Nivel */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--text-accent)]/20 text-[var(--text-accent)] mb-2">
                  <Zap size={11} fill="currentColor" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Estatus</span>
                </div>
                <p className="level-number">NIVEL {user?.level || 1}</p>
              </div>
              {/* XP */}
              <div className="text-right shrink-0">
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-0.5">
                  Meta: Lvl {(user?.level || 1) + 1}
                </p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-black italic text-[var(--text-accent)]">
                  {user?.xp || 0}
                  <span className="text-xs sm:text-sm lg:text-base not-italic opacity-60"> / 1000 XP</span>
                </p>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="h-4 lg:h-6 w-full bg-black/5 rounded-full p-0.5 border border-white/20 mt-5">
              <div
                className="progress-bar-inner h-full bg-gradient-to-r from-[var(--text-accent)] to-[#10B981] rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          {/* Cabecera de misiones */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-7 lg:w-1.5 lg:h-8 bg-[var(--text-accent)] rounded-full" />
              <h2 className="text-2xl lg:text-4xl font-black uppercase italic tracking-tighter">Misiones</h2>
            </div>
            <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">
              {subjects.length} Materias
            </span>
          </div>

          {/* Grid de materias
              Móvil: 1 col  |  sm: 2 col  |  lg: 2 col  |  xl: 3 col */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-5">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject._id}
                subject={subject}
                onClick={() => navigate(`/subject/${subject.slug}`)}
              />
            ))}

            {/* Botón añadir materia */}
            <button
              onClick={() => navigate("/subject-catalog")}
              className="border-2 border-dashed border-white/10 rounded-[1.5rem] lg:rounded-[2.5rem]
                         p-5 lg:p-8 flex items-center justify-center gap-3 group
                         hover:border-[var(--text-accent)]/50 transition-all bg-white/5
                         min-h-[72px] lg:min-h-[unset]"
            >
              <div className="w-9 h-9 lg:w-12 lg:h-12 rounded-full bg-white/10 flex items-center justify-center
                              group-hover:scale-110 transition-transform">
                <Plus size={18} className="text-[var(--text-secondary)]" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-[var(--text-secondary)]
                               sm:hidden lg:hidden">
                Añadir materia
              </span>
            </button>
          </div>
        </section>

        {/* ── RANKING ── orden-2 en móvil (debajo del hero) → orden-3 en desktop */}
        <aside className="lg:col-span-2 order-2 lg:order-3">
          <section className="sea-sidebar-card rounded-2xl lg:rounded-[2rem] p-4 lg:p-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3 lg:mb-4 flex items-center gap-2">
              <Star size={13} className="text-yellow-500 fill-yellow-500" /> TOP Rango
            </h3>

            {/*
              Móvil: fila horizontal scrolleable
              Desktop (lg+): columna vertical
            */}
            <div className="flex flex-row lg:flex-col gap-2 lg:gap-3 overflow-x-auto pb-1 lg:pb-0
                            scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
              {leaderboard.map((entry, i) => (
                <div
                  key={entry.user._id}
                  className="flex items-center gap-2.5 shrink-0 lg:shrink
                             bg-white/5 lg:bg-transparent
                             px-3 py-2 lg:p-0
                             rounded-xl lg:rounded-none
                             min-w-[140px] lg:min-w-0"
                >
                  <div className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black
                                   ${i === 0 ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-500"}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black truncate uppercase">{entry.user.displayName}</p>
                    <div className="h-1 w-full bg-black/10 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-[var(--text-accent)]"
                        style={{ width: `${(entry.xpEarned / 1000) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>

      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SubjectCard
   - Móvil (<sm): fila compacta con círculo de progreso
   - Desktop (≥md): card vertical con barra de progreso
═══════════════════════════════════════════════════════ */
function SubjectCard({ subject, onClick }) {
  const progress = subject.progressPercent || 0;

  return (
    <button
      onClick={onClick}
      className="subject-card rounded-[1.25rem] sm:rounded-[2rem] lg:rounded-[2.5rem]
                 p-3 sm:p-5 lg:p-8 text-left relative overflow-hidden group
                 shadow-sm flex flex-col h-full"
    >
      {/* Franja de color lateral */}
      <div
        className="absolute top-0 left-0 bottom-0 w-1.5 lg:w-2 opacity-80"
        style={{ backgroundColor: subject.color || "#2B7FE8" }}
      />

      {/* Contenido: fila en móvil, columna en desktop */}
      <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-0 h-full pl-1">

        {/* Icono + círculo progreso móvil */}
        <div className="md:hidden relative shrink-0">
          <ProgressCircle progress={progress} color={subject.color} size={56}>
            <span className="text-lg">{subject.icon || "📚"}</span>
          </ProgressCircle>
        </div>

        {/* Icono desktop */}
        <div className="hidden md:block p-3 lg:p-4 bg-[--glass-bg] rounded-[1.5rem] lg:rounded-[1.8rem]
                        group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 mb-5">
          <span className="text-3xl lg:text-4xl">{subject.icon || "📚"}</span>
        </div>

        {/* Textos */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[var(--text-primary)] font-black text-sm md:text-xl lg:text-2xl
                         italic uppercase tracking-tighter leading-tight
                         truncate md:whitespace-normal md:mb-2">
            {subject.name}
          </h3>
          <p className="hidden md:block text-[var(--text-secondary)] text-sm font-bold mb-5 line-clamp-2">
            {subject.description}
          </p>

          <span
            className="inline-block text-[9px] font-black px-2 py-0.5 rounded-full border mt-1 md:mt-0"
            style={{
              backgroundColor: subject.color + "15",
              borderColor:     subject.color + "30",
              color:           subject.color,
            }}
          >
            {subject.completedLessons}/{subject.totalLessons}{" "}
            <span className="hidden md:inline">Lecciones</span>
          </span>
        </div>

        {/* Barra de progreso desktop */}
        <div className="hidden md:block w-full mt-auto pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">{progress}%</span>
            <ChevronRight className="text-[var(--text-secondary)] group-hover:translate-x-1 transition-transform" size={15} />
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 p-0.5 border border-slate-50 shadow-inner">
            <div
              className="h-full rounded-full progress-bar-inner"
              style={{ width: `${progress}%`, backgroundColor: subject.color || "#2B7FE8" }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   ProgressCircle — usado en SubjectCard móvil
═══════════════════════════════════════════════════════ */
function ProgressCircle({ progress, color, size = 56, children }) {
  const stroke       = 4;
  const radius       = (size / 2) - (stroke / 2);
  const circumference = radius * 2 * Math.PI;
  const offset       = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={stroke}
          fill="rgba(255,255,255,0.35)"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color || "#2B7FE8"}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
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