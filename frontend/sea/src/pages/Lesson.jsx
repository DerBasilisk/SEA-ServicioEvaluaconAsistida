import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Heart, Lightbulb, ShieldAlert, AlertTriangle, AlertCircle, Sparkles } from "lucide-react";
import useAuthStore from "../store/authStore";
import api from "../api/axios";
import toast from "react-hot-toast";

// Componentes de Pregunta (Asumiendo que los importarás con el mismo estilo)
import MultipleChoice from "../components/lesson/MultipleChoice";
import TrueFalse from "../components/lesson/TrueFalse";
import FillBlank from "../components/lesson/FillBlank";
import OrderItems from "../components/lesson/OrderItems";
import MatchPairs from "../components/lesson/MatchPairs";
import SentenceBuilder from "../components/lesson/Sentencebuilder";
import ResultScreen from "../components/lesson/ResultScreen";
import NoHeartsPanel from "../components/lesson/Noheartspanel";
import FreeText from "../components/lesson/FreeText";
import Typing from "../components/lesson/Typing";
import CodePython from "../components/lesson/CodePython";

const LESSON_CSS = `
  .lesson-container { 
    background: var(--bg-gradient);
    font-family: 'Nunito', sans-serif;
    color: var(--text-primary);
  }
  .sea-glass-panel {
    background: var(--glass-bg);
    backdrop-filter: blur(15px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 15px 35px var(--glass-shadow);
  }
  .progress-track {
    background: var(--progress-track);
    border: 1.5px solid var(--glass-border);
    height: 14px;
    border-radius: 99px;
    overflow: hidden;
  }
  .progress-fill {
    background: var(--text-accent); /* Ahora la barra de progreso usa el acento del tema */
    transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .theory-card {
    background: var(--card-bg);
    border: 2px solid var(--card-border);
    border-radius: 2rem;
    position: relative;
    box-shadow: 0 20px 40px var(--glass-shadow);
  }

  /* Ajuste para Alto Contraste en lecciones */
  [data-theme="high-contrast"] .theory-card {
    border: 4px solid #FFFFFF !important;
    background: #000000 !important;
  }
  [data-theme="high-contrast"] .progress-fill {
    background: #FFFFFF !important;
  }
`;

function formatCorrectAnswer(correctAnswer, questionType) {
  if (!correctAnswer) return null;

  // multiple_choice → { text: "...", isCorrect: true }
  if (questionType === "multiple_choice") {
    return correctAnswer.text ?? String(correctAnswer);
  }

  // match_pairs → [{ left: "...", right: "..." }]
  if (questionType === "match_pairs" && Array.isArray(correctAnswer)) {
    return correctAnswer.map(p => `${p.left} → ${p.right}`).join("\n");
  }

  // fill_blank / order_items → array de strings
  if (Array.isArray(correctAnswer)) {
    return correctAnswer.join(", ");
  }

  // true_false → boolean
  if (typeof correctAnswer === "boolean") {
    return correctAnswer ? "Verdadero" : "Falso";
  }

  return String(correctAnswer);
}

const QUESTION_COMPONENTS = {
  multiple_choice: MultipleChoice,
  true_false: TrueFalse,
  fill_blank: FillBlank,
  order_items: OrderItems,
  match_pairs: MatchPairs,
  sentence_builder: SentenceBuilder,
  free_text: FreeText,
  typing: Typing,
  code_python: CodePython,
};

