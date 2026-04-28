import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Lock, Star, Zap, Target, ChevronDown } from "lucide-react";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

/* ─────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   ALL CSS (merged + new additions)
───────────────────────────────────────────── */
const ALL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-map { font-family: 'Nunito', sans-serif; }

  .sea-glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 2px solid var(--glass-border);
    box-shadow: 0 15px 35px var(--glass-shadow);
  }

  /* ── Node shine ── */
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

  /* ── Node label ── */
  .node-label {
    margin-top: 10px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 14px;
    padding: 7px 9px;
    text-align: center;
    width: 110px;
    transition: border-color 0.25s, box-shadow 0.25s;
  }
  @media (min-width: 640px) {
    .node-label { width: 128px; padding: 9px 11px; }
  }
  .group:hover .node-label {
    border-color: var(--text-accent);
    box-shadow: 0 4px 14px var(--glass-shadow);
  }

  /* ── Unit header line ── */
  .unit-line {
    flex: 1; height: 1px;
    background: linear-gradient(to right, rgba(43,127,232,0.25), transparent);
  }

  /* ── Stats pill ── */
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

  /* ── Node ring ── */
  .node-ring-wrap {
    position: relative;
    width: 88px; height: 88px;
    flex-shrink: 0;
  }
  @media (min-width: 640px) {
    .node-ring-wrap { width: 104px; height: 104px; }
  }
  .node-ring-svg {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    pointer-events: none;
  }
  .map-node-btn {
    position: absolute; inset: 10px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.6);
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1),
                box-shadow 0.35s ease, opacity 0.2s ease;
  }
  @media (min-width: 640px) { .map-node-btn { inset: 12px; } }
  .map-node-btn:not(:disabled):hover { transform: scale(1.07); }
  .map-node-btn:not(:disabled):active { transform: scale(0.94); }
  .map-node-btn.locked {
    filter: grayscale(1);
    opacity: 0.38;
    transform: scale(0.88);
    cursor: not-allowed;
  }
  .map-node-glow {
    position: absolute; inset: -16px;
    border-radius: 50%; opacity: 0;
    filter: blur(20px);
    transition: opacity 0.4s ease, transform 0.4s ease;
    pointer-events: none; transform: scale(0.7);
  }
  .group:hover .map-node-glow { opacity: 0.5; transform: scale(1); }

  /* ── Sticky compact header ── */
  .sticky-bar {
    position: fixed;
    top: 85px;
    left: 0; right: 0;
    z-index: 35;
    padding: 0 12px;
    pointer-events: none;
    transform: translateY(-120%);
    opacity: 0;;
    transition: transform 0.38s cubic-bezier(0.4,0,0.2,1),
                opacity 0.38s ease;
  }
  .sticky-bar.visible {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  /* ── Collapsible unit content (CSS grid trick) ── */
  .unit-collapsible {
    display: grid;
    grid-template-rows: 1fr;
    transition: grid-template-rows 0.45s cubic-bezier(0.4,0,0.2,1),
                opacity 0.35s ease;
    opacity: 1;
  }
  .unit-collapsible.collapsed {
    grid-template-rows: 0fr;
    opacity: 0;
  }
  .unit-collapsible-inner {
    overflow: hidden;
  }

  /* ── Unit toggle chevron ── */
  .unit-chevron {
    transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
  }
  .unit-chevron.open { transform: rotate(180deg); }

  /* ── Path SVG ── */
  .path-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    pointer-events: none;
    overflow: visible;
  }

  /* ── Unit connector ── */
  .unit-spacer {
    width: 2px; height: 40px;
    background: linear-gradient(to bottom, rgba(43,127,232,0.25), transparent);
    margin: 0 auto;
  }
