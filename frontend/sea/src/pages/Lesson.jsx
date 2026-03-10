import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

import MultipleChoice from "../components/lesson/MultipleChoice";
import TrueFalse from "../components/lesson/TrueFalse";
import FillBlank from "../components/lesson/FillBlank";
import OrderItems from "../components/lesson/OrderItems";
import MatchPairs from "../components/lesson/MatchPairs";
import ResultScreen from "../components/lesson/ResultScreen";

const QUESTION_COMPONENTS = {
  multiple_choice: MultipleChoice,
  true_false: TrueFalse,
  fill_blank: FillBlank,
  order_items: OrderItems,
  match_pairs: MatchPairs,
};

export default function Lesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchMe } = useAuthStore();

  const [phase, setPhase] = useState("loading");
  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [xpEarned, setXpEarned] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.post(`/lessons/${id}/start`)
      .then(({ data }) => {
        setLesson(data.data.lesson);
        setQuestions(data.data.questions);
        setHearts(data.data.hearts);
        setPhase("playing");
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
      });
      if (!data.data.isCorrect && data.data.heartsRemaining !== null) {
        setHearts(data.data.heartsRemaining);
      }
      setXpEarned((prev) => prev + (data.data.xpEarned || 0));
      setFeedback(data.data);
      setPhase("feedback");
    } catch (err) {
      console.error(err);
    }
  }, [id, currentIndex, questions]);

  const handleContinue = useCallback(async () => {
    if (hearts === 0) { await handleComplete(); return; }
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      await handleComplete();
    } else {
      setCurrentIndex(nextIndex);
      setFeedback(null);
      setPhase("playing");
    }
  }, [hearts, currentIndex, questions, handleComplete]);

  const handleAbandon = async () => {
    await api.post(`/lessons/${id}/abandon`).catch(() => {});
    navigate(-1);
  };

  if (phase === "loading") return <LoadingScreen />;
  if (phase === "error") return <ErrorScreen message={error} onBack={() => navigate(-1)} />;
  if (phase === "result") return (
    <ResultScreen result={result} lesson={lesson} onContinue={() => navigate(-1)} onRetry={() => window.location.reload()} />
  );

  const question = questions[currentIndex];
  const QuestionComponent = QUESTION_COMPONENTS[question?.type];
  const progress = (currentIndex / questions.length) * 100;

  return (
    <div className="min-h-screen bg-indigo-950 flex flex-col">
      <div className="px-4 py-3 flex items-center gap-4 border-b border-indigo-800">
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

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto w-full">
        <p className="text-indigo-400 text-sm mb-6">Pregunta {currentIndex + 1} de {questions.length}</p>
        <h2 className="text-white text-2xl font-bold text-center mb-8 leading-snug">{question?.prompt}</h2>

        {QuestionComponent && phase === "playing" && (
          <QuestionComponent question={question} onAnswer={handleAnswer} />
        )}

        {phase === "feedback" && feedback && (
          <FeedbackPanel feedback={feedback} onContinue={handleContinue} />
        )}
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
            {Array.isArray(correctAnswer) ? correctAnswer.join(", ")
              : typeof correctAnswer === "boolean" ? (correctAnswer ? "Verdadero" : "Falso")
              : String(correctAnswer)}
          </span>
        </p>
      )}
      {explanation && <p className="text-indigo-200 text-sm mb-4">{explanation}</p>}
      <button onClick={onContinue} className={`w-full py-3 rounded-xl font-bold transition active:scale-95 ${isCorrect ? "bg-emerald-500 hover:bg-emerald-400 text-white" : "bg-red-500 hover:bg-red-400 text-white"}`}>
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