export default function Lesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchMe } = useAuthStore();

  const [phase, setPhase] = useState("loading");
  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [theorySlides, setTheorySlides] = useState([]);
  const [theoryIndex, setTheoryIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [xpEarned, setXpEarned] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  // Estados para el reporte
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState(null);
  const [reportComment, setReportComment] = useState("");
  const [conceptOpen, setConceptOpen] = useState(true);

  // 1. DEFINICIÓN DE LA FUNCIÓN QUE FALTABA
  const reportCurrentQuestion = useCallback(() => {
    setReportModal(true);
  }, []);

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
      .catch((err) => {
        setError(err.response?.data?.message || "Error al cargar la lección");
        setPhase("error");
      });
  }, [id]);

  const handleComplete = useCallback(async () => {
    try {
      const { data } = await api.post(`/lessons/${id}/complete`);
      setResult(data.data);
      await fetchMe();
      setPhase("result");
    } catch {
      setPhase("result");
      setResult({ score: 0, xpEarned, newAchievements: [] });
    }
  }, [id, xpEarned, fetchMe]);

  const handleAnswer = useCallback(async (answer) => {
    const question = questions[currentIndex];
    try {
      // Typing component returns a stats object — extract just the string
      const normalizedAnswer =
        question.type === "typing" && answer?.typed !== undefined
          ? answer.typed
          : answer;

      const typingMeta =
        question.type === "typing" && answer?.typed !== undefined
          ? { wpm: answer.wpm, accuracy: answer.accuracy, timeMs: answer.timeMs }
          : undefined;

      const { data } = await api.post(`/lessons/${id}/answer`, {
        questionId: question._id,
        answer: normalizedAnswer,
        hintUsed,
        ...(typingMeta && { typingStats: typingMeta }),
      });

      const remaining = data.data.heartsRemaining;
      if (!data.data.isCorrect && remaining !== null) setHearts(remaining);

      setFeedback(data.data);

      if (question.type !== "free_text") {
        setPhase("feedback");
      }

      return data.data;
    } catch (err) {
      console.error(err);
      return { isCorrect: false };
    }
  }, [id, currentIndex, questions, hintUsed]);

  const handleContinue = useCallback(async () => {
    const nextIndex = currentIndex + 1;
    if (hearts === 0) {
      await api.post(`/lessons/${id}/abandon`).catch(() => {});
      setResult({ score: 0, xpEarned, newAchievements: [], failed: true });
      await fetchMe();
      setPhase("result");
      return;
    }
    if (nextIndex >= questions.length) {
      await handleComplete();
      return;
    }
    setCurrentIndex(nextIndex);
    setFeedback(null);
    setHintUsed(false);
    setShowHint(false);
    setConceptOpen(true);
    setPhase("playing");
  }, [hearts, currentIndex, questions, handleComplete, id, xpEarned, fetchMe]);

  const handleSendReport = async () => {
    if (!reportReason) {
      toast.error("Selecciona un motivo antes de enviar");
      return;
    }

    const loadingToast = toast.loading("Enviando reporte...");

    try {
      const reasonOptions = [
        "wrong_answer",
        "unclear",
        "typo",
        "too_hard",
        "other"
      ];

      await api.post(`/questions/${questions[currentIndex]._id}/report`, {
        reason: reasonOptions[reportReason - 1],
        comment: reportComment
      });

      toast.success("Anomalía reportada. ¡Gracias, recluta!", { id: loadingToast });
      setReportModal(false);
      setReportReason(null);
      setReportComment("");
    } catch (err) {
      toast.error("Fallo al enviar el reporte", { id: loadingToast });
    }
  };

  const handleAbandon = async () => {
    await api.post(`/lessons/${id}/abandon`).catch(() => {});
    navigate(-1);
  };

  const handleUseHint = () => {
    setHintUsed(true);
    setShowHint(true);
  };

  if (phase === "loading") return <LoadingScreen />;
  if (phase === "error") return <ErrorScreen message={error} onBack={() => navigate(-1)} />;
  if (phase === "result") return <ResultScreen result={result} lesson={lesson} onContinue={() => navigate(-1)} onRetry={() => window.location.reload()} />;

  // ── RENDER TEORÍA ────────────────────────────────────────────────
  if (phase === "theory") {
     const slide = theorySlides[theoryIndex];
      const isLast = theoryIndex >= theorySlides.length - 1;
      return (
        <div className="lesson-container min-h-screen flex flex-col items-center">
          <style>{LESSON_CSS}</style>
          <header className="w-full px-6 py-4 flex items-center gap-6">
            <button onClick={handleAbandon} className="p-2 hover:bg-white/50 rounded-xl transition text-slate-500"><X size={24} /></button>
            <div className="flex-1 flex gap-2">
              {theorySlides.map((_, i) => (
                <div key={i} className={`flex-1 h-2.5 rounded-full transition-all duration-500 ${i <= theoryIndex ? "bg-[#2B7FE8]" : "bg-white/40"}`} />
              ))}
            </div>
          </header>
          <main className="flex-1 flex flex-col items-center justify-between max-w-2xl w-full px-6 py-8 gap-8">
            <div className="text-7xl mb-8 animate-bounce-slow">{slide?.icon || "📖"}</div>
            <div className="theory-card rounded-[2.5rem] p-10 w-full mb-10 text-center shadow-2xl">
              <h2 className="text-[--text-primary] font-black italic uppercase text-3xl mb-6">{slide?.title}</h2>
              <p className="text-slate-600 text-xl leading-relaxed font-semibold">{slide?.content}</p>
            </div>
            <button onClick={() => isLast ? setPhase("playing") : setTheoryIndex(i => i + 1)} className="w-full bg-[#2B7FE8] text-white font-black py-5 rounded-2xl">
              {isLast ? "Iniciar Evaluación →" : "Siguiente Protocolo"}
            </button>
          </main>
        </div>
      );
  }

  // ── RENDER EJERCICIOS ──
  const question = questions[currentIndex];
  const QuestionComponent = QUESTION_COMPONENTS[question?.type];
  const progress = (currentIndex / questions.length) * 100;

  return (
    <div className="lesson-container min-h-screen flex flex-col overflow-hidden">
      <style>{LESSON_CSS}</style>
      
      <header className="px-6 py-4 flex items-center gap-6 bg-white/30 backdrop-blur-md sticky top-0 z-50">
        <button onClick={handleAbandon} className="p-2 hover:bg-white/50 rounded-xl transition text-slate-500"><X size={24} /></button>
        <div className="flex-1 progress-track">
          <div className="progress-fill h-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-2xl border border-white">
          <Heart size={20} className="text-rose-500 fill-rose-500 animate-pulse" />
          <span className="font-black text-[--text-primary] text-sm">{hearts}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-8 px-8 py-6 max-w-6xl mx-auto w-full items-start lg:items-stretch">
        
        {/* Panel de Inteligencia */}
        {question?.conceptExplanation && (
          <aside className="lg:w-[350px] flex-shrink-0">
            <div className="sea-glass-panel rounded-[2rem] p-6 h-fit sticky top-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#2B7FE8] p-2 rounded-lg"><Lightbulb size={18} className="text-white" /></div>
                <h3 className="text-[--text-primary] font-black uppercase italic text-sm tracking-tight">Manual de Nodo</h3>
              </div>
              <p className="text-[--text-secondary] text-sm leading-relaxed font-medium mb-6">{question.conceptExplanation}</p>
              <div className="border-t border-white/40 pt-6">
                {!showHint ? (
                  <button onClick={handleUseHint} disabled={hintUsed || phase !== "playing"} className="w-full flex items-center justify-between bg-[var(--clue-bg)] border-2 border-[var(--clue-border)] text-[var(--clue-text)] font-black py-3 px-4 rounded-xl text-[10px] uppercase">
                    <span>{hintUsed ? "Pista Consumida" : "Solicitar Pista"}</span>
                    {!hintUsed && <span className="text-[var(--clue-border)]">-50% XP</span>}
                  </button>
                ) : (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 animate-in zoom-in-95">
                    <p className="text-amber-700 text-xs font-bold italic">{question.hint}</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Zona de Ejercicio */}
        <div className="flex-1 flex flex-col justify-between gap-8">
          <div className="text-center lg:text-left">
            <p className="text-[#2B7FE8] text-[10px] font-black uppercase tracking-[0.3em] mb-3">Objetivo {currentIndex + 1} de {questions.length}</p>
            <h2 className="text-[--text-primary] text-2xl lg:text-3xl font-black italic tracking-tighter leading-tight">{question?.prompt}</h2>
          </div>

          <div className="flex-1 min-h-[400px]">
            {phase === "playing" && question && (
            <>
              {QuestionComponent ? (
                <QuestionComponent
                  question={question}
                  onAnswer={handleAnswer}
                  onReport={reportCurrentQuestion}
                />
              ) : (
                <div className="p-10 text-center text-red-400">
                  Tipo no soportado: {question.type}
                </div>
              )}

              {/* Botón continuar para free_text, que no usa FeedbackPanel */}
              {question.type === "free_text" && feedback && (
                <button
                  onClick={handleContinue}
                  className="w-full mt-6 bg-[#2B7FE8] text-white font-black py-5 rounded-2xl uppercase text-xs tracking-widest"
                >
                  Continuar Misión
                </button>
              )}
            </>
          )}

            {phase === "feedback" && feedback && (
              <FeedbackPanel 
                feedback={feedback} 
                hearts={hearts}
                question={question} 
                onContinue={handleContinue} 
                onRefilled={() => setHearts(5)}
                onComplete={handleComplete}
                onReport={reportCurrentQuestion}  
              />
            )}
          </div>
        </div>

        {/* MODAL DE REPORTE TÁCTICO */}
        {reportModal && (
         <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--card-bg)] border-2 border-[var(--card-border)] w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-amber-500/10 p-3 rounded-2xl">
                <AlertTriangle className="text-amber-500" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black italic text-[var(--text-primary)] uppercase">Reportar Anomalía</h3><p className="text-slate-400 text-[10px] font-bold uppercase">Control de Calidad de Datos</p>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {["Respuesta incorrecta", "No está clara", "Error ortográfico", "Muy difícil", "Otro"].map((text, i) => (
                  <button key={i} onClick={() => setReportReason(i + 1)} className={`w-full text-left px-5 py-3 rounded-xl text-xs font-bold transition-all border ${reportReason === i + 1 ? "bg-indigo-600 border-indigo-400 text-white translate-x-2" : "bg-slate-800/50 border-white/5 text-slate-400"}`}>
                    {i + 1}. {text}
                  </button>
                ))}
              </div>

              <textarea value={reportComment} onChange={(e) => setReportComment(e.target.value)} placeholder="Detalles adicionales..." className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-white text-sm h-24 mb-6" />

              <div className="flex gap-3">
                <button onClick={handleSendReport} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl">Enviar Informe</button>
                <button onClick={() => setReportModal(false)} className="px-6 bg-slate-800 text-slate-400 font-black py-4 rounded-2xl">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── SUB-COMPONENTES ───────────────────────────────────────────────

function FeedbackPanel({ feedback, hearts, question, onContinue, onRefilled, onComplete, onReport }) {
  const { isCorrect, explanation, correctAnswer } = feedback;

  const panelStyle = {
    backgroundColor: isCorrect ? 'var(--correct-bg)' : 'var(--incorrect-bg)',
    borderColor: isCorrect ? 'var(--correct)' : 'var(--incorrect)',
    color: 'var(--text-primary)'
  };

  const iconBg = isCorrect ? 'var(--correct)' : 'var(--incorrect)';
  
  if (hearts === 0 && !isCorrect) {
    return <NoHeartsPanel onRefilled={onRefilled} onContinue={onComplete} />;
  }

  return (
    <div 
      style={panelStyle}
      className="w-full rounded-[2.5rem] p-8 border-4 animate-in slide-in-from-bottom-6 duration-500 shadow-2xl"
    >
      <div className="flex items-center gap-4 mb-6">
        <div 
          style={{ backgroundColor: iconBg }} 
          className="p-3 rounded-2xl shadow-lg"
        >
          {isCorrect ? <Sparkles className="text-black" /> : <AlertCircle className="text-white" />}
        </div>
        <h3 className="text-2xl font-black italic uppercase tracking-tighter">
          {isCorrect ? "¡Sincronía Perfecta!" : "Error de Conexión"}
        </h3>
      </div>

      {!isCorrect && correctAnswer && (
        <div className="bg-[var(--progress-track)] p-5 rounded-2xl mb-6 border border-[var(--glass-border)]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--incorrect)] mb-2">
            Protocolo Correcto:
          </p>
          <div className="text-lg font-black italic" style={{ color: 'var(--text-primary)' }}>
             {formatCorrectAnswer(correctAnswer, question.type)}
          </div>
        </div>
      )}

      {explanation && (
        <p className="text-[var(--text-secondary)] font-semibold mb-8 leading-relaxed italic border-l-4 border-[var(--text-accent)] pl-4">
          {explanation}
        </p>
      )}

      <div className="grid grid-cols-12 gap-4">
        <button 
          onClick={onContinue}
          style={{ backgroundColor: iconBg, color: isCorrect ? '#000' : '#fff' }}
          className="col-span-9 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] italic transition-all shadow-xl active:scale-95 border-2 border-white/20"
        >
          Continuar Misión
        </button>

        <button
          onClick={() => onReport(question._id)}
          className="col-span-3 flex items-center justify-center bg-[var(--card-bg)] text-[var(--incorrect)] py-5 rounded-2xl font-black transition-all border-2 border-[var(--card-border)] hover:bg-[var(--incorrect)] hover:text-white"
        >
          <ShieldAlert size={24} />
        </button>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="bg-[var(--bg-gradient)] min-h-screen lesson-container flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 bg-[var(--bg-gradient)] rounded-[2rem] flex items-center justify-center animate-bounce-slow mb-6">
           <Sparkles size={40} className="text-[#2B7FE8]" />
        </div>
        <p className="text-[var(--text-primary)] font-black italic uppercase tracking-widest text-sm">Preparando Entorno...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message, onBack }) {
  return (
    <div className="min-h-screen lesson-container flex items-center justify-center p-6">
      <div className="sea-glass-panel rounded-[3rem] p-12 text-center max-w-md">
        <div className="text-6xl mb-6">🛰️</div>
        <h2 className="text-[--text-primary] font-black italic uppercase text-2xl mb-4 text-balance">Se ha perdido el enlace</h2>
        <p className="text-slate-500 font-bold mb-8 italic">{message}</p>
        <button onClick={onBack} className="w-full bg-[--text-primary] text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest">
          Regresar a Base
        </button>
      </div>
    </div>
  );
}