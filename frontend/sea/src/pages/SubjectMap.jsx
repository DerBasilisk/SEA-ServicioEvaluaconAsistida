import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Lock, Star, Zap, Target } from "lucide-react";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

/* ── Status config ── */
const STATUS_CONFIG = {
  completed: {
    base:     "#10b981",
    gradient: "from-emerald-400 to-teal-500",
    glow:     "rgba(16,185,129,0.35)",
    icon:     <Star  size={22} fill="white" className="text-white" />,
    label:    "Completado",
  },
  available: {
    base:     "#2B7FE8",
    gradient: "from-[#2B7FE8] to-[#5B9FFF]",
    glow:     "rgba(43,127,232,0.35)",
    icon:     <Zap   size={22} fill="white" className="text-white" />,
    label:    "Disponible",
  },
  in_progress: {
    base:     "#f59e0b",
    gradient: "from-amber-400 to-orange-500",
    glow:     "rgba(245,158,11,0.35)",
    icon:     <Target size={22} fill="white" className="text-white" />,
    label:    "En Curso",
  },
  locked: {
    base:     "#94a3b8",
    gradient: "from-slate-200 to-slate-300",
    glow:     "transparent",
    icon:     <Lock  size={16} className="text-slate-400" />,
    label:    "Bloqueado",
  },
};

const MAP_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-map { font-family: 'Nunito', sans-serif; }

  .sea-glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 15px 35px var(--glass-shadow);
  }

  /* ── Nodo: gema cuadrada ── */
  .map-node-btn {
    position: relative;
    border-radius: 1.5rem;
    border: 2px solid rgba(255,255,255,0.6);
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1),
                box-shadow 0.35s ease, opacity 0.2s ease;
    /* tamaño: más pequeño en móvil */
    width: 72px; height: 72px;
  }
  @media (min-width: 640px) {
    .map-node-btn { width: 88px; height: 88px; border-radius: 1.75rem; }
  }

  .map-node-btn:not(:disabled):hover {
    transform: translateY(-6px) scale(1.08);
  }
  .map-node-btn:not(:disabled):active {
    transform: scale(0.94);
  }
  .map-node-btn.locked {
    filter: grayscale(1);
    opacity: 0.38;
    transform: scale(0.88);
    cursor: not-allowed;
  }

  /* Brillo de cristal */
  .node-shine {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.45) 0%, transparent 55%);
    pointer-events: none;
  }
  .node-shine-line {
    position: absolute; top: 8px; left: 14px; right: 14px;
    height: 6px; border-radius: 99px;
    background: rgba(255,255,255,0.22);
    filter: blur(1px);
    pointer-events: none;
  }

  /* Glow al hacer hover */
  .map-node-glow {
    position: absolute; inset: -20px;
    border-radius: 50%;
    opacity: 0;
    filter: blur(22px);
    transition: opacity 0.4s ease, transform 0.4s ease;
    pointer-events: none;
    transform: scale(0.7);
  }
  .group:hover .map-node-glow {
    opacity: 0.55;
    transform: scale(1);
  }

  /* Etiqueta bajo el nodo */
  .node-label {
    margin-top: 12px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    padding: 8px 10px;
    text-align: center;
    width: 100%; max-width: 120px;
    transition: border-color 0.25s, box-shadow 0.25s;
  }
  @media (min-width: 640px) {
    .node-label { max-width: 140px; padding: 10px 12px; }
  }
  .group:hover .node-label {
    border-color: var(--text-accent);
    box-shadow: 0 4px 14px var(--glass-shadow);
  }

  /* Conector vertical entre unidades */
  .unit-connector {
    width: 2px;
    background: linear-gradient(to bottom, var(--text-accent), transparent);
    opacity: 0.2;
    margin: 0 auto;
    height: 40px;
  }

  /* Línea decorativa en header de unidad */
  .unit-line {
    flex: 1; height: 1px;
    background: linear-gradient(to right, rgba(43,127,232,0.25), transparent);
  }

  /* Stats pill */
  .stat-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 99px;
    background: var(--card-bg);
    border: 1px solid var(--glass-border);
    font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--text-secondary);
    white-space: nowrap;
  }
