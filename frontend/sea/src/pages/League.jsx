import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Avatar from "../components/Avatar";
import api from "../api/axios";
import { Trophy, Timer, Info, ChevronUp, Target, Zap } from "lucide-react";

const LEAGUE_ORDER = ["bronze", "silver", "gold", "sapphire", "emerald", "diamond", "master", "champion", "heroic"];

const LEAGUE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-league { font-family: 'Nunito', sans-serif; }

  .sea-glass-panel {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 20px 50px var(--glass-shadow);
  }

  /* ── Fila del usuario actual ── */
  .league-card-me {
    background: var(--text-accent);
    color: var(--btn-text);
    box-shadow: 0 8px 24px var(--glass-shadow);
    border: 2px solid rgba(255,255,255,0.25);
    /* mx-2 my-1.5 y border-radius se ponen inline */
  }

  .promote-row { background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10B981; }
  .demote-row  { background: rgba(244,  63,  94, 0.08); border-left: 3px solid #F43F5E; }

  [data-theme="high-contrast"] .league-card-me { background:#fff !important; color:#000 !important; border:4px solid #fff !important; }
  [data-theme="high-contrast"] .promote-row    { background:#000 !important; border-left:8px solid #00FF00 !important; }
  [data-theme="high-contrast"] .demote-row     { background:#000 !important; border-left:8px solid #FF0000 !important; }

  /* ── Leaderboard rows ── */
  .lb-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--glass-border);
    transition: background 0.15s;
  }
  @media (min-width: 640px) {
    .lb-row { padding: 14px 24px; gap: 16px; }
  }
  .lb-row:last-child { border-bottom: none; }
  .lb-row:not(.lb-row-me):hover { background: var(--glass-bg); cursor: pointer; }

  /* ── Roadmap de ligas ── */
  .league-roadmap {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0;
    position: relative;
    padding: 0 4px;
    overflow-x: auto;
    /* Oculta scrollbar pero permite scroll si no caben */
    scrollbar-width: none;
  }
  .league-roadmap::-webkit-scrollbar { display: none; }
  .roadmap-node {
    display: flex; flex-direction: column; align-items: center;
    gap: 6px; flex: 1; min-width: 40px; position: relative; z-index: 1;
  }

  /* ── Chips de stats en el header ── */
  .stat-chip {
    display: flex; align-items: center; gap: 8px;
    background: var(--card-bg);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    padding: 10px 16px;
  }
  @media (max-width: 479px) {
    .stat-chip { padding: 8px 12px; border-radius: 14px; }
  }

  /* Scrollbar sutil para la tabla */
  .lb-scroll::-webkit-scrollbar { width: 4px; }
  .lb-scroll::-webkit-scrollbar-track { background: transparent; }
  .lb-scroll::-webkit-scrollbar-thumb { background: var(--text-muted); border-radius: 99px; }
`;

/* ── Loading ── */
function LoadingScreen() {
  return (
    <div className="sea-league min-h-screen flex flex-col" style={{ background: "var(--bg-gradient)" }}>
      <Navbar />
      <div className="flex flex-col items-center justify-center flex-1 gap-4">
        <div className="w-10 h-10 border-4 border-[#2B7FE8]/20 border-t-[#2B7FE8] rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7A9CC5]">
          Cargando Clasificaciones…
        </p>
      </div>
    </div>
  );
}

/* ── Fila individual del leaderboard ── */
function LeagueRow({ m, promoteZone, demoteZone }) {
  const inPromote  = m.rank <= promoteZone;
  const inDemote   = m.rank > demoteZone;
  const isMe       = m.isMe;
  const displayName = m.user.displayName || m.user.username;

  const rankLabel = m.rank === 1 ? "🥇" : m.rank === 2 ? "🥈" : m.rank === 3 ? "🥉" : `#${m.rank}`;

  return (
    <div className={`lb-row
      ${isMe       ? "league-card-me lb-row-me mx-2 my-1.5 rounded-[1.5rem]" : ""}
      ${!isMe && inPromote ? "promote-row" : ""}
      ${!isMe && inDemote  ? "demote-row"  : ""}
    `}>
      {/* Rank */}
      <div className={`w-8 shrink-0 text-center font-black italic text-base
        ${isMe ? "text-[var(--btn-text)]" : "text-[var(--text-secondary)]"}`}>
        {rankLabel}
      </div>

      {/* Avatar + badge ascenso */}
      <div className="relative shrink-0">
        <Avatar
          src={m.user.avatar}
          name={displayName}
          size="sm"
          className={`rounded-xl border-2 ${isMe ? "border-white/40" : "border-white shadow-sm"}`}
        />
        {inPromote && !isMe && (
          <div className="absolute -top-1 -right-1 bg-[#10B981] rounded-full p-0.5 border border-white">
            <ChevronUp size={8} className="text-white" />
          </div>
        )}
      </div>

      {/* Nombre + nivel */}
      <div className="flex-1 min-w-0">
        <p className={`font-black text-[13px] uppercase italic truncate leading-tight
          ${isMe ? "text-[var(--btn-text)]" : "text-[var(--text-primary)]"}`}>
          {displayName}
          {isMe && <span className="text-[10px] opacity-70 not-italic font-bold ml-1">(Tú)</span>}
        </p>
        <p className={`text-[9px] font-bold uppercase tracking-tight
          ${isMe ? "text-[var(--btn-text)] opacity-65" : "text-[var(--text-secondary)]"}`}>
          Nivel {m.user.level}
        </p>
      </div>

      {/* XP */}
      <div className={`flex items-center gap-1 font-black text-sm shrink-0
        ${isMe ? "text-[var(--btn-text)]" : "text-[var(--text-accent)]"}`}>
        <Zap size={13} fill="currentColor" />
        <span>{m.xpEarned}</span>
      </div>
    </div>
  );
}

/* ── Roadmap de ligas ── */
function LeagueRoadmap({ current }) {
  return (
    <div className="sea-glass-panel rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 mt-6 sm:mt-10">
      <h2 className="text-[10px] font-black text-[var(--text-accent)] uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
        <Target size={14} /> Progresión de Carrera SEA
      </h2>

      {/* Línea base */}
      <div className="relative">
        <div className="absolute left-0 right-0 h-[2px] bg-[var(--text-accent)] opacity-15"
             style={{ bottom: 28 }} />
        <div className="league-roadmap">
          {LEAGUE_ORDER.map((key) => {
            const isCurrent  = key === current;
            const isPast     = LEAGUE_ORDER.indexOf(key) < LEAGUE_ORDER.indexOf(current);
            return (
              <div key={key} className="roadmap-node">
                {/* Imagen de liga — solo en desktop */}
                <img
                  src={`/league/league-tier ${LEAGUE_ORDER.indexOf(key) + 1}.png`}
                  alt={key}
                  className={`hidden sm:block object-contain transition-all duration-300
                    ${isCurrent ? "w-10 h-10 drop-shadow-lg" : "w-7 h-7 opacity-40 grayscale"}
                    ${isPast && !isCurrent ? "opacity-60 grayscale-0" : ""}
                  `}
                />
                {/* Dot — siempre visible */}
                <div className={`rounded-full border-2 transition-all
                  ${isCurrent
                    ? "w-3 h-3 bg-[var(--text-accent)] border-[var(--text-primary)] scale-125 shadow-[0_0_8px_var(--text-accent)]"
                    : isPast
                      ? "w-2 h-2 bg-[var(--text-accent)] border-transparent opacity-50"
                      : "w-2 h-2 bg-[var(--text-muted)] border-transparent opacity-40"
                  }`}
                />
                <span className={`text-[7px] sm:text-[8px] font-black uppercase tracking-tight text-center leading-none
                  ${isCurrent ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] opacity-60"}`}>
                  {key}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Página principal ── */
export default function League() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/leagues/me")
      .then(({ data }) => setData(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;
  if (!data)   return null;

  const { league, leagueName, leagueColor, members, myRank, myXP,
          total, promoteZone, demoteZone, daysLeft } = data;

  return (
    <div className="sea-league min-h-screen pb-24 relative overflow-hidden"
         style={{ background: "var(--bg-gradient)" }}>
      <style>{LEAGUE_CSS}</style>
      <Navbar />

      {/* Blobs decorativos */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-[var(--deco-blob)] blur-[100px] opacity-40" />
        <div className="absolute bottom-[-10%] left-[-5%]  w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] rounded-full bg-[var(--deco-blob2)] blur-[100px] opacity-40" />
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-5 pt-5 sm:pt-8 relative z-10">

        {/* ── HEADER ── */}
        <div className="sea-glass-panel rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8 mb-5 sm:mb-8 relative overflow-hidden text-center">
          {/* Trofeo decorativo — más pequeño en móvil */}
          <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-[0.06] pointer-events-none">
            <Trophy size={90} className="sm:w-[120px] sm:h-[120px]" />
          </div>

          <div className="relative z-10">
            {/* Imagen de liga */}
            <img
              src={`/league/league-tier ${LEAGUE_ORDER.indexOf(league) + 1}.png`}
              alt={leagueName}
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain mx-auto mb-3 sm:mb-4
                         drop-shadow-[0_8px_12px_rgba(0,0,0,0.12)]"
            />

            <p className="text-[9px] sm:text-[10px] font-black text-[#2B7FE8] uppercase tracking-[0.35em] mb-1">
              División Actual
            </p>
            <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-[var(--text-primary)] uppercase mb-4 sm:mb-6">
              Liga {leagueName}
            </h1>

            {/* Stats chips: apilados en móvil muy pequeño, en fila desde xs */}
            <div className="flex flex-wrap justify-center gap-3">
              <div className="stat-chip">
                <span className="text-xl sm:text-2xl font-black italic text-[var(--text-accent)]">
                  #{myRank}
                </span>
                <div className="text-left leading-tight">
                  <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Tu Rango</p>
                  <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase">En esta sala</p>
                </div>
              </div>

              <div className="stat-chip">
                <Timer size={18} className="text-[var(--text-accent)] shrink-0" />
                <div className="text-left leading-tight">
                  <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Tiempo</p>
                  <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase">
                    {daysLeft === 1 ? "¡Últimas 24h!" : `${daysLeft} Días`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── LEYENDA ── */}
        <div className="flex items-center justify-between mb-3 sm:mb-5 px-2">
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <LegendDot color="#10B981" label={`Ascenso: Top ${promoteZone}`} />
            <LegendDot color="#F43F5E" label={`Descenso: ${total - demoteZone}`} />
          </div>
          <div className="flex items-center gap-1 text-[var(--text-secondary)] shrink-0">
            <Info size={13} />
            <span className="text-[9px] font-bold uppercase tracking-tight">{total} Usuarios</span>
          </div>
        </div>

        {/* ── TABLA ── */}
        <div className="sea-glass-panel rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden">
          <div className="lb-scroll overflow-y-auto" style={{ maxHeight: "min(60vh, 520px)" }}>
            {members.map((m) => (
              <LeagueRow
                key={m.user._id}
                m={m}
                promoteZone={promoteZone}
                demoteZone={demoteZone}
              />
            ))}
          </div>
        </div>

        {/* ── ROADMAP ── */}
        <LeagueRoadmap current={league} />
      </div>
    </div>
  );
}

/* Pequeño helper para los puntos de la leyenda */
function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
      <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider">{label}</span>
    </div>
  );
}