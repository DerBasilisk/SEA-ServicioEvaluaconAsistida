import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Avatar from "../components/Avatar";
import api from "../api/axios";
import { Trophy, Timer, Info, ChevronUp, ChevronDown, Target, Zap } from "lucide-react";

const LEAGUE_ORDER = ["bronze", "silver", "gold", "sapphire", "emerald", "diamond", "master", "champion", "heroic"];

const LEAGUE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-league { font-family: 'Nunito', sans-serif; }
  
  .sea-glass-panel {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 20px 50px var(--glass-shadow);
  }

  .league-card-me {
    background: var(--text-accent); /* Tu color de acento (azul/cian/blanco) */
    color: var(--btn-text); /* Texto contrastado */
    box-shadow: 0 10px 25px var(--glass-shadow);
    border: 2px solid var(--glass-border);
  }

  /* Filas de estatus - Usamos opacidad para que el fondo del tema respire */
  .promote-row { 
    background: rgba(16, 185, 129, 0.1); 
    border-left: 4px solid #10B981; 
  }
  .demote-row { 
    background: rgba(244, 63, 94, 0.1); 
    border-left: 4px solid #F43F5E; 
  }
  
  /* Ajuste para Alto Contraste */
  [data-theme="high-contrast"] .league-card-me {
    background: #FFFFFF !important;
    color: #000000 !important;
    border: 4px solid #FFFFFF !important;
  }
  
  [data-theme="high-contrast"] .promote-row { background: #000 !important; border-left: 8px solid #00FF00 !important; }
  [data-theme="high-contrast"] .demote-row { background: #000 !important; border-left: 8px solid #FF0000 !important; }

  .custom-scrollbar::-webkit-scrollbar-thumb { 
    background: var(--text-muted); 
    border-radius: 10px; 
  }
`;

export default function League() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/leagues/me")
      .then(({ data }) => setData(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="sea-league min-h-screen" style={{ background: "var(--bg-gradient)" }}>
      <Navbar />
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-[#2B7FE8]/20 border-t-[#2B7FE8] rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7A9CC5]">Cargando Clasificaciones...</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { league, leagueName, leagueColor, members, myRank, myXP, total, promoteZone, demoteZone, daysLeft } = data;

  return (
    <div className="sea-league min-h-screen pb-20 relative overflow-hidden" 
         style={{ background: "var(--bg-gradient)" }}>
      <style>{LEAGUE_CSS}</style>
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-10 relative z-10">
        
        {/* HEADER DE LIGA (Glassmorphism) */}
        <div className="sea-glass-panel rounded-[3rem] p-8 mb-8 relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Trophy size={120} />
          </div>
          
          <div className="relative z-10">
            <img
              src={`/league/league-tier ${LEAGUE_ORDER.indexOf(league) + 1}.png`}
              alt={leagueName}
              className="w-32 h-32 object-contain mx-auto mb-4 drop-shadow-[0_10px_15px_rgba(0,0,0,0.1)] scale-110"
            />
            <p className="text-[10px] font-black text-[#2B7FE8] uppercase tracking-[0.4em] mb-1">División Actual</p>
            <h1 className="text-4xl font-black italic tracking-tighter text-[--text-primary] uppercase mb-6">
              Liga {leagueName}
            </h1>

            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-[var(--card-bg)] px-6 py-3 rounded-2xl border border-[var(--glass-border)] flex items-center gap-3">
                <span className="text-2xl font-black italic text-[var(--text-accent)]">#{myRank}</span>
                <div className="text-left leading-tight">
                  <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Tu Rango</p>
                  <p className="text-[11px] font-bold text-[var(--text-primary)] uppercase">En esta sala</p>
                </div>
              </div>
              
              <div className="bg-[var(--card-bg)] px-6 py-3 rounded-2xl border border-[var(--glass-border)] flex items-center gap-3">
                <Timer size={20} className="text-[var(--text-accent)]" />
                <div className="text-left leading-tight">
                  <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Tiempo Restante</p>
                  <p className="text-[11px] font-bold text-[var(--text-primary)] uppercase">
                    {daysLeft === 1 ? "¡Últimas 24h!" : `${daysLeft} Días`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LEYENDA Y STATUS */}
        <div className="flex items-center justify-between mb-6 px-4">
          <div className="flex gap-4">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"></div>
                <span className="text-[9px] font-black text-[#5B7CA3] uppercase tracking-wider">Ascenso: Top {promoteZone}</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#F43F5E] shadow-[0_0_8px_#F43F5E]"></div>
                <span className="text-[9px] font-black text-[#5B7CA3] uppercase tracking-wider">Descenso: {total - demoteZone}</span>
             </div>
          </div>
          <div className="flex items-center gap-1 text-[#7A9CC5]">
            <Info size={14} />
            <span className="text-[9px] font-bold uppercase tracking-tighter">{total} Usuarios</span>
          </div>
        </div>

        {/* TABLA DE POSICIONES */}
        <div className="sea-glass-panel rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            {members.map((m) => {
              const inPromoteZone = m.rank <= promoteZone;
              const inDemoteZone = m.rank > demoteZone;
              const isMe = m.isMe;
              const displayName = m.user.displayName || m.user.username;

              return (
                <div 
                  className={`flex items-center gap-4 px-6 py-5 transition-all relative group
                    ${isMe ? "league-card-me z-10 mx-2 my-2 rounded-[1.8rem]" : "border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] cursor-pointer"}
                    ${!isMe && inPromoteZone ? "promote-row" : ""}
                    ${!isMe && inDemoteZone ? "demote-row" : ""}
                  `}
                >
                  {/* Rank Indicator */}
                  <div className={`w-10 text-center font-black italic text-lg ${isMe ? "text-[var(--btn-text)]" : "text-[var(--text-secondary)]"}`}>
                    {m.rank === 1 ? "🥇" : m.rank === 2 ? "🥈" : m.rank === 3 ? "🥉" : `#${m.rank}`}
                  </div>

                  {/* Avatar */}
                  <div className="relative">
                    <Avatar 
                      src={m.user.avatar} 
                      name={displayName} 
                      size="md" 
                      className={`rounded-xl ${isMe ? "border-2 border-white/50" : "border-2 border-white shadow-sm"}`} 
                    />
                    {inPromoteZone && !isMe && (
                      <div className="absolute -top-1 -right-1 bg-[#10B981] rounded-full p-0.5 border border-white">
                        <ChevronUp size={10} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-black text-sm uppercase italic truncate ${isMe ? "text-[var(--btn-text)]" : "text-[var(--text-primary)]"}`}>
                      {displayName} {isMe && <span className="text-[10px] opacity-80 not-italic">(Tú)</span>}
                    </p>
                    <p className={`text-[10px] font-bold uppercase tracking-tighter ${isMe ? "text-[var(--btn-text)] opacity-70" : "text-[var(--text-secondary)]"}`}>
                      Nivel {m.user.level}
                    </p>
                  </div>

                  {/* XP & Status */}
                  <div className="text-right">
                    <div className={`flex items-center justify-end gap-1 font-black text-sm ${isMe ? "text-[var(--btn-text)]" : "text-[var(--text-accent)]"}`}>
                      <Zap size={14} fill="currentColor" />
                      {m.xpEarned}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAPA DE LIGAS (Roadmap Style) */}
        <div className="mt-10 sea-glass-panel rounded-[2.5rem] p-8">
          <h2 className="text-[10px] font-black text-[var(--text-accent)] uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
            <Target size={16} /> Progresión de Carrera SEA
          </h2>
          <div className="flex items-end justify-between relative px-2">
            {/* Línea de conexión dinámica */}
            <div className="absolute bottom-10 left-0 right-0 h-[2px] bg-[var(--text-accent)] opacity-20 -z-0"></div>
            
            {LEAGUE_ORDER.map((key, i) => {
              const isCurrent = key === league;
              return (
                <div key={key} className="flex flex-col items-center gap-2 flex-1 relative z-10">
                  <div className={`w-2 h-2 rounded-full border-2 transition-all ${
                    isCurrent ? "bg-[var(--text-accent)] border-[var(--text-primary)] scale-150 shadow-[0_0_10px_var(--text-accent)]" : "bg-[var(--text-muted)] border-transparent"
                  }`}></div>
                  <span className={`text-[8px] font-black text-center uppercase tracking-tighter ${
                    isCurrent ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                  }`}>
                    {key}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}