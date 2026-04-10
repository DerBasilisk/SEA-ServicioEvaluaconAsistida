import { useState } from "react";
import { Send, Loader2, Flag, CheckCircle2, AlertCircle, Award, RefreshCcw } from "lucide-react";

const FREE_TEXT_CSS = `
  .sea-input-area {
    background: var(--card-bg);
    border: 2px solid var(--glass-border);
    color: var(--text-primary);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .sea-input-area:focus {
    border-color: var(--text-accent);
    background: var(--glass-bg);
    box-shadow: 0 8px 32px var(--glass-shadow);
    outline: none;
  }
  .feedback-card {
    animation: slideUp 0.5s ease-out;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

export default function FreeText({ 
  question, 
  onAnswer,
  onReport, 
  disabled = false 
}) {
  const [userAnswer, setUserAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async () => {
    if (!userAnswer.trim() || submitting) return;
    setSubmitting(true);

    try {
      const result = await onAnswer(userAnswer.trim());
      setFeedback({
        score: result.score,
        approved: result.isCorrect || result.approved,
        feedback: result.feedback,
        strengths: result.strengths,
        improvements: result.improvements,
      });
    } catch (err) {
      setFeedback({
        approved: false,
        feedback: "Error en el motor de evaluación. Inténtalo de nuevo.",
      });
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="space-y-6">
      <style>{FREE_TEXT_CSS}</style>

      {/* Enunciado con estilo de Tarjeta SEA */}
      <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[2.5rem] p-8 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-[var(--text-accent)] text-[var(--btn-text)] text-[10px] font-black uppercase tracking-widest rounded-full">
            Pregunta Abierta
          </span>
        </div>
        <p className="text-lg text-[var(--text-primary)] font-bold leading-relaxed italic">
          "{question.prompt}"
        </p>
        
        {question.evaluationCriteria && (
          <div className="mt-6 p-4 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-2xl">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2 font-black">
              Criterios de evaluación
            </p>
            <p className="text-sm text-[var(--text-secondary)] italic opacity-80">
              {question.evaluationCriteria}
            </p>
          </div>
        )}
      </div>

      {/* Área de escritura */}
      <div className="space-y-3">
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={disabled || submitting || !!feedback}
          placeholder="Desarrolla tu respuesta aquí..."
          className="sea-input-area w-full h-48 rounded-[2rem] px-6 py-5 text-base font-medium resize-none disabled:opacity-50"
        />
      </div>

      {/* Botones */}
      {!feedback && (
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={!userAnswer.trim() || submitting || disabled}
            className="flex-1 bg-[var(--text-accent)] hover:opacity-90 text-[var(--btn-text)] py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-blue-500/10"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sincronizando con IA...
              </>
            ) : (
              <>
                <Send size={18} />
                Enviar a Evaluación
              </>
            )}
          </button>

          <button
            onClick={onReport}
            className="px-6 py-4 bg-[var(--card-bg)] hover:bg-rose-500/10 text-rose-500 border border-[var(--glass-border)] rounded-2xl transition-all"
            title="Reportar problema"
          >
            <Flag size={20} />
          </button>
        </div>
      )}

      {/* Feedback Card con IA */}
      {feedback && (
        <div className={`feedback-card p-8 rounded-[2.5rem] border ${
          feedback.approved ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'
        }`}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {feedback.approved ? <CheckCircle2 className="text-emerald-500" size={20} /> : <AlertCircle className="text-amber-500" size={20} />}
                <span className={`text-xs font-black uppercase tracking-widest ${feedback.approved ? 'text-emerald-500' : 'text-amber-500'}`}>
                  Resultado del Análisis
                </span>
              </div>
              <h3 className="text-[var(--text-primary)] font-black text-2xl">
                {feedback.approved ? "¡Misión Cumplida!" : "Revisión Necesaria"}
              </h3>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-black italic ${feedback.approved ? 'text-emerald-400' : 'text-amber-400'}`}>
                {feedback.score}<span className="text-sm opacity-50 text-[var(--text-primary)]">/{question.maxScore || 10}</span>
              </div>
            </div>
          </div>

          <p className="text-[var(--text-primary)] leading-relaxed mb-6 font-medium italic bg-white/5 p-4 rounded-xl border border-white/5">
            "{feedback.feedback}"
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {feedback.strengths && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Award size={12} /> Fortalezas
                </p>
                <p className="text-[var(--text-secondary)] text-sm leading-snug">{feedback.strengths}</p>
              </div>
            )}

            {feedback.improvements && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                  <RefreshCcw size={12} className="animate-spin-slow" /> Optimización
                </p>
                <p className="text-[var(--text-secondary)] text-sm leading-snug">{feedback.improvements}</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => { setFeedback(null); setUserAnswer(""); }}
            className="w-full mt-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors"
          >
            ¿Reintentar este desafío?
          </button>
        </div>
      )}
    </div>
  );
}