`;

/* ── Loading ── */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-gradient)" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#2B7FE8]/20 border-t-[#2B7FE8] rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7A9CC5]">
          Generando Nexo de Aprendizaje…
        </p>
      </div>
    </div>
  );
}

/* ── Página principal ── */
export default function SubjectMap() {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const { fetchMe } = useAuthStore();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/subjects/${slug}`)
      .then(({ data }) => { setSubject(data.data); fetchMe(); })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [slug, navigate, fetchMe]);

  if (loading) return <LoadingScreen />;
  if (!subject) return null;

  /* Estadísticas rápidas */
  const totalLessons     = subject.totalLessons || 0;
  const completedLessons = subject.completedLessons || 0;
  const progressPct      = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen sea-map pb-28 relative overflow-hidden"
         style={{ background: "var(--bg-gradient)" }}>
      <style>{MAP_CSS}</style>
      <Navbar />

      {/* Blobs decorativos */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[-8%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-white/30 blur-[100px]" />
        <div className="absolute bottom-[5%] right-[-5%] w-[280px] sm:w-[400px] h-[280px] sm:h-[400px] rounded-full bg-blue-400/10 blur-[80px]" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 pt-5 sm:pt-10">

        {/* ── HEADER ── */}
        <header className="sea-glass-card rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 mb-10 sm:mb-16">
          {/* Fila superior: icono + texto + botón volver */}
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* Icono de materia */}
              <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 bg-[var(--glass-bg)] rounded-2xl sm:rounded-3xl
                              flex items-center justify-center text-3xl sm:text-5xl
                              border border-[var(--glass-border)] shadow-sm">
                {subject.icon}
              </div>
              {/* Textos */}
              <div className="min-w-0">
                <span className="text-[#2B7FE8] font-black uppercase text-[8px] sm:text-[9px] tracking-[0.35em] block mb-0.5">
                  Módulo de Operaciones
                </span>
                <h1 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter
                                text-[var(--text-primary)] leading-none truncate">
                  {subject.name}
                </h1>
                <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider mt-1 hidden sm:block">
                  {subject.description}
                </p>
              </div>
            </div>

            {/* Botón volver — solo icono en móvil, texto en desktop */}
            <button
              onClick={() => navigate("/")}
              className="shrink-0 flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3
                         bg-[var(--card-bg)] border border-[var(--glass-border)]
                         hover:border-[var(--text-accent)] hover:text-[var(--text-accent)]
                         text-[var(--text-secondary)] rounded-2xl font-black uppercase
                         text-[9px] tracking-widest transition-all group"
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform shrink-0" />
              <span className="hidden sm:inline italic">Volver</span>
            </button>
          </div>

          {/* Barra de progreso + stats — siempre visible */}
          <div className="mt-5 sm:mt-6 space-y-3">
            {/* Pills de stats */}
            <div className="flex flex-wrap gap-2">
              <span className="stat-pill">
                <Star size={11} className="text-emerald-500 fill-emerald-500" />
                {completedLessons} / {totalLessons} lecciones
              </span>
              <span className="stat-pill">
                <Zap size={11} className="text-[#2B7FE8] fill-[#2B7FE8]" />
                {progressPct}% completado
              </span>
              {subject.units?.length > 0 && (
                <span className="stat-pill">
                  <Target size={11} className="text-amber-500" />
                  {subject.units.length} unidades
                </span>
              )}
            </div>
            {/* Barra de progreso */}
            <div className="h-2 w-full bg-black/5 rounded-full border border-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#2B7FE8] to-[#10b981]
                           transition-all duration-1000 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </header>

        {/* ── UNIDADES ── */}
        <div className="space-y-0">
          {subject.units?.map((unit, uIdx) => (
            <div key={unit._id}>
              {/* Conector entre unidades */}
              {uIdx > 0 && <div className="unit-connector mb-0" />}

              <section className="mb-10 sm:mb-16">
                {/* Cabecera de unidad */}
                <div className="flex items-center gap-3 mb-8 sm:mb-12">
                  <div className="bg-[#2B7FE8] text-white px-3 sm:px-4 py-1.5 rounded-xl
                                  text-[9px] font-black italic shadow-md shrink-0">
                    FASE 0{uIdx + 1}
                  </div>
                  <h2 className="text-base sm:text-xl font-black italic uppercase tracking-wider
                                  text-[var(--text-primary)] truncate min-w-0">
                    {unit.name}
                  </h2>
                  <div className="unit-line hidden sm:block" />
                </div>

                {/*
                  GRID RESPONSIVO:
                  - Móvil (<sm):  3 columnas siempre
                  - sm–md:        4 columnas
                  - lg+:          5 columnas
                  gap reducido en móvil para que quepan bien
                */}
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-8 lg:gap-10">
                  {unit.lessons?.map((lesson) => (
                    <GlassNode
                      key={lesson._id}
                      lesson={lesson}
                      onClick={() => navigate(`/lesson/${lesson._id}`)}
                    />
                  ))}
                </div>
              </section>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ── Nodo de lección ── */
function GlassNode({ lesson, onClick }) {
  const config   = STATUS_CONFIG[lesson.status] || STATUS_CONFIG.locked;
  const isLocked = lesson.status === "locked";

  return (
    <div className="relative group flex flex-col items-center">

      {/* Glow de fondo */}
      <div className="map-node-glow" style={{ backgroundColor: config.glow }} />

      {/* Gema / botón */}
      <button
        onClick={() => !isLocked && onClick()}
        disabled={isLocked}
        className={`map-node-btn bg-gradient-to-br ${config.gradient}
                    ${isLocked ? "locked" : "shadow-xl cursor-pointer"}`}
        style={isLocked ? undefined : { boxShadow: `0 8px 24px ${config.glow}` }}
        aria-label={lesson.name}
      >
        {!isLocked && (
          <>
            <div className="node-shine" />
            <div className="node-shine-line" />
          </>
        )}
        <div className="relative z-10 drop-shadow">{config.icon}</div>
      </button>

      {/* Etiqueta */}
      <div className={`node-label ${isLocked ? "opacity-40" : ""}`}>
        <p className={`text-[7px] sm:text-[8px] font-black uppercase tracking-[0.15em] mb-0.5
                       ${isLocked ? "text-slate-400" : "text-[#2B7FE8]"}`}>
          {config.label}
        </p>
        <h3 className={`text-[9px] sm:text-[10px] font-black tracking-tight uppercase italic leading-tight
                        ${isLocked ? "text-slate-400" : "text-[var(--text-primary)]"}`}>
          {lesson.name}
        </h3>
      </div>
    </div>
  );
}