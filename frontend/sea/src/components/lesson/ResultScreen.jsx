import { Trophy, Zap, Flame, RotateCcw, ArrowRight, Star, Award } from "lucide-react";

const RESULT_CSS = `
  .result-container {
    background: var(--alt-gradient);
  }
  .stat-card {
    background: var(--glass-bg-small);
    backdrop-filter: blur(10px);
    border: 1px solid var(--glass-border);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .stat-card:hover {
    transform: translateY(-5px);
    background: var(--glass-bg);
    border: 3px solid var(--glass-border);
  }
  .success-glow {
    box-shadow: 0 0 50px rgba(43, 127, 232, 0.2);
  }
  .achievement-card {
    background: linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(43, 127, 232, 0.1) 100%);
    border-left: 4px solid #2B7FE8;
  }
`;

export default function ResultScreen({ result, lesson, onContinue, onRetry }) {
  if (!result) return null;

  const { score = 0, xpEarned = 0, leveledUp, newLevel, newStreak, newAchievements = [], failed } = result;

  // ── PANTALLA DE FALLO (Sin Corazones) ──
  if (failed) {
    return (
      <div className="result-container min-h-screen flex flex-col items-center justify-center px-6 py-8">
        <style>{RESULT_CSS}</style>
        <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative inline-block">
            <div className="text-8xl filter drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">💔</div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Misión Fallida</h1>
            <p className="text-rose-400 font-bold uppercase tracking-widest text-xs">Se agotaron los núcleos de vida</p>
          </div>

          <div className="stat-card rounded-3xl p-6 border-rose-500/30">
            <p className="text-slate-300 text-sm leading-relaxed italic">
              "El fracaso es solo un fragmento de datos en el camino a la maestría. Recarga tus sistemas y vuelve a intentarlo."
            </p>
          </div>

          <div className="grid gap-3 pt-4">
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-3 bg-white text-[--text-primary] font-black py-5 rounded-2xl transition-all active:scale-95 shadow-xl hover:bg-slate-100 uppercase italic tracking-widest text-sm"
            >
              <RotateCcw size={20} /> Reintentar Protocolo
            </button>
            <button
              onClick={onContinue}
              className="text-slate-400 font-black py-4 uppercase tracking-[0.2em] text-[10px] hover:text-white transition-colors"
            >
              Regresar al Mapa
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LÓGICA DE ÉXITO ──
  const getHeaderInfo = () => {
    if (score === 100) return { emoji: "👑", msg: "PERFECCIÓN ABSOLUTA", color: "text-[--text-alternative-a]", sub: "Sincronía del 100% con el Nodo" };
    if (score >= 80) return { emoji: "🏆", msg: "MISIÓN CUMPLIDA", color: "text-[--text-alternative-b]", sub: "Excelente rendimiento táctico" };
    return { emoji: "⚡", msg: "ENTRENAMIENTO COMPLETADO", color: "text-[--text-alternative]", sub: "Datos recolectados con éxito" };
  };

  const header = getHeaderInfo();

  return (
    <div className="result-container min-h-screen flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
      <style>{RESULT_CSS}</style>
      
      {/* Decoración de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-lg space-y-8 relative z-10 animate-in slide-in-from-bottom-8 duration-700">
        
        {/* Header de Éxito */}
        <div className="text-center space-y-4">
          <div className="text-8xl mb-6 animate-bounce-slow drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">{header.emoji}</div>
          <div className="space-y-1">
            <h1 className={`text-4xl lg:text-5xl font-black italic tracking-tighter uppercase ${header.color}`}>
              {header.msg}
            </h1>
            <p className="text-slate-400 font-bold text-sm tracking-wide uppercase">{header.sub}</p>
          </div>
          {lesson && (
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {lesson.name}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <StatBox icon={<Trophy className="text-yellow-400" />} label="Efectividad" value={`${score}%`} />
          <StatBox icon={<Zap className="text-blue-400" />} label="XP Total" value={`+${xpEarned}`} />
          <StatBox icon={<Flame className="text-orange-500" />} label="Racha" value={`${newStreak || 0} DÍAS`} />
        </div>

        {/* Eventos Especiales: Level Up */}
        {leveledUp && (
          <div className="stat-card rounded-[2rem] p-6 border-yellow-500/40 bg-yellow-500/5 flex items-center gap-6 animate-pulse">
            <div className="bg-yellow-500 p-4 rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.4)]">
              <Star className="text-white fill-white" size={32} />
            </div>
            <div>
              <p className="text-yellow-500 font-black text-[10px] uppercase tracking-[0.3em]">Ascensión de Rango</p>
              <h2 className="text-white font-black italic text-2xl uppercase">Nivel {newLevel} Alcanzado</h2>
            </div>
          </div>
        )}

        {/* Logros */}
        {newAchievements?.length > 0 && (
          <div className="space-y-3">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] text-center">Nuevas Condecoraciones</p>
            {newAchievements.map((a, i) => (
              <div key={i} className="achievement-card rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-right-4" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="text-3xl">{a.icon}</div>
                <div>
                  <p className="text-white font-black italic uppercase text-sm">{a.name}</p>
                  <p className="text-slate-400 text-xs font-medium">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Acciones Finales */}
        <div className="flex flex-col gap-4 pt-6">
          <button
            onClick={onContinue}
            className="group w-full bg-[--text-accent] hover:bg-[--text-accent-hover] text-[--text-quaternary] font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3 uppercase italic tracking-widest text-sm"
          >
            Siguiente Misión <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </button>
          
          {score < 100 && (
            <button
              onClick={onRetry}
              className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white font-black py-2 uppercase tracking-[0.2em] text-[10px] transition-colors"
            >
              <RotateCcw size={14} /> Perfeccionar Resultados
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div className="stat-card rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-2">
      <div className="p-2 bg-white/5 rounded-xl">{icon}</div>
      <div className="font-black text-white text-xl italic tracking-tighter">{value}</div>
      <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{label}</div>
    </div>
  );
}