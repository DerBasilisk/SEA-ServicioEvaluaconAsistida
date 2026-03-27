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
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 20px 50px rgba(43, 127, 232, 0.1);
  }

  .league-card-me {
    background: linear-gradient(135deg, #2B7FE8, #1A5BB0);
    box-shadow: 0 10px 25px rgba(43, 127, 232, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.3);
  }

  .promote-row { background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10B981; }
  .demote-row { background: rgba(244, 63, 94, 0.08); border-left: 4px solid #F43F5E; }
  .neutral-row { background: rgba(255, 255, 255, 0.5); border-left: 4px solid transparent; }

  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #AAC0D8; border-radius: 10px; }
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
    <div className="sea-league min-h-screen" style={{ background: "linear-gradient(145deg, #C8E6FF 0%, #A8D4FF 45%, #B8CBFF 100%)" }}>
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
         style={{ background: "linear-gradient(145deg, #C8E6FF 0%, #A8D4FF 45%, #B8CBFF 100%)" }}>
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
            <h1 className="text-4xl font-black italic tracking-tighter text-[#0F2547] uppercase mb-6">
              Liga {leagueName}
            </h1>

            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/60 px-6 py-3 rounded-2xl border border-white flex items-center gap-3">
                <span className="text-2xl font-black italic text-[#2B7FE8]">#{myRank}</span>
                <div className="text-left leading-tight">
                  <p className="text-[9px] font-black text-[#7A9CC5] uppercase">Tu Rango</p>
                  <p className="text-[11px] font-bold text-[#0F2547] uppercase">En esta sala</p>
                </div>
              </div>
              <div className="bg-white/60 px-6 py-3 rounded-2xl border border-white flex items-center gap-3">
                <Timer size={20} className="text-[#2B7FE8]" />
                <div className="text-left leading-tight">
                  <p className="text-[9px] font-black text-[#7A9CC5] uppercase">Tiempo Restante</p>
                  <p className="text-[11px] font-bold text-[#0F2547] uppercase">
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
                  key={m.user._id}
                  onClick={() => !isMe && navigate(`/profile/${m.user.username}`)}
                  className={`flex items-center gap-4 px-6 py-5 transition-all relative group
                    ${isMe ? "league-card-me z-10 mx-2 my-2 rounded-[1.8rem]" : "border-b border-white/40 hover:bg-white/40 cursor-pointer"}
                    ${!isMe && inPromoteZone ? "promote-row" : ""}
                    ${!isMe && inDemoteZone ? "demote-row" : ""}
                  `}
                >
                  {/* Rank Indicator */}
                  <div className={`w-10 text-center font-black italic text-lg ${isMe ? "text-white" : "text-[#7A9CC5]"}`}>
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
                    <p className={`font-black text-sm uppercase italic truncate ${isMe ? "text-white" : "text-[#0F2547]"}`}>
                      {displayName} {isMe && <span className="text-[10px] opacity-80 not-italic">(Tú)</span>}
                    </p>
                    <p className={`text-[10px] font-bold uppercase tracking-tighter ${isMe ? "text-blue-100" : "text-[#7A9CC5]"}`}>
                      Nivel {m.user.level}
                    </p>
                  </div>

                  {/* XP & Status */}
                  <div className="text-right">
                    <div className={`flex items-center justify-end gap-1 font-black text-sm ${isMe ? "text-white" : "text-[#2B7FE8]"}`}>
                      <Zap size={14} fill={isMe ? "white" : "#2B7FE8"} />
                      {m.xpEarned}
                    </div>
                    {inPromoteZone && (
                      <p className={`text-[9px] font-black uppercase tracking-tighter ${isMe ? "text-blue-100" : "text-[#10B981]"}`}>
                        Asciende
                      </p>
                    )}
                    {inDemoteZone && (
                      <p className={`text-[9px] font-black uppercase tracking-tighter ${isMe ? "text-rose-200" : "text-[#F43F5E]"}`}>
                        Riesgo
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAPA DE LIGAS (Roadmap Style) */}
        <div className="mt-10 sea-glass-panel rounded-[2.5rem] p-8">
          <h2 className="text-[10px] font-black text-[#2B7FE8] uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
            <Target size={16} /> Progresión de Carrera SEA
          </h2>
          <div className="flex items-end justify-between relative px-2">
            {/* Línea de conexión de fondo */}
            <div className="absolute bottom-10 left-0 right-0 h-[2px] bg-[#2B7FE8]/10 -z-0"></div>
            
            {LEAGUE_ORDER.map((key, i) => {
              const isCurrent = key === league;
              const isPast = LEAGUE_ORDER.indexOf(league) > i;
              
              return (
                <div key={key} className="flex flex-col items-center gap-2 flex-1 relative z-10">
                  <div className={`transition-all duration-500 ${isCurrent ? "scale-125 -translate-y-2" : "scale-100"}`}>
                    <img
                      src={`/league/league-tier ${i + 1}.png`}
                      alt={key}
                      className={`w-10 h-10 object-contain transition-all duration-500 ${
                        isCurrent ? "drop-shadow-[0_8px_15px_rgba(43,127,232,0.4)]" : 
                        isPast ? "opacity-60 grayscale-[0.5]" : "opacity-20 grayscale"
                      }`}
                    />
                  </div>
                  <div className={`w-2 h-2 rounded-full border-2 transition-all ${
                    isCurrent ? "bg-[#2B7FE8] border-white scale-150 shadow-[0_0_10px_#2B7FE8]" : 
                    isPast ? "bg-[#7A9CC5] border-transparent" : "bg-[#AAC0D8]/30 border-transparent"
                  }`}></div>
                  <span className={`text-[8px] font-black text-center uppercase tracking-tighter transition-colors ${
                    isCurrent ? "text-[#0F2547]" : "text-[#7A9CC5]"
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