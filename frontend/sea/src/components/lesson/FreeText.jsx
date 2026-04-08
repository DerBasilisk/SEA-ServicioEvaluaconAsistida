import { useState } from "react";
import { Send, Loader2, Flag } from "lucide-react";

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

      // result debería venir del backend con la evaluación
      setFeedback({
        score: result.score,
        approved: result.isCorrect || result.approved,
        feedback: result.feedback,
        strengths: result.strengths,
        improvements: result.improvements,
      });

    } catch (err) {
      console.error(err);
      setFeedback({
        approved: false,
        feedback: "Hubo un error al evaluar tu respuesta. Inténtalo de nuevo.",
      });
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Enunciado */}
      <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8">
        <p className="text-lg text-white leading-relaxed">{question.prompt}</p>
        
        {question.evaluationCriteria && (
          <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700 rounded-2xl">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Criterios de evaluación</p>
            <p className="text-sm text-gray-300 italic">{question.evaluationCriteria}</p>
          </div>
        )}
      </div>

      {/* Área de escritura */}
      <div className="space-y-3">
        <label className="text-gray-400 text-sm font-medium block">
          Tu respuesta:
        </label>
        
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={disabled || submitting}
          placeholder="Escribe tu respuesta aquí... Sé lo más claro y completo posible."
          className="w-full h-48 bg-gray-900 border border-gray-700 rounded-3xl px-6 py-5 text-white resize-y min-h-[180px] focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all disabled:opacity-50"
        />
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!userAnswer.trim() || submitting || disabled}
          className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        >
          {submitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Evaluando con IA...
            </>
          ) : (
            <>
              <Send size={20} />
              Enviar Respuesta
            </>
          )}
        </button>

        <button
          onClick={reportQuestion}
          className="px-6 py-4 bg-gray-800 hover:bg-red-500/10 text-red-400 rounded-2xl transition-all flex items-center gap-2"
          title="Reportar pregunta"
        >
          <Flag size={20} />
        </button>
      </div>

      {/* Feedback después de responder */}
      {feedback && (
        <div className={`p-6 rounded-3xl border ${feedback.approved ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`text-2xl font-bold ${feedback.approved ? 'text-emerald-400' : 'text-amber-400'}`}>
              {feedback.score} / {question.maxScore || 10}
            </div>
            <div className="text-sm text-gray-400">
              {feedback.approved ? "¡Excelente!" : "Puedes mejorar"}
            </div>
          </div>

          <p className="text-white leading-relaxed mb-4">{feedback.feedback}</p>

          {feedback.strengths && (
            <div className="mt-4">
              <p className="text-emerald-400 text-sm font-medium">Fortalezas:</p>
              <p className="text-gray-300 text-sm">{feedback.strengths}</p>
            </div>
          )}

          {feedback.improvements && (
            <div className="mt-3">
              <p className="text-amber-400 text-sm font-medium">Sugerencias de mejora:</p>
              <p className="text-gray-300 text-sm">{feedback.improvements}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}