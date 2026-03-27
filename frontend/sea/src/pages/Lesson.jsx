import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Heart, Lightbulb, ChevronRight, AlertCircle, Sparkles } from "lucide-react";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

// Componentes de Pregunta (Asumiendo que los importarás con el mismo estilo)
import MultipleChoice from "../components/lesson/MultipleChoice";
import TrueFalse from "../components/lesson/TrueFalse";
import FillBlank from "../components/lesson/FillBlank";
import OrderItems from "../components/lesson/OrderItems";
import MatchPairs from "../components/lesson/MatchPairs";
import SentenceBuilder from "../components/lesson/Sentencebuilder";
import ResultScreen from "../components/lesson/ResultScreen";
import NoHeartsPanel from "../components/lesson/Noheartspanel";

const LESSON_CSS = `
  .lesson-container { 
    background: linear-gradient(145deg, #C8E6FF 0%, #A8D4FF 45%, #B8CBFF 100%);
    font-family: 'Nunito', sans-serif;
  }
  .sea-glass-panel {
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(15px);
    border: 1.5px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 15px 35px rgba(43, 127, 232, 0.05);
  }
  .progress-track {
    background: rgba(255, 255, 255, 0.5);
    border: 1.5px solid white;
    height: 14px;
    border-radius: 99px;
    overflow: hidden;
  }
  .progress-fill {
    background: linear-gradient(90deg, #2B7FE8, #5B9FFF);
    box-shadow: 0 0 15px rgba(43, 127, 232, 0.4);
    transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .theory-card {
    background: white;
    border: 2px solid transparent;
    background-clip: padding-box;
    position: relative;
  }
  .theory-card::after {
    content: ''; position: absolute; inset: -3px; z-index: -1;
    background: linear-gradient(135deg, #2B7FE8, #B8CBFF);
    border-radius: 2rem;
  }
`;

