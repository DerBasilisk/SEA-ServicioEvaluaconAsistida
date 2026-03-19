import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

import MultipleChoice from "../components/lesson/MultipleChoice";
import TrueFalse from "../components/lesson/TrueFalse";
import FillBlank from "../components/lesson/FillBlank";
import OrderItems from "../components/lesson/OrderItems";
import MatchPairs from "../components/lesson/MatchPairs";
import SentenceBuilder from "../components/lesson/Sentencebuilder";
import ResultScreen from "../components/lesson/ResultScreen";
import NoHeartsPanel from "../components/lesson/Noheartspanel";

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

  const [phase, setPhase] = useState("loading"); // loading | theory | playing | feedback | result
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
  const [conceptOpen, setConceptOpen] = useState(true); // panel izquierdo abierto por defecto

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
    if (nextIndex >= questions.length || hearts === 0) {
      await handleComplete();
      return;
    }
    setCurrentIndex(nextIndex);
    setFeedback(null);
    setHintUsed(false);
    setShowHint(false);
    setConceptOpen(true);
    setPhase("playing");
  }, [hearts, currentIndex, questions, handleComplete]);

  const handleRefilled = useCallback(() => {
    setHearts(5);
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) { handleComplete(); return; }
    setCurrentIndex(nextIndex);
    setFeedback(null);
    setHintUsed(false);
    setShowHint(false);
    setPhase("playing");
  }, [currentIndex, questions, handleComplete]);

  const handleAbandon = async () => {
    await api.post(`/lessons/${id}/abandon`).catch(() => {});
    navigate(-1);
  };

  const handleUseHint = () => {
    setHintUsed(true);
    setShowHint(true);
  };

  // ── Renders ────────────────────────────────────────────────

  if (phase === "loading") return <LoadingScreen />;
  if (phase === "error")   return <ErrorScreen message={error} onBack={() => navigate(-1)} />;
  if (phase === "result")  return (
    <ResultScreen result={result} lesson={lesson}
      onContinue={() => navigate(-1)} onRetry={() => window.location.reload()} />
  );

  // Pantalla de teoría
  if (phase === "theory") {
    const slide = theorySlides[theoryIndex];
    const isLast = theoryIndex >= theorySlides.length - 1;
    return (
      <div className="min-h-screen bg-indigo-950 flex flex-col">
        <div className="px-4 py-3 flex items-center gap-4 border-b border-indigo-800">
          <button onClick={handleAbandon} className="text-indigo-400 hover:text-white transition text-xl font-bold">✕</button>
          <div className="flex-1 flex gap-1">
            {theorySlides.map((_, i) => (
              <div key={i} className={`flex-1 h-2 rounded-full transition-all ${i <= theoryIndex ? "bg-violet-500" : "bg-indigo-800"}`} />
            ))}
          </div>
          <span className="text-indigo-400 text-sm">{theoryIndex + 1}/{theorySlides.length}</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto w-full">
          <div className="text-6xl mb-4">{slide?.icon || "📖"}</div>
          <h2 className="text-white font-black text-2xl text-center mb-6">{slide?.title}</h2>

          <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-6 w-full mb-6">
            <p className="text-indigo-100 text-lg leading-relaxed">{slide?.content}</p>
            {slide?.example && (
              <div className="mt-4 bg-indigo-800 rounded-xl px-4 py-3 text-center">
                <p className="text-indigo-300 text-xs mb-1">Ejemplo</p>
                <p className="text-white font-black text-xl">{slide.example}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (isLast) setPhase("playing");
              else setTheoryIndex((i) => i + 1);
            }}
            className="w-full bg-violet-500 hover:bg-violet-400 text-white font-black py-4 rounded-xl transition active:scale-95 text-lg"
          >
            {isLast ? "¡Empezar ejercicios! →" : "Siguiente →"}
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const QuestionComponent = QUESTION_COMPONENTS[question?.type];
  const progress = (currentIndex / questions.length) * 100;

  if (phase === "playing" && (!question || !QuestionComponent)) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-indigo-950 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-4 border-b border-indigo-800 flex-shrink-0">
        <button onClick={handleAbandon} className="text-indigo-400 hover:text-white transition text-xl font-bold">✕</button>
        <div className="flex-1 bg-indigo-800 rounded-full h-3">
          <div className="bg-violet-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-lg ${i < hearts ? "opacity-100" : "opacity-20"}`}>❤️</span>
          ))}
        </div>
      </div>

      {/* Contador */}
      <p className="text-indigo-400 text-xs text-center py-2 flex-shrink-0">
        Pregunta {currentIndex + 1} de {questions.length}
      </p>

      {/* Layout dividido */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-4 px-4 pb-4 max-w-5xl mx-auto w-full">

        {/* Panel izquierdo — Concepto */}
        {question?.conceptExplanation && (
          <div className="lg:w-2/5 flex-shrink-0">
            {/* Mobile: colapsable */}
            <div className="lg:hidden mb-3">
              <button
                onClick={() => setConceptOpen((o) => !o)}
                className="w-full flex items-center justify-between bg-indigo-800 border border-indigo-600 rounded-xl px-4 py-2 text-sm text-indigo-300 font-bold"
              >
                <span>💡 Ver concepto</span>
                <span>{conceptOpen ? "▲" : "▼"}</span>
              </button>
            </div>

            {/* Panel */}
            <div className={`${conceptOpen ? "block" : "hidden"} lg:block bg-indigo-900 border border-indigo-700 rounded-2xl p-5 h-full`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">💡</span>
                <h3 className="text-violet-300 font-bold text-sm">Concepto clave</h3>
              </div>
              <p className="text-indigo-100 text-sm leading-relaxed">{question.conceptExplanation}</p>

              {/* Pista */}
              <div className="mt-4 border-t border-indigo-700 pt-4">
                {!showHint ? (
                  <button
                    onClick={handleUseHint}
                    disabled={hintUsed || phase !== "playing"}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold py-2 rounded-xl text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    🔍 {hintUsed ? "Pista usada (-50% XP)" : "Ver pista (-50% XP)"}
                  </button>
                ) : (
                  <div className="bg-amber-900/30 border border-amber-500/40 rounded-xl p-3">
                    <p className="text-amber-300 text-xs font-bold mb-1">🔍 Pista</p>
                    <p className="text-amber-100 text-sm">{question.hint}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Panel derecho — Pregunta */}
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-white text-xl lg:text-2xl font-bold text-center mb-6 leading-snug">
            {question?.prompt}
          </h2>

          {QuestionComponent && phase === "playing" && (
            <QuestionComponent question={question} onAnswer={handleAnswer} />
          )}

          {phase === "feedback" && feedback && hearts > 0 && (
            <FeedbackPanel feedback={feedback} onContinue={handleContinue} />
          )}

          {phase === "feedback" && hearts === 0 && (
            <NoHeartsPanel onRefilled={handleRefilled} onContinue={handleComplete} />
          )}
        </div>
      </div>
    </div>
  );
}

function FeedbackPanel({ feedback, onContinue }) {
  const { isCorrect, explanation, correctAnswer } = feedback;
  return (
    <div className={`w-full rounded-2xl p-6 border-2 ${isCorrect ? "bg-emerald-900 border-emerald-500" : "bg-red-900 border-red-500"}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{isCorrect ? "✅" : "❌"}</span>
        <h3 className={`text-xl font-black ${isCorrect ? "text-emerald-300" : "text-red-300"}`}>
          {isCorrect ? "¡Correcto!" : "Incorrecto"}
        </h3>
      </div>
      {!isCorrect && correctAnswer !== undefined && correctAnswer !== null && (
        <p className="text-white text-sm mb-2">
          <span className="text-indigo-300">Respuesta correcta: </span>
          <span className="font-bold">
            {Array.isArray(correctAnswer) && correctAnswer[0]?.left
              ? correctAnswer.map((p, i) => <span key={i} className="block">{p.left} → {p.right}</span>)
              : Array.isArray(correctAnswer) ? correctAnswer.join(", ")
              : typeof correctAnswer === "boolean" ? (correctAnswer ? "Verdadero" : "Falso")
              : typeof correctAnswer === "object" ? correctAnswer.text || JSON.stringify(correctAnswer)
              : String(correctAnswer)}
          </span>
        </p>
      )}
      {explanation && <p className="text-indigo-200 text-sm mb-4">{explanation}</p>}
      <button onClick={onContinue}
        className={`w-full py-3 rounded-xl font-bold transition active:scale-95 ${isCorrect ? "bg-emerald-500 hover:bg-emerald-400 text-white" : "bg-red-500 hover:bg-red-400 text-white"}`}>
        Continuar
      </button>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">🎓</div>
        <p className="text-indigo-300">Cargando lección...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message, onBack }) {
  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-white font-bold mb-2">No se pudo cargar la lección</p>
        <p className="text-indigo-400 mb-6">{message}</p>
        <button onClick={onBack} className="bg-violet-500 text-white font-bold px-6 py-3 rounded-xl">Volver</button>
      </div>
    </div>
  );
}