`;

/* ─────────────────────────────────────────────
   LOADING SCREEN
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   STICKY COMPACT HEADER
───────────────────────────────────────────── */
function StickyBar({ subject, progressPct, completedLessons, totalLessons, visible, onBack }) {
  return (
    <div className={`sticky-bar ${visible ? "visible" : ""}`}>
      <div className="sea-glass-card rounded-2xl px-4 py-2.5 flex items-center gap-3 max-w-5xl mx-auto" style={{ borderColor: subject.color }}>
        {/* Icon */}
        <span className="text-xl shrink-0">{subject.icon}</span>

        {/* Name + progress */}
        <div className="flex-1 min-w-0">
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest
                        text-[var(--text-primary)] truncate leading-none mb-1.5">
            {subject.name}
          </p>
          <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2B7FE8] to-[#10b981] transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Percentage */}
        <span className="text-[10px] font-black text-[var(--text-secondary)] shrink-0 hidden sm:inline">
          {completedLessons}/{totalLessons}
        </span>
        <span className="text-[10px] font-black text-[#2B7FE8] shrink-0">
          {progressPct}%
        </span>

        {/* Back button */}
        <button
          onClick={onBack}
          className="shrink-0 p-2 rounded-xl bg-[var(--card-bg)] border border-[var(--glass-border)]
                     hover:border-[var(--text-accent)] transition-colors"
        >
          <ChevronLeft size={13} className="text-[var(--text-secondary)]" />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   WINDING PATH LAYOUT
───────────────────────────────────────────── */
function PathLayout({ lessons, onNodeClick }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(320);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Initial measurement
    setContainerWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isMobile = containerWidth < 640;
  const NODE_W   = isMobile ? 88 : 104;
  const V_GAP    = isMobile ? 168 : 185; // vertical spacing between node tops
  const LABEL_H  = 72;                    // approx label height below node
  const PAD_X    = isMobile ? 20 : 40;   // horizontal padding

  // Available horizontal range for node centers
  const availableX = Math.max(0, containerWidth - NODE_W - PAD_X * 2);

  /**
   * Multi-frequency sine wave for organic winding.
   * Combines three frequencies so the path never looks like a simple zig-zag.
   */
  const getNodeX = (i) => {
    const w1 = Math.sin(i * 1.18 + 0.40) * 0.48;  // primary wave
    const w2 = Math.sin(i * 0.47 + 1.10) * 0.34;  // secondary wave
    const w3 = Math.sin(i * 2.30 + 0.65) * 0.11;  // texture
    const combined = w1 + w2 + w3;                 // range ≈ -0.93 … +0.93
    const t = (combined + 0.93) / 1.86;            // normalize 0 → 1
    return PAD_X + Math.max(0, Math.min(1, t)) * availableX;
  };

  const positions = lessons.map((_, i) => {
    const x  = getNodeX(i);
    const y  = i * V_GAP;
    const cx = x + NODE_W / 2;
    const cy = y + NODE_W / 2;
    return { x, y, cx, cy };
  });

  const totalH =
    positions.length > 0
      ? positions[positions.length - 1].y + NODE_W + LABEL_H + 24
      : 0;

  // Build a smooth cubic-bezier SVG path between node centers
  const pathD = positions.length > 1
    ? positions.reduce((d, p, i) => {
        if (i === 0) return `M ${p.cx} ${p.cy}`;
        const prev = positions[i - 1];
        const midY = (prev.cy + p.cy) / 2;
        // Control points sit at midY to create S-curve
        return `${d} C ${prev.cx} ${midY}, ${p.cx} ${midY}, ${p.cx} ${p.cy}`;
      }, "")
    : "";

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: totalH }}>
      {/* SVG connector path */}
      {pathD && (
        <svg className="path-svg" height={totalH} style={{ zIndex: 0 }}>
          {/* Soft glow under path */}
          <path
            d={pathD} fill="none"
            stroke="rgba(43,127,232,0.07)"
            strokeWidth={isMobile ? 14 : 18}
          />
          {/* Dashed foreground path */}
          <path
            d={pathD} fill="none"
            stroke="rgba(43,127,232,0.22)"
            strokeWidth="2.5"
            strokeDasharray="9 7"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Lesson nodes */}
      {positions.map((pos, i) => (
        <div
          key={lessons[i]._id}
          className="absolute"
          style={{
            left: pos.cx,
            top:  pos.y,
            transform: "translateX(-50%)",
            zIndex: 1,
          }}
        >
          <GlassNode
            lesson={lessons[i]}
            onClick={() => onNodeClick(lessons[i]._id)}
          />
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   GLASS NODE (unchanged logic, style tweaks)
───────────────────────────────────────────── */
function GlassNode({ lesson, onClick }) {
  const config   = STATUS_CONFIG[lesson.status] || STATUS_CONFIG.locked;
  const isLocked = lesson.status === "locked";

  const completions   = lesson.completions ?? 0;
  const totalReps     = 4;
  const radius        = 47;
  const circumference = 2 * Math.PI * radius;
  const dashArray     = `${circumference * (completions / totalReps)} ${circumference}`;

  return (
    <div className="relative group flex flex-col items-center">
      {/* Glow */}
      <div className="map-node-glow" style={{ backgroundColor: config.glow }} />

      {/* Ring + button */}
      <div className="node-ring-wrap">
        <svg className="node-ring-svg" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={isLocked ? "transparent" : `${config.base}22`}
            strokeWidth="4"
          />
          {!isLocked && completions > 0 && (
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke={config.base}
              strokeWidth="4"
              strokeDasharray={dashArray}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          )}
        </svg>

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
      </div>

      {/* Label */}
      <div className={`node-label ${isLocked ? "opacity-40" : ""}`}>
        <p className={`text-[7px] sm:text-[8px] font-black uppercase tracking-[0.15em] mb-0.5
                       ${isLocked ? "text-slate-400" : "text-[#2B7FE8]"}`}>
          {config.label}
        </p>
        <h3 className={`text-[9px] sm:text-[10px] font-black tracking-tight uppercase italic leading-tight
                        ${isLocked ? "text-slate-400" : "text-[var(--text-primary)]"}`}>
          {lesson.name}
        </h3>
        {!isLocked && (
          <p className="text-[7px] font-black mt-1 opacity-60" style={{ color: config.base }}>
            {completions}/{totalReps}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function SubjectMap() {
  const { slug }      = useParams();
  const navigate      = useNavigate();
  const { fetchMe }   = useAuthStore();

  const [subject,        setSubject]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [collapsedUnits, setCollapsedUnits] = useState(new Set());
  const [isSticky,       setIsSticky]       = useState(false);

  // Sentinel div just after main header – triggers sticky bar
  const sentinelRef = useRef(null);

  /* ── Fetch subject ── */
  useEffect(() => {
    api.get(`/subjects/${slug}`)
      .then(({ data }) => { setSubject(data.data); fetchMe(); })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [slug, navigate, fetchMe]);

  /* ── Sticky detection ── */
  useEffect(() => {
    if (loading || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading]);

  /* ── Toggle unit collapse ── */
  const toggleUnit = (unitId) => {
    setCollapsedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  };

  if (loading) return <LoadingScreen />;
  if (!subject) return null;

  const totalLessons     = subject.totalLessons     || 0;
  const completedLessons = subject.completedLessons || 0;
  const progressPct      = totalLessons
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;

  return (
    <div
      className="min-h-screen sea-map pb-28 relative overflow-x-hidden"
      style={{ background: "var(--bg-gradient)" }}
    >
      <style>{ALL_CSS}</style>
      <Navbar />

      {/* ── STICKY COMPACT HEADER ── */}
      <StickyBar
        subject={subject}
        progressPct={progressPct}
        completedLessons={completedLessons}
        totalLessons={totalLessons}
        visible={isSticky}
        onBack={() => navigate("/")}
      />

      {/* ── DECORATIVE BLOBS ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[-8%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px]
                        rounded-full bg-[var(--deco-blob)] blur-[100px]" />
        <div className="absolute bottom-[5%] right-[-5%] w-[280px] sm:w-[400px] h-[280px] sm:h-[400px]
                        rounded-full bg-[var(--deco-blob2)] blur-[80px]" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 pt-5 sm:pt-10">

        {/* ── MAIN HEADER ── */}
        <header
          className="sea-glass-card rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 mb-8 sm:mb-14"
          style={{ borderColor: subject.color }}
        >
          {/* Top row */}
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* Subject icon */}
              <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 bg-[var(--glass-bg)] rounded-2xl sm:rounded-3xl
                              flex items-center justify-center text-3xl sm:text-5xl
                              border-2 border-[var(--glass-border)] shadow-sm">
                {subject.icon}
              </div>
              {/* Texts */}
              <div className="min-w-0">
                <span className="text-[#2B7FE8] font-black uppercase text-[8px] sm:text-[9px]
                                  tracking-[0.35em] block mb-0.5">
                  Módulo de Operaciones
                </span>
                <h1 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter
                                text-[var(--text-primary)] leading-none truncate">
                  {subject.name}
                </h1>
                <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase
                               tracking-wider mt-1 hidden sm:block">
                  {subject.description}
                </p>
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => navigate("/")}
              className="shrink-0 flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3
                         bg-[var(--card-bg)] border-2 border-[var(--glass-border)]
                         hover:border-[var(--text-accent)] hover:text-[var(--text-accent)]
                         text-[var(--text-secondary)] rounded-2xl font-black uppercase
                         text-[9px] tracking-widest transition-all group"
            >
              <ChevronLeft
                size={14}
                className="group-hover:-translate-x-0.5 transition-transform shrink-0"
              />
              <span className="hidden sm:inline italic">Volver</span>
            </button>
          </div>

          {/* Progress + stats */}
          <div className="mt-5 sm:mt-6 space-y-3">
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
            <div className="h-2 w-full bg-black/5 rounded-full border-2 border-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#2B7FE8] to-[#10b981]
                           transition-all duration-1000 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </header>

        {/* Sentinel: when this exits viewport, sticky bar appears */}
        <div ref={sentinelRef} className="h-px -mt-2" />

        {/* ── UNITS ── */}
        <div>
          {subject.units?.map((unit, uIdx) => {
            const isCollapsed = collapsedUnits.has(unit._id);
            const lessonCount = unit.lessons?.length || 0;

            return (
              <div key={unit._id}>
                {/* Spacer between units */}
                {uIdx > 0 && <div className="unit-spacer my-1" />}

                <section className="mb-8 sm:mb-12">
                  {/* ── Unit header (clickable to collapse) ── */}
                  <button
                    onClick={() => toggleUnit(unit._id)}
                    className="flex items-center gap-3 mb-6 sm:mb-10 w-full group text-left"
                  >
                    {/* Phase badge */}
                    <div className="bg-[#2B7FE8] text-white px-3 sm:px-4 py-1.5 rounded-xl
                                    text-[9px] font-black italic shadow-md shrink-0
                                    group-hover:bg-[#1a6fd4] transition-colors">
                      FASE 0{uIdx + 1}
                    </div>

                    {/* Unit name */}
                    <h2 className="text-base sm:text-xl font-black italic uppercase tracking-wider
                                    text-[var(--text-primary)] truncate min-w-0 flex-1">
                      {unit.name}
                    </h2>

                    {/* Lesson count pill */}
                    {lessonCount > 0 && (
                      <span className="text-[8px] font-black uppercase tracking-wider
                                        text-[var(--text-secondary)] shrink-0 hidden sm:inline">
                        {lessonCount} lec.
                      </span>
                    )}

                    {/* Decorative line */}
                    <div className="unit-line hidden sm:block" />

                    {/* Chevron */}
                    <ChevronDown
                      size={16}
                      className={`unit-chevron shrink-0 text-[var(--text-secondary)]
                                  group-hover:text-[#2B7FE8] ${isCollapsed ? "" : "open"}`}
                    />
                  </button>

                  {/* ── Collapsible path content ── */}
                  <div className={`unit-collapsible ${isCollapsed ? "collapsed" : ""}`}>
                    <div className="unit-collapsible-inner">
                      <PathLayout
                        lessons={unit.lessons || []}
                        onNodeClick={(id) => navigate(`/lesson/${id}`)}
                      />
                    </div>
                  </div>
                </section>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}