const QUESTION_COMPONENTS = {
  multiple_choice: MultipleChoice,
  true_false: TrueFalse,
  fill_blank: FillBlank,
  order_items: OrderItems,
  match_pairs: MatchPairs,
  sentence_builder: SentenceBuilder,
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
  const [conceptOpen, setConceptOpen] = useState(true);

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
      const { data } = await api.post(`/lessons/${id}/answer`, {
        questionId: question._id,
        answer,
        hintUsed,
      });
      const remaining = data.data.heartsRemaining;
      if (!data.data.isCorrect && remaining !== null) setHearts(remaining);
      setXpEarned((prev) => prev + (data.data.xpEarned || 0));
      setFeedback(data.data);
      setPhase("feedback");
    } catch (err) {
      console.error(err);
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
              <div key={i} className={`flex-1 h-2.5 rounded-full transition-all duration-500 ${i <= theoryIndex ? "bg-[#2B7FE8] shadow-[0_0_10px_rgba(43,127,232,0.3)]" : "bg-white/40"}`} />
            ))}
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-between max-w-2xl w-full px-6 py-8 gap-8">
          <div className="text-7xl mb-8 animate-bounce-slow drop-shadow-xl">{slide?.icon || "📖"}</div>
          
          <div className="theory-card rounded-[2.5rem] p-10 w-full mb-10 text-center shadow-2xl">
            <h2 className="text-[#0F2547] font-black italic uppercase text-3xl tracking-tighter mb-6">{slide?.title}</h2>
            <p className="text-slate-600 text-xl leading-relaxed font-semibold">{slide?.content}</p>
            
            {slide?.example && (
              <div className="mt-8 bg-blue-50 border-2 border-dashed border-blue-200 rounded-[1.5rem] p-6">
                <p className="text-[#2B7FE8] text-[10px] font-black uppercase tracking-[0.2em] mb-2">Protocolo de Ejemplo</p>
                <p className="text-[#0F2547] font-black text-2xl italic">"{slide.example}"</p>
              </div>
            )}
          </div>

          <button
            onClick={() => isLast ? setPhase("playing") : setTheoryIndex(i => i + 1)}
            className="w-full bg-[#2B7FE8] hover:bg-[#1A6FD8] text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-200 active:scale-95 text-lg uppercase tracking-widest italic"
          >
            {isLast ? "Iniciar Evaluación →" : "Siguiente Protocolo"}
          </button>
        </main>
      </div>
    );
  }

  // ── RENDER EJERCICIOS ─────────────────────────────────────────────
  const question = questions[currentIndex];
  const QuestionComponent = QUESTION_COMPONENTS[question?.type];
  const progress = (currentIndex / questions.length) * 100;

  return (
    <div className="lesson-container min-h-screen flex flex-col overflow-hidden">
      <style>{LESSON_CSS}</style>
      
      {/* Header Táctico */}
      <header className="px-6 py-4 flex items-center gap-6 bg-white/30 backdrop-blur-md sticky top-0 z-50">
        <button onClick={handleAbandon} className="p-2 hover:bg-white/50 rounded-xl transition text-slate-500"><X size={24} /></button>
        <div className="flex-1 progress-track">
          <div className="progress-fill h-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-2xl border border-white">
          <Heart size={20} className="text-rose-500 fill-rose-500 animate-pulse" />
          <span className="font-black text-[#0F2547] text-sm">{hearts}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-8 px-8 py-6 max-w-6xl mx-auto w-full items-start lg:items-stretch">
        
        {/* Panel de Inteligencia (Concepto) */}
        {question?.conceptExplanation && (
          <aside className="lg:w-[350px] flex-shrink-0">
            <div className="sea-glass-panel rounded-[2rem] p-6 h-fit sticky top-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#2B7FE8] p-2 rounded-lg"><Lightbulb size={18} className="text-white" /></div>
                <h3 className="text-[#0F2547] font-black uppercase italic text-sm tracking-tight">Manual de Nodo</h3>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed font-medium mb-6">
                {question.conceptExplanation}
              </p>

              <div className="border-t border-white/40 pt-6">
                {!showHint ? (
                  <button
                    onClick={handleUseHint}
                    disabled={hintUsed || phase !== "playing"}
                    className="w-full group flex items-center justify-between bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 text-amber-600 font-black py-3 px-4 rounded-xl text-[10px] uppercase tracking-widest transition-all disabled:opacity-40"
                  >
                    <span>{hintUsed ? "Pista Consumida" : "Solicitar Pista"}</span>
                    {!hintUsed && <span className="text-amber-400 group-hover:translate-x-1 transition-transform">-50% XP</span>}
                  </button>
                ) : (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 animate-in zoom-in-95">
                    <p className="text-amber-700 text-xs font-bold italic leading-snug">{question.hint}</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Zona de Ejercicio */}
        <div className="flex-1 flex flex-col justify-between gap-8">
          <div className="text-center lg:text-left">
            <p className="text-[#2B7FE8] text-[10px] font-black uppercase tracking-[0.3em] mb-3">
              Objetivo {currentIndex + 1} de {questions.length}
            </p>
            <h2 className="text-[#0F2547] text-2xl lg:text-3xl font-black italic tracking-tighter leading-tight">
              {question?.prompt}
            </h2>
          </div>

          <div className="flex-1 min-h-[400px]">
            {QuestionComponent && phase === "playing" && (
              <QuestionComponent question={question} onAnswer={handleAnswer} />
            )}

            {phase === "feedback" && feedback && (
              <FeedbackPanel 
                feedback={feedback} 
                hearts={hearts}
                onContinue={handleContinue} 
                onRefilled={() => setHearts(5)}
                onComplete={handleComplete}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ── SUB-COMPONENTES ───────────────────────────────────────────────

function FeedbackPanel({ feedback, hearts, onContinue, onRefilled, onComplete }) {
  const { isCorrect, explanation, correctAnswer } = feedback;
  
  if (hearts === 0 && !isCorrect) {
    return <NoHeartsPanel onRefilled={onRefilled} onContinue={onComplete} />;
  }

  return (
    <div className={`w-full rounded-[2.5rem] p-8 border-4 animate-in slide-in-from-bottom-6 duration-500 shadow-2xl ${
      isCorrect 
        ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
        : "bg-rose-50 border-rose-200 text-rose-900"
    }`}>
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-2xl shadow-lg ${isCorrect ? "bg-emerald-500 shadow-emerald-200" : "bg-rose-500 shadow-rose-200"}`}>
          {isCorrect ? <Sparkles className="text-white" /> : <AlertCircle className="text-white" />}
        </div>
        <h3 className="text-2xl font-black italic uppercase tracking-tighter">
          {isCorrect ? "¡Sincronía Perfecta!" : "Error de Conexión"}
        </h3>
      </div>

      {!isCorrect && correctAnswer && (
        <div className="bg-white/60 p-5 rounded-2xl mb-6 border border-rose-200/50">
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-2">Protocolo Correcto:</p>
          <div className="text-lg font-black text-rose-700 italic">
             {/* Renderizado de respuesta simplificado */}
             {String(correctAnswer)}
          </div>
        </div>
      )}

      {explanation && (
        <p className="text-slate-600 font-semibold mb-8 leading-relaxed italic border-l-4 border-slate-200 pl-4">
          {explanation}
        </p>
      )}

      <button 
        onClick={onContinue}
        className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] italic transition-all shadow-xl active:scale-95 ${
          isCorrect 
            ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200" 
            : "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200"
        }`}
      >
        Continuar Misión
      </button>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen lesson-container flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl animate-bounce-slow mb-6">
           <Sparkles size={40} className="text-[#2B7FE8]" />
        </div>
        <p className="text-[#0F2547] font-black italic uppercase tracking-widest text-sm">Preparando Entorno...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message, onBack }) {
  return (
    <div className="min-h-screen lesson-container flex items-center justify-center p-6">
      <div className="sea-glass-panel rounded-[3rem] p-12 text-center max-w-md">
        <div className="text-6xl mb-6">🛰️</div>
        <h2 className="text-[#0F2547] font-black italic uppercase text-2xl mb-4 text-balance">Se ha perdido el enlace</h2>
        <p className="text-slate-500 font-bold mb-8 italic">{message}</p>
        <button onClick={onBack} className="w-full bg-[#0F2547] text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest">
          Regresar a Base
        </button>
      </div>
    </div>
  );
}