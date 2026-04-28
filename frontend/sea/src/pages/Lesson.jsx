import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  X, Heart, Lightbulb, ShieldAlert, AlertTriangle,
  AlertCircle, Sparkles, ChevronDown, ChevronUp,
} from "lucide-react";
import useAuthStore from "../store/authStore";
import api from "../api/axios";
import toast from "react-hot-toast";

import MultipleChoice  from "../components/lesson/MultipleChoice";
import TrueFalse       from "../components/lesson/TrueFalse";
import FillBlank       from "../components/lesson/FillBlank";
import OrderItems      from "../components/lesson/OrderItems";
import MatchPairs      from "../components/lesson/MatchPairs";
import SentenceBuilder from "../components/lesson/Sentencebuilder";
import ResultScreen    from "../components/lesson/ResultScreen";
import NoHeartsPanel   from "../components/lesson/Noheartspanel";
import FreeText        from "../components/lesson/FreeText";
import Typing          from "../components/lesson/Typing";
import CodePython      from "../components/lesson/CodePython";

/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
const LESSON_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  .lesson-container {
    background: var(--bg-gradient);
    font-family: 'Nunito', sans-serif;
    color: var(--text-primary);
  }
  .sea-glass-panel {
    background: var(--glass-bg);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 2px solid var(--glass-border);
    box-shadow: 0 15px 35px var(--glass-shadow);
  }
  .progress-track {
    background: var(--progress-track);
    border: 2px solid var(--glass-border);
    height: 10px;
    border-radius: 99px;
    overflow: hidden;
  }
  .progress-fill {
    background: var(--text-accent);
    height: 100%;
    border-radius: 99px;
    transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .theory-card {
    background: var(--card-bg);
    border: 2px solid var(--card-border);
    border-radius: 2rem;
    box-shadow: 0 20px 40px var(--glass-shadow);
  }

  /* ── Panel de concepto collapsible en movil ── */
  .concept-panel {
    background: var(--glass-bg);
    border: 2px solid var(--glass-border);
    border-radius: 20px;
    overflow: hidden;
  }
  .concept-body {
    overflow: hidden;
    transition: max-height 0.32s ease, opacity 0.28s ease, padding 0.28s ease;
  }
  .concept-body.open   { max-height: 800px; opacity: 1; padding-bottom: 16px; }
  .concept-body.closed { max-height: 0;     opacity: 0; padding-bottom: 0; }
  /* En desktop siempre abierto */
  @media (min-width: 1024px) {
    .concept-body { max-height: none !important; opacity: 1 !important; padding-bottom: 16px !important; }
  }

  /* ── Feedback ── */
  .feedback-panel {
    border-radius: 20px;
    border-width: 3px;
    border-style: solid;
    animation: slide-up 0.32s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @media (min-width: 640px) { .feedback-panel { border-radius: 2.5rem; } }
  @keyframes slide-up {
    from { opacity:0; transform: translateY(18px) scale(0.98); }
    to   { opacity:1; transform: none; }
  }

  /* ── Report modal / bottom sheet ── */
  .report-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.55);
    z-index: 110;
    display: flex; align-items: flex-end;
    backdrop-filter: blur(6px);
    animation: fade-in 0.15s ease both;
  }
  @media (min-width: 640px) {
    .report-overlay { align-items: center; padding: 16px; }
  }
  @keyframes fade-in { from {opacity:0} to {opacity:1} }

  .report-sheet {
    width: 100%;
    border-radius: 24px 24px 0 0;
    padding: 20px 20px calc(20px + env(safe-area-inset-bottom, 0px));
    animation: sheet-up 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
    max-height: 92vh; overflow-y: auto;
  }
  @media (min-width: 640px) {
    .report-sheet {
      max-width: 440px; margin: 0 auto;
      border-radius: 2.5rem; padding: 32px;
      animation-name: pop-in;
    }
  }
  @keyframes sheet-up { from {transform:translateY(100%)} to {transform:none} }
  @keyframes pop-in   { from {opacity:0;transform:scale(.95) translateY(8px)} to {opacity:1;transform:none} }

  [data-theme="high-contrast"] .theory-card   { border:4px solid #fff !important; background:#000 !important; }
  [data-theme="high-contrast"] .progress-fill  { background:#fff !important; }
`;

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function formatCorrectAnswer(correctAnswer, questionType) {
  if (correctAnswer === null || correctAnswer === undefined) return null;
  if (questionType === "multiple_choice") return correctAnswer.text ?? String(correctAnswer);
  if (questionType === "match_pairs" && Array.isArray(correctAnswer))
    return correctAnswer.map(p => `${p.left} → ${p.right}`).join("\n");
  if (Array.isArray(correctAnswer)) return correctAnswer.join(", ");
  if (typeof correctAnswer === "boolean") return correctAnswer ? "Verdadero" : "Falso";
  return String(correctAnswer);
}

const QUESTION_COMPONENTS = {
  multiple_choice:  MultipleChoice,
  true_false:       TrueFalse,
  fill_blank:       FillBlank,
  order_items:      OrderItems,
  match_pairs:      MatchPairs,
  sentence_builder: SentenceBuilder,
  free_text:        FreeText,
  typing:           Typing,
  code_python:      CodePython,
};

/* ─────────────────────────────────────────────
   Screens de apoyo
───────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div className="lesson-container min-h-screen flex items-center justify-center">
      <style>{LESSON_CSS}</style>
      <div className="text-center">
        <div className="w-20 h-20 bg-[var(--glass-bg)] rounded-[2rem] flex items-center
                        justify-center animate-bounce mb-5 mx-auto">
          <Sparkles size={36} className="text-[#2B7FE8]" />
        </div>
        <p className="text-[var(--text-primary)] font-black italic uppercase tracking-widest text-[11px]">
          Preparando Entorno…
        </p>
      </div>
    </div>
  );
}

function ErrorScreen({ message, onBack }) {
  return (
    <div className="lesson-container min-h-screen flex items-center justify-center p-5">
      <style>{LESSON_CSS}</style>
      <div className="sea-glass-panel rounded-[2.5rem] p-10 text-center max-w-md w-full">
        <div className="text-5xl mb-5">🛰️</div>
        <h2 className="font-black italic uppercase text-xl mb-3 text-[var(--text-primary)]">
          Se ha perdido el enlace
        </h2>
        <p className="text-[var(--text-secondary)] font-bold mb-7 italic text-sm">{message}</p>
        <button onClick={onBack}
          className="w-full bg-[var(--text-primary)] text-[var(--btn-text)] font-black
                     py-4 rounded-2xl uppercase text-[10px] tracking-widest">
          Regresar a Base
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Componente principal
───────────────────────────────────────────── */
export default function Lesson() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { fetchMe } = useAuthStore();

  const [phase,        setPhase]        = useState("loading");
  const [lesson,       setLesson]       = useState(null);
  const [questions,    setQuestions]    = useState([]);
  const [theorySlides, setTheorySlides] = useState([]);
  const [theoryIndex,  setTheoryIndex]  = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hearts,       setHearts]       = useState(5);
  const [xpEarned,     setXpEarned]     = useState(0);
  const [feedback,     setFeedback]     = useState(null);
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState(null);
  const [hintUsed,     setHintUsed]     = useState(false);
  const [showHint,     setShowHint]     = useState(false);
  const [conceptOpen,  setConceptOpen]  = useState(true);
  const [reportModal,  setReportModal]  = useState(false);
  const [reportReason, setReportReason] = useState(null);
  const [reportComment,setReportComment]= useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── Init ── */
  useEffect(() => {
    api.post(`/lessons/${id}/start`)
      .then(({ data }) => {
        setLesson(data.data.lesson);
        setQuestions(data.data.questions);
        setHearts(data.data.hearts);
        const slides = data.data.theorySlides || [];
        setTheorySlides(slides);
        setPhase(slides.length > 0 ? "theory" : "playing");
      })
      .catch(err => {
        setError(err.response?.data?.message || "Error al cargar la lección");
        setPhase("error");
      });
  }, [id]);

  /* ── Complete ── */
  const handleComplete = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data } = await api.post(`/lessons/${id}/complete`);
      setResult(data.data);
      await fetchMe();
    } catch {
      setResult({ score: 0, xpEarned, newAchievements: [], failed: false });
    } finally {
      setPhase("result");
      setIsSubmitting(false);
    }
  }, [id, xpEarned, fetchMe, isSubmitting]);

  /* ── Answer ── */
  const handleAnswer = useCallback(async (answer) => {
    const question = questions[currentIndex];
    if (!question) return { isCorrect: false };

    try {
      const isTyping         = question.type === "typing" && answer?.typed !== undefined;
      const normalizedAnswer = isTyping ? answer.typed : answer;
      const typingMeta       = isTyping
        ? { wpm: answer.wpm, accuracy: answer.accuracy, timeMs: answer.timeMs }
        : undefined;

      const { data } = await api.post(`/lessons/${id}/answer`, {
        questionId: question._id,
        answer:     normalizedAnswer,
        hintUsed,
        ...(typingMeta && { typingStats: typingMeta }),
      });

      const resp = data.data;

      // Update hearts only when wrong AND server returns a value
      if (!resp.isCorrect && resp.heartsRemaining !== null && resp.heartsRemaining !== undefined) {
        setHearts(resp.heartsRemaining);
      }
      // Accumulate XP
      if (resp.xpEarned) setXpEarned(p => p + resp.xpEarned);

      setFeedback(resp);
      // free_text stays in "playing" — it renders its own continue button inline
      if (question.type !== "free_text") setPhase("feedback");

      return resp;
    } catch (err) {
      console.error(err);
      return { isCorrect: false };
    }
  }, [id, currentIndex, questions, hintUsed]);

  /* ── Continue ── */
  const handleContinue = useCallback(async () => {
    // LOGIC FIX: if hearts just hit 0 from the last wrong answer, abandon now
    if (hearts === 0) {
      await api.post(`/lessons/${id}/abandon`).catch(() => {});
      setResult({ score: 0, xpEarned, newAchievements: [], failed: true });
      await fetchMe();
      setPhase("result");
      return;
    }

    const next = currentIndex + 1;
    if (next >= questions.length) {
      await handleComplete();
      return;
    }

    setCurrentIndex(next);
    setFeedback(null);
    setHintUsed(false);
    setShowHint(false);
    setConceptOpen(true);
    setPhase("playing");
  }, [hearts, currentIndex, questions, handleComplete, id, xpEarned, fetchMe]);

  /* ── Abandon ── */
  const handleAbandon = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await api.post(`/lessons/${id}/abandon`).catch(() => {});
    navigate(-1);
  }, [id, navigate, isSubmitting]);

  /* ── Hint ── */
  const handleUseHint = useCallback(() => {
    setHintUsed(true);
    setShowHint(true);
  }, []);

  /* ── Report ── */
  const openReport = useCallback(() => setReportModal(true), []);

  const handleSendReport = async () => {
    if (!reportReason) { toast.error("Selecciona un motivo antes de enviar"); return; }
    const reasonKeys = ["wrong_answer", "unclear", "typo", "too_hard", "other"];
    const tid = toast.loading("Enviando reporte…");
    try {
      await api.post(`/questions/${questions[currentIndex]._id}/report`, {
        reason:  reasonKeys[reportReason - 1],
        comment: reportComment,
      });
      toast.success("¡Anomalía reportada, recluta!", { id: tid });
      setReportModal(false);
      setReportReason(null);
      setReportComment("");
    } catch {
      toast.error("Fallo al enviar el reporte", { id: tid });
    }
  };

  /* ── Phase gates ── */
  if (phase === "loading") return <LoadingScreen />;
  if (phase === "error")   return <ErrorScreen message={error} onBack={() => navigate(-1)} />;
  if (phase === "result")  return (
    <ResultScreen
      result={result} lesson={lesson}
      onContinue={() => navigate(-1)}
      onRetry={() => window.location.reload()}
    />
  );

  /* ══════════════════════════════════════════
     FASE TEORÍA
  ══════════════════════════════════════════ */
  if (phase === "theory") {
    const slide  = theorySlides[theoryIndex];
    const isLast = theoryIndex >= theorySlides.length - 1;

    return (
      <div className="lesson-container min-h-screen flex flex-col">
        <style>{LESSON_CSS}</style>

        <header className="sticky top-0 z-50 px-4 sm:px-6 py-3 flex items-center gap-4
                           backdrop-blur-md bg-[var(--glass-bg)]/60
                           border-b border-[var(--glass-border)]">
          <button onClick={handleAbandon}
            className="p-2 hover:bg-white/40 rounded-xl transition
                       text-[var(--text-secondary)] shrink-0">
            <X size={20} />
          </button>
          <div className="flex-1 flex gap-1.5">
            {theorySlides.map((_, i) => (
              <div key={i}
                className={`flex-1 h-2 rounded-full transition-all duration-500
                  ${i <= theoryIndex ? "bg-[#2B7FE8]" : "bg-[var(--progress-track)]"}`}
              />
            ))}
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center
                         px-4 sm:px-8 py-8 gap-6 max-w-xl mx-auto w-full">
          <div className="text-6xl sm:text-7xl">{slide?.icon || "📖"}</div>

          <div className="theory-card w-full p-6 sm:p-10 text-center">
            <h2 className="font-black italic uppercase tracking-tighter leading-none
                           mb-4 text-2xl sm:text-3xl text-[var(--text-primary)]">
              {slide?.title}
            </h2>
            <p className="text-[var(--text-secondary)] text-base sm:text-lg
                          leading-relaxed font-semibold">
              {slide?.content}
            </p>
          </div>

          <button
            onClick={() => isLast ? setPhase("playing") : setTheoryIndex(i => i + 1)}
            className="w-full bg-[#2B7FE8] text-white font-black py-4 sm:py-5
                       rounded-2xl uppercase tracking-wider text-sm sm:text-base"
          >
            {isLast ? "Iniciar Evaluación →" : "Siguiente →"}
          </button>
        </main>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     FASE EJERCICIOS
  ══════════════════════════════════════════ */
  const question          = questions[currentIndex];
  const QuestionComponent = question ? QUESTION_COMPONENTS[question.type] : null;
  const progress          = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;
  const hasConcept        = Boolean(question?.conceptExplanation);

  return (
    <div className="lesson-container min-h-screen flex flex-col">
      <style>{LESSON_CSS}</style>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 px-4 sm:px-6 py-3 flex items-center gap-3
                         backdrop-blur-md bg-[var(--glass-bg)]/70
                         border-b border-[var(--glass-border)]">
        <button onClick={handleAbandon}
          className="p-2 hover:bg-white/40 rounded-xl transition
                     text-[var(--text-secondary)] shrink-0">
          <X size={20} />
        </button>
        <div className="flex-1 progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center gap-1.5 bg-[var(--glass-bg)] px-3 py-1.5
                        rounded-2xl border-2 border-[var(--glass-border)] shrink-0">
          <Heart size={15} className="text-rose-500 fill-rose-500" />
          <span className="font-black text-[var(--text-primary)] text-sm">{hearts}</span>
        </div>
      </header>

      {/*
        LAYOUT:
        Móvil  (<lg):  columna única — concept panel collapsible arriba, luego prompt + pregunta
        Desktop (≥lg): sidebar concepto izq + columna pregunta der
      */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6
                       px-3 sm:px-5 lg:px-8
                       py-4 lg:py-6
                       max-w-6xl mx-auto w-full lg:items-start">

        {/* ── Concept / Hint ── */}
        {hasConcept && (
          <aside className="w-full lg:w-[320px] xl:w-[360px] shrink-0">
            <div className="concept-panel">
              {/* Cabecera — siempre visible; toggle solo activo en móvil */}
              <button
                className="w-full flex items-center justify-between gap-3 px-4 py-3"
                onClick={() => setConceptOpen(v => !v)}
                aria-expanded={conceptOpen}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-[#2B7FE8] p-1.5 rounded-lg shrink-0">
                    <Lightbulb size={13} className="text-white" />
                  </div>
                  <h3 className="text-[var(--text-primary)] font-black uppercase italic
                                 text-[11px] tracking-tight">
                    Manual de Nodo
                  </h3>
                </div>
                <span className="lg:hidden text-[var(--text-secondary)]">
                  {conceptOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </span>
              </button>

              {/* Body */}
              <div className={`concept-body px-4 ${conceptOpen ? "open" : "closed"}`}>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-medium mb-5">
                  {question.conceptExplanation}
                </p>

                <div className="border-t border-[var(--glass-border)] pt-4">
                  {!showHint ? (
                    <button
                      onClick={handleUseHint}
                      disabled={hintUsed || phase !== "playing"}
                      className="w-full flex items-center justify-between
                                 bg-[var(--clue-bg)] border-2 border-[var(--clue-border)]
                                 text-[var(--clue-text)] font-black py-2.5 px-4 rounded-xl
                                 text-[10px] uppercase tracking-wider disabled:opacity-40
                                 transition-all hover:scale-[1.01]"
                    >
                      <span>{hintUsed ? "Pista Consumida" : "Solicitar Pista"}</span>
                      {!hintUsed && <span className="opacity-60">-50% XP</span>}
                    </button>
                  ) : (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3">
                      <p className="text-amber-700 text-xs font-bold italic leading-relaxed">
                        {question.hint}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* ── Zona de pregunta ── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Prompt */}
          <div>
            <p className="text-[#2B7FE8] text-[10px] font-black uppercase tracking-[0.28em] mb-2">
              Objetivo {currentIndex + 1} de {questions.length}
            </p>
            <h2 className="text-[var(--text-primary)] font-black italic tracking-tighter leading-tight
                           text-xl sm:text-2xl lg:text-3xl">
              {question?.prompt}
            </h2>
          </div>

          {/* Componente de pregunta */}
          {phase === "playing" && question && (
            <>
              {QuestionComponent ? (
                <QuestionComponent
                  question={question}
                  onAnswer={handleAnswer}
                  onReport={openReport}
                />
              ) : (
                <div className="p-8 text-center text-rose-400 font-bold text-sm">
                  Tipo no soportado: {question.type}
                </div>
              )}

              {/* free_text: botón de continuar aparece inline tras recibir feedback */}
              {question.type === "free_text" && feedback && (
                <button
                  onClick={handleContinue}
                  className="w-full mt-2 bg-[#2B7FE8] text-white font-black py-4
                             rounded-2xl uppercase text-[10px] tracking-widest"
                >
                  Continuar Misión
                </button>
              )}
            </>
          )}

          {/* Feedback panel */}
          {phase === "feedback" && feedback && (
            <FeedbackPanel
              feedback={feedback}
              hearts={hearts}
              question={question}
              onContinue={handleContinue}
              onRefilled={() => setHearts(5)}
              onComplete={handleComplete}
              onAbandon={handleAbandon}   // ← nuevo
              onReport={openReport}
            />
          )}
        </div>
      </main>

      {/* ── Report modal — bottom sheet móvil / dialog desktop ── */}
      {reportModal && (
        <div className="report-overlay" onClick={() => setReportModal(false)}>
          <div
            className="report-sheet bg-[var(--card-bg)] border border-[var(--card-border)] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle visual (solo móvil) */}
            <div className="w-8 h-1 bg-[var(--glass-border)] rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center gap-3 mb-5">
              <div className="bg-amber-500/10 p-2.5 rounded-2xl shrink-0">
                <AlertTriangle className="text-amber-500" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black italic text-[var(--text-primary)] uppercase leading-none">
                  Reportar Anomalía
                </h3>
                <p className="text-[var(--text-secondary)] text-[9px] font-bold uppercase tracking-wider mt-0.5">
                  Control de Calidad
                </p>
              </div>
              <button
                onClick={() => setReportModal(false)}
                className="p-2 rounded-xl hover:bg-[var(--glass-bg)] transition
                           text-[var(--text-secondary)] shrink-0"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-2 mb-5">
              {["Respuesta incorrecta", "No está clara", "Error ortográfico", "Muy difícil", "Otro"].map((text, i) => (
                <button
                  key={i}
                  onClick={() => setReportReason(i + 1)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-[11px] font-bold
                              transition-all border
                    ${reportReason === i + 1
                      ? "bg-[var(--text-accent)] border-[var(--text-accent)] text-[var(--btn-text)] translate-x-1"
                      : "bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)]"
                    }`}
                >
                  {i + 1}. {text}
                </button>
              ))}
            </div>

            <textarea
              value={reportComment}
              onChange={e => setReportComment(e.target.value)}
              placeholder="Detalles adicionales (opcional)…"
              className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)]
                         rounded-2xl p-4 text-[var(--text-primary)] text-sm h-20 mb-5
                         outline-none focus:border-[var(--text-accent)] resize-none"
            />

            <div className="flex gap-3">
              <button
                onClick={handleSendReport}
                className="flex-1 bg-[var(--text-accent)] text-[var(--btn-text)]
                           font-black py-3.5 rounded-2xl text-[10px] uppercase tracking-wider"
              >
                Enviar Informe
              </button>
              <button
                onClick={() => setReportModal(false)}
                className="px-5 bg-[var(--glass-bg)] border border-[var(--glass-border)]
                           text-[var(--text-secondary)] font-black py-3.5 rounded-2xl
                           text-[10px] uppercase"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   FeedbackPanel
