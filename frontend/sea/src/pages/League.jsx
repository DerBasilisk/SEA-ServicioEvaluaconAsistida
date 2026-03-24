import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Avatar from "../components/Avatar";
import api from "../api/axios";

const LEAGUE_ORDER = ["bronze","silver","gold","sapphire","emerald","diamond","master","champion","heroic"];
const LEAGUE_CONFIG_MAP = {
  bronze:   { name: "Bronce",    icon: "🥉", color: "#cd7f32" },
  silver:   { name: "Plata",     icon: "🥈", color: "#c0c0c0" },
  gold:     { name: "Oro",       icon: "🥇", color: "#ffd700" },
  sapphire: { name: "Zafiro",    icon: "💙", color: "#0f52ba" },
  emerald:  { name: "Esmeralda", icon: "💚", color: "#50c878" },
  diamond:  { name: "Diamante",  icon: "💎", color: "#b9f2ff" },
  master:   { name: "Maestro",   icon: "🔮", color: "#9b59b6" },
  champion: { name: "Campeón",   icon: "👑", color: "#f1c40f" },
  heroic:   { name: "Heroico",   icon: "⚔️", color: "#ff4444" },
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
    <div className="min-h-screen bg-indigo-950"><Navbar />
      <div className="text-center text-indigo-400 py-20">Cargando liga...</div>
    </div>
  );

  if (!data) return null;

  const { league, leagueName, leagueIcon, leagueColor, members, myRank, myXP,
          total, promoteZone, demoteZone, daysLeft } = data;

  return (
    <div className="min-h-screen bg-indigo-950 pb-20">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="rounded-3xl p-6 mb-6 text-center relative overflow-hidden border"
          style={{ backgroundColor: leagueColor + "15", borderColor: leagueColor + "40" }}>
          <img
            src={`/league/league-tier ${LEAGUE_ORDER.indexOf(league) + 1}.png`}
            alt={leagueName}
            className="w-24 h-24 object-contain mx-auto mb-2 drop-shadow-lg"
          />
          <h1 className="text-white font-black text-3xl mb-1">Liga {leagueName}</h1>
          <p className="text-indigo-400 text-sm mb-4">Sala #{data.roomNumber} · {total} participantes</p>
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl border"
            style={{ backgroundColor: leagueColor + "20", borderColor: leagueColor + "60" }}>
            <span className="text-2xl font-black" style={{ color: leagueColor }}>#{myRank}</span>
            <div className="text-left">
              <p className="text-white font-bold text-sm">Tu posición</p>
              <p className="text-indigo-300 text-xs">⚡ {myXP} XP esta semana</p>
            </div>
          </div>
          <p className="text-indigo-400 text-xs mt-3">
            🗓️ {daysLeft === 1 ? "¡Último día!" : `${daysLeft} días hasta el cierre`}
          </p>
        </div>

        {/* Leyenda */}
        <div className="flex gap-3 mb-4 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <div className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500/50" />
            Top {promoteZone} ascienden
          </div>
          <div className="flex items-center gap-1.5 text-red-400">
            <div className="w-3 h-3 rounded-sm bg-red-500/30 border border-red-500/50" />
            Últimos {total - demoteZone} descienden
          </div>
        </div>

        {/* Tabla */}
        <div className="space-y-1.5">
          {members.map((m) => {
            const inPromoteZone = m.rank <= promoteZone;
            const inDemoteZone  = m.rank > demoteZone;
            const displayName   = m.user.displayName || m.user.username;

            return (
              <div key={m.user._id}
                onClick={() => !m.isMe && navigate(`/profile/${m.user.username}`)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition
                  ${m.isMe ? "border-violet-500 bg-violet-900/40"
                    : inPromoteZone ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer"
                    : inDemoteZone  ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10 cursor-pointer"
                    : "border-indigo-700 bg-indigo-900/40 hover:bg-indigo-800/40 cursor-pointer"
                  }`}
              >
                <span className={`text-lg font-black w-8 text-center flex-shrink-0 ${
                  m.rank === 1 ? "text-yellow-400" : m.rank === 2 ? "text-gray-300" : m.rank === 3 ? "text-amber-600"
                  : inPromoteZone ? "text-emerald-400" : inDemoteZone ? "text-red-400" : "text-indigo-400"
                }`}>
                  {m.rank === 1 ? "🥇" : m.rank === 2 ? "🥈" : m.rank === 3 ? "🥉" : `#${m.rank}`}
                </span>

                <Avatar
                  src={m.user.avatar}
                  name={displayName}
                  size="md"
                  className={m.isMe ? "border-2 border-violet-500" : ""}
                />

                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${m.isMe ? "text-violet-300" : "text-white"}`}>
                    {displayName}{m.isMe && " (Tú)"}
                  </p>
                  <p className="text-indigo-500 text-xs">Nivel {m.user.level}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={`font-black text-sm ${m.isMe ? "text-violet-300" : "text-indigo-300"}`}>⚡ {m.xpEarned}</p>
                  {inPromoteZone && <p className="text-emerald-400 text-xs">↑ Asciende</p>}
                  {inDemoteZone  && <p className="text-red-400 text-xs">↓ Desciende</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mapa de ligas */}
      <div className="mt-8 bg-indigo-900 border border-indigo-700 rounded-2xl p-5">
        <h2 className="text-white font-bold mb-4">🗺️ Mapa de ligas</h2>
        <div className="flex items-end justify-between gap-1">
          {LEAGUE_ORDER.map((key, i) => {
            const config = LEAGUE_CONFIG_MAP[key];
            const isCurrent = key === league;
            return (
              <div key={key} className="flex flex-col items-center gap-1 flex-1">
                <img
                  src={`/league/league-tier ${i + 1}.png`}
                  alt={config.name}
                  className={`w-10 h-10 object-contain transition-all ${
                    isCurrent ? "scale-125 drop-shadow-lg" : "opacity-40 grayscale"
                  }`}
                />
                <span className={`text-[10px] font-bold text-center leading-tight ${
                  isCurrent ? "text-white" : "text-indigo-600"
                }`}>
                  {config.name}
                </span>
                {isCurrent && (
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
