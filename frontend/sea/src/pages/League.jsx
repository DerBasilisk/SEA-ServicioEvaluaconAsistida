import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

const LEAGUE_ORDER = ["bronze","silver","gold","sapphire","emerald","diamond","master","champion"];

const LEAGUE_CONFIGS = {
  bronze:   { name: "Bronce",   icon: "🥉", color: "#cd7f32" },
  silver:   { name: "Plata",    icon: "🥈", color: "#c0c0c0" },
  gold:     { name: "Oro",      icon: "🥇", color: "#ffd700" },
  sapphire: { name: "Zafiro",   icon: "💙", color: "#0f52ba" },
  emerald:  { name: "Esmeralda", icon: "💚", color: "#50c878" },
  diamond:  { name: "Diamante",  icon: "💎", color: "#b9f2ff" },
  master:   { name: "Maestro",   icon: "🔮", color: "#9b59b6" },
  champion: { name: "Campeón",   icon: "👑", color: "#f1c40f" },
};

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
    <div className="min-h-screen bg-[#F0F7FF] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const { league, leagueName, leagueIcon, leagueColor, members, myRank, myXP,
          total, promoteZone, demoteZone, daysLeft } = data;

  return (
    <div className="min-h-screen bg-[#F0F7FF] flex flex-col font-['Nunito'] text-slate-900 overflow-x-hidden">
      <Navbar />
      
      {/* Fondo decorativo azul suave */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-blue-200/50 to-transparent z-0" />
      
      <main className="flex-grow relative z-10 max-w-2xl mx-auto px-6 py-10 w-full">

        {/* Header de Liga: Cristal Blanco/Azul */}
        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[3rem] p-8 mb-8 text-center shadow-xl shadow-blue-900/5">
          <div className="relative inline-block mb-4">
            <div className="text-8xl drop-shadow-xl animate-bounce-slow">{leagueIcon}</div>
          </div>
          <h1 className="text-slate-900 font-black text-4xl italic tracking-tighter uppercase mb-1">
            Liga <span className="text-blue-600">{leagueName}</span>
          </h1>
          <p className="text-slate-400 font-black tracking-[0.2em] text-[10px] uppercase mb-6">
            SALA #{data.roomNumber} • {total} ESTUDIANTES
          </p>

          <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-5 inline-flex items-center gap-8 shadow-sm">
            <div className="text-center">
              <p className="text-blue-400 font-black text-[9px] uppercase tracking-widest leading-none mb-2">Rango</p>
              <p className="text-4xl font-black italic leading-none text-blue-600">#{myRank}</p>
            </div>
            <div className="w-px h-10 bg-blue-200" />
            <div className="text-center">
              <p className="text-blue-400 font-black text-[9px] uppercase tracking-widest leading-none mb-2">Tu Progreso</p>
              <p className="text-2xl font-black italic leading-none text-slate-800">⚡ {myXP} XP</p>
            </div>
          </div>

          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-6 flex items-center justify-center gap-2 italic">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            {daysLeft === 1 ? "¡ÚLTIMAS 24 HORAS!" : `CIERRA EN ${daysLeft} DÍAS`}
          </p>
        </div>

        {/* Tabla de Posiciones Cristalina */}
        <div className="space-y-3">
          {members.map((m) => {
            const inPromoteZone = m.rank <= promoteZone;
            const inDemoteZone  = m.rank > demoteZone;
            const isTop3 = m.rank <= 3;

            return (
              <div
                key={m.user._id}
                onClick={() => !m.isMe && navigate(`/profile/${m.user.username}`)}
                className={`group relative flex items-center gap-4 px-6 py-4 rounded-[2rem] border transition-all duration-300 cursor-pointer
                  ${m.isMe 
                    ? "bg-white border-blue-200 scale-[1.03] z-20 shadow-xl shadow-blue-900/10" 
                    : "bg-white/60 border-white hover:bg-white hover:shadow-md"
                  }
                `}
              >
                {/* Indicador lateral de zona */}
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-r-full ${
                  inPromoteZone ? "bg-emerald-400" : inDemoteZone ? "bg-rose-400" : "opacity-0"
                }`} />

                <div className="w-10 flex-shrink-0 text-center text-xl font-black italic">
                  {isTop3 ? (m.rank === 1 ? "🥇" : m.rank === 2 ? "🥈" : "🥉") : <span className="text-slate-300">{m.rank}</span>}
                </div>

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg border-2 shadow-sm transition-transform group-hover:scale-110 ${
                  m.isMe ? "bg-blue-600 border-blue-400" : "bg-slate-100 border-white text-slate-400"
                }`}>
                  {(m.user.displayName || m.user.username)?.[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-black text-sm tracking-tight uppercase italic truncate ${m.isMe ? "text-blue-600" : "text-slate-700"}`}>
                    {m.user.displayName || m.user.username}
                    {m.isMe && <span className="ml-2 text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-full not-italic">TÚ</span>}
                  </p>
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
                    <span className="text-slate-400">NIVEL {m.user.level}</span>
                    {inPromoteZone && <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg">↑ ASCENSO</span>}
                    {inDemoteZone && <span className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg">↓ DESCENSO</span>}
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-lg font-black italic ${m.isMe ? "text-blue-600" : "text-slate-800"}`}>⚡{m.xpEarned}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Jerarquía de Ligas Cristalina */}
        <div className="mt-12 bg-white/40 backdrop-blur-md border border-white rounded-[3rem] p-8">
          <h2 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-8 text-center">Jerarquía de Ligas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {LEAGUE_ORDER.map((key) => {
              const config = LEAGUE_CONFIGS[key];
              const isCurrent = key === league;
              return (
                <div key={key} className={`flex flex-col items-center p-4 rounded-[2rem] transition-all ${
                  isCurrent ? "bg-white border-blue-100 shadow-lg scale-110" : "opacity-30 grayscale blur-[0.5px]"
                }`}>
                  <span className="text-3xl mb-2 drop-shadow-sm">{config.icon}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isCurrent ? "text-blue-600" : "text-slate-400"}`}>
                    {config.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer Cristalino */}
      <footer className="w-full py-12 mt-10 border-t border-blue-100 relative z-10 bg-white/20">
        <div className="max-w-2xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-60">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-[10px]">S</div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">SEA EVALUACIÓN</span>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">© 2026 • Sistema de Competencia</p>
          <div className="flex gap-4">
            <a href="#" className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Ayuda</a>
          </div>
        </div>
      </footer>
    </div>
  );
}