export default function ResultScreen({ result, lesson, onContinue, onRetry }) {
  if (!result) return null;

  const { score = 0, xpEarned = 0, isPerfect, leveledUp, newLevel, newStreak, newAchievements = [] } = result;

  const getScoreEmoji = () => {
    if (score === 100) return "🌟";
    if (score >= 80) return "🎉";
    if (score >= 50) return "👍";
    return "💪";
  };

  const getScoreMessage = () => {
    if (score === 100) return "¡Perfecto!";
    if (score >= 80) return "¡Muy bien!";
    if (score >= 50) return "¡Bien hecho!";
    return "¡Seguí practicando!";
  };

  const getScoreColor = () => {
    if (score === 100) return "text-yellow-400";
    if (score >= 80) return "text-emerald-400";
    if (score >= 50) return "text-violet-400";
    return "text-indigo-400";
  };

  return (
    <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">

        {/* Score principal */}
        <div className="text-center">
          <div className="text-7xl mb-4">{getScoreEmoji()}</div>
          <h1 className={`text-4xl font-black mb-1 ${getScoreColor()}`}>{getScoreMessage()}</h1>
          {lesson && <p className="text-indigo-400">{lesson.name}</p>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox icon="🎯" label="Puntaje" value={`${score}%`} highlight={score === 100} />
          <StatBox icon="⚡" label="XP ganado" value={`+${xpEarned}`} highlight={xpEarned > 0} />
          <StatBox icon="🔥" label="Racha" value={`${newStreak || 0} días`} />
        </div>

        {/* Subió de nivel */}
        {leveledUp && (
          <div className="bg-yellow-900 border-2 border-yellow-500 rounded-2xl p-4 text-center">
            <div className="text-4xl mb-2">🎊</div>
            <p className="text-yellow-300 font-black text-xl">¡Subiste al nivel {newLevel}!</p>
          </div>
        )}

        {/* Logros nuevos */}
        {newAchievements?.length > 0 && (
          <div className="space-y-2">
            <p className="text-indigo-400 text-sm font-medium text-center">🏆 Logros desbloqueados</p>
            {newAchievements.map((a, i) => (
              <div key={i} className="bg-indigo-900 border border-indigo-700 rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <p className="text-white font-bold text-sm">{a.name}</p>
                  <p className="text-indigo-400 text-xs">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botones */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onContinue}
            className="w-full bg-violet-500 hover:bg-violet-400 text-white font-black py-4 rounded-xl transition active:scale-95 text-lg"
          >
            Continuar →
          </button>
          {score < 100 && (
            <button
              onClick={onRetry}
              className="w-full bg-indigo-800 hover:bg-indigo-700 border border-indigo-600 text-indigo-300 font-bold py-3 rounded-xl transition"
            >
              Intentar de nuevo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, highlight }) {
  return (
    <div className={`rounded-xl p-3 text-center border ${highlight ? "bg-violet-900 border-violet-500" : "bg-indigo-900 border-indigo-700"}`}>
      <div className="text-xl mb-1">{icon}</div>
      <div className={`font-black text-lg ${highlight ? "text-violet-300" : "text-white"}`}>{value}</div>
      <div className="text-indigo-400 text-xs">{label}</div>
    </div>
  );
}