───────────────────────────────────────────── */
function FeedbackPanel({ feedback, hearts, question, onContinue, onRefilled, onComplete, onAbandon, onReport }) {
  const { isCorrect, explanation, correctAnswer } = feedback;

  // Sin corazones y fallo → pantalla especial
  if (hearts === 0 && !isCorrect) {
    return <NoHeartsPanel onRefilled={onRefilled} onContinue={onAbandon} />;
  }

  const accentColor  = isCorrect ? "var(--correct)"    : "var(--incorrect)";
  const bgColor      = isCorrect ? "var(--correct-bg)" : "var(--incorrect-bg)";
  const textOnAccent = isCorrect ? "#000"               : "#fff";

  return (
    <div
      className="feedback-panel p-5 sm:p-8 shadow-2xl"
      style={{ backgroundColor: bgColor, borderColor: accentColor }}
    >
      {/* Título */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-2xl shadow-md shrink-0"
             style={{ backgroundColor: accentColor }}>
          {isCorrect
            ? <Sparkles size={17} style={{ color: textOnAccent }} />
            : <AlertCircle size={17} className="text-white" />
          }
        </div>
        <h3 className="text-lg sm:text-2xl font-black italic uppercase tracking-tighter">
          {isCorrect ? "¡Sincronía Perfecta!" : "Error de Conexión"}
        </h3>
      </div>

      {/* Respuesta correcta */}
      {!isCorrect && formatCorrectAnswer(correctAnswer, question?.type) && (
        <div className="bg-[var(--progress-track)] p-4 rounded-2xl mb-4
                        border border-[var(--glass-border)]">
          <p className="text-[9px] font-black uppercase tracking-widest mb-1.5"
             style={{ color: accentColor }}>
            Protocolo Correcto:
          </p>
          <p className="text-base font-black italic text-[var(--text-primary)]
                        leading-snug whitespace-pre-line">
            {formatCorrectAnswer(correctAnswer, question?.type)}
          </p>
        </div>
      )}

      {/* Explicación */}
      {explanation && (
        <p className="text-[var(--text-secondary)] font-semibold text-sm mb-5
                      leading-relaxed italic border-l-4 border-[var(--text-accent)] pl-4">
          {explanation}
        </p>
      )}

      {/* Botones */}
      <div className="flex gap-3">
        <button
          onClick={onContinue}
          className="flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest
                     transition-all active:scale-95 border-2 border-white/20 shadow-lg"
          style={{ backgroundColor: accentColor, color: textOnAccent }}
        >
          Continuar
        </button>
        <button
          onClick={() => onReport(question?._id)}
          className="px-4 sm:px-5 flex items-center justify-center rounded-2xl
                     transition-all border-2 border-[var(--card-border)]
                     bg-[var(--card-bg)] text-[var(--text-secondary)]
                     hover:bg-[var(--incorrect)] hover:text-white
                     hover:border-[var(--incorrect)]"
          aria-label="Reportar pregunta"
        >
          <ShieldAlert size={18} />
        </button>
      </div>
    </div>
  );
}