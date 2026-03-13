import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

import MultipleChoice from "../components/lesson/MultipleChoice";
import TrueFalse from "../components/lesson/TrueFalse";
import FillBlank from "../components/lesson/FillBlank";
import OrderItems from "../components/lesson/OrderItems";
import MatchPairs from "../components/lesson/MatchPairs";
import SentenceBuilder from "../components/lesson/Sentencebuilder";

const QUESTION_COMPONENTS = {
  multiple_choice: MultipleChoice, true_false: TrueFalse,
  fill_blank: FillBlank, order_items: OrderItems,
  match_pairs: MatchPairs, sentence_builder: SentenceBuilder,
};

const MODIFIERS = [
  { id: "extra_questions", icon: "➕", label: "Preguntas extra", description: "+3 preguntas al oponente" },
  { id: "reduced_time",    icon: "⏱️", label: "Tiempo reducido", description: "El oponente tiene 10s"   },
  { id: "blackout",        icon: "🌑", label: "Pantalla oscura",  description: "3s de pantalla negra"    },
];

export default function Duel() {
  const { duelId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const socketRef = useRef(null);

  const [phase, setPhase] = useState("connecting"); // connecting | playing | feedback | result
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [result, setResult] = useState(null);
  const [opponentProgress, setOpponentProgress] = useState({ currentIndex: 0, score: 0, correct: 0 });
  const [blackout, setBlackout] = useState(false);
  const [modifiersUsed, setModifiersUsed] = useState([]);
  const [opponentId, setOpponentId] = useState(null);
  const [myScore, setMyScore] = useState(0);
  const [myCorrect, setMyCorrect] = useState(0);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000", {
      auth: { token },
      path: "/socket.io",
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("duel:join", { duelId });
    });

    socket.on("duel:state", (duel) => {
      if (duel.questions) { setQuestions(duel.questions); setPhase("playing"); }
    });

    socket.on("duel:start", ({ questions: qs, opponentId: oppId }) => {
      setQuestions(qs);
      setOpponentId(oppId);
      setPhase("playing");
    });

    socket.on("duel:answer_result", (data) => {
      if (data.isCorrect) { setMyScore((s) => s + 2); setMyCorrect((c) => c + 1); }
      setFeedback(data);
      setPhase("feedback");
    });

    socket.on("duel:opponent_progress", (data) => {
      setOpponentProgress(data);
    });

    socket.on("duel:modifier_received", ({ modifier }) => {
      if (modifier.id === "blackout") {
        setBlackout(true);
        setTimeout(() => setBlackout(false), 3000);
      }
    });

    socket.on("duel:finished", (data) => {
      setResult(data);
      setPhase("result");
    });

    socket.on("duel:opponent_abandoned", () => {
      setResult({ abandoned: true });
      setPhase("result");
    });

    socket.on("duel:error", ({ message }) => {
      alert(message);
      navigate("/friends");
    });

    return () => socket.disconnect();
  }, [duelId, token]);

  const handleAnswer = useCallback((answer) => {
    const question = questions[currentIndex];
    socketRef.current?.emit("duel:answer", {
      duelId,
      questionId: question._id,
      answer,
      timeSpent: 0,
    });
  }, [duelId, currentIndex, questions]);

  const handleContinue = useCallback(() => {
    const next = currentIndex + 1;
    if (next >= questions.length) return; // esperar resultado del servidor
    setCurrentIndex(next);
    setFeedback(null);
    setPhase("playing");
  }, [currentIndex, questions]);

  const handleUseModifier = (modifierId) => {
    if (!opponentId || modifiersUsed.includes(modifierId)) return;
    socketRef.current?.emit("duel:use_modifier", { duelId, modifierId, targetId: opponentId });
    setModifiersUsed((m) => [...m, modifierId]);
  };

  const handleAbandon = () => {
    socketRef.current?.emit("duel:abandon", { duelId });
    navigate("/friends");
  };

  if (phase === "connecting") return <LoadingScreen text="Conectando al duelo..." />;

  if (phase === "result") return (
    <ResultScreen result={result} userId={user?._id} myScore={myScore} myCorrect={myCorrect}
      total={questions.length} opponentProgress={opponentProgress} onBack={() => navigate("/friends")} />
  );

  const question = questions[currentIndex];
  const QuestionComponent = QUESTION_COMPONENTS[question?.type];

  return (
    <div className="min-h-screen bg-indigo-950 flex flex-col relative">
      {/* Blackout */}
      {blackout && (
        <div className="absolute inset-0 bg-black z-50 flex items-center justify-center">
          <p className="text-white text-2xl font-black animate-pulse">🌑 Pantalla oscura</p>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-indigo-800 flex items-center gap-3">
        <button onClick={handleAbandon} className="text-indigo-400 hover:text-white text-xl font-bold">✕</button>

        {/* Mi progreso */}
        <div className="flex-1">
          <div className="flex justify-between text-xs text-indigo-400 mb-1">
            <span>Vos: {myCorrect} ✓</span>
            <span>Oponente: {opponentProgress.correct} ✓</span>
          </div>
          <div className="w-full bg-indigo-800 rounded-full h-2 relative">
            {/* Mi barra */}
            <div className="bg-violet-500 h-2 rounded-full transition-all absolute"
              style={{ width: `${(currentIndex / questions.length) * 100}%` }} />
            {/* Barra oponente */}
            <div className="bg-red-400 h-2 rounded-full transition-all absolute opacity-60"
              style={{ width: `${(opponentProgress.currentIndex / questions.length) * 100}%` }} />
          </div>
        </div>

        <span className="text-white text-sm font-bold">{currentIndex + 1}/{questions.length}</span>
      </div>

      {/* Modificadores */}
      <div className="flex gap-2 px-4 py-2 border-b border-indigo-900">
        {MODIFIERS.map((m) => (
          <button
            key={m.id}
            onClick={() => handleUseModifier(m.id)}
            disabled={modifiersUsed.includes(m.id)}
            title={m.description}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
              modifiersUsed.includes(m.id)
                ? "bg-indigo-900 text-indigo-600 cursor-not-allowed"
                : "bg-red-900 border border-red-600 text-red-300 hover:bg-red-800 active:scale-95"
            }`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Pregunta */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-2xl mx-auto w-full">
        <h2 className="text-white text-2xl font-bold text-center mb-8">{question?.prompt}</h2>

        {QuestionComponent && phase === "playing" && (
          <QuestionComponent question={question} onAnswer={handleAnswer} />
        )}

        {phase === "feedback" && feedback && (
          <div className={`w-full rounded-2xl p-6 border-2 ${
            feedback.isCorrect ? "bg-emerald-900 border-emerald-500" : "bg-red-900 border-red-500"
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{feedback.isCorrect ? "✅" : "❌"}</span>
              <h3 className={`text-xl font-black ${feedback.isCorrect ? "text-emerald-300" : "text-red-300"}`}>
                {feedback.isCorrect ? "¡Correcto!" : "Incorrecto"}
              </h3>
            </div>
            {!feedback.isCorrect && feedback.correctAnswer && (
              <p className="text-white text-sm mb-3">
                <span className="text-indigo-300">Respuesta correcta: </span>
                <span className="font-bold">{String(feedback.correctAnswer)}</span>
              </p>
            )}
            {feedback.explanation && <p className="text-indigo-200 text-sm mb-4">{feedback.explanation}</p>}
            <button onClick={handleContinue} className={`w-full py-3 rounded-xl font-bold transition active:scale-95 ${
              feedback.isCorrect ? "bg-emerald-500 hover:bg-emerald-400 text-white" : "bg-red-500 hover:bg-red-400 text-white"
            }`}>
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultScreen({ result, userId, myScore, myCorrect, total, opponentProgress, onBack }) {
  if (result?.abandoned) return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🏳️</div>
        <h2 className="text-white font-black text-2xl mb-2">El oponente abandonó</h2>
        <p className="text-emerald-400 font-bold mb-6">¡Ganaste por abandono!</p>
        <button onClick={onBack} className="bg-violet-500 text-white font-bold px-6 py-3 rounded-xl">Volver</button>
      </div>
    </div>
  );

  const isWinner = result?.winner === userId;
  const myEntry = result?.players?.find((p) => p.userId === userId);
  const oppEntry = result?.players?.find((p) => p.userId !== userId);

  return (
    <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="text-7xl mb-3">{isWinner ? "🏆" : "😤"}</div>
          <h1 className={`text-4xl font-black ${isWinner ? "text-yellow-400" : "text-red-400"}`}>
            {isWinner ? "¡Ganaste!" : "Perdiste"}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Vos", entry: myEntry, highlight: isWinner },
            { label: "Oponente", entry: oppEntry, highlight: !isWinner },
          ].map(({ label, entry, highlight }) => (
            <div key={label} className={`rounded-2xl p-4 text-center border-2 ${
              highlight ? "bg-yellow-900 border-yellow-500" : "bg-indigo-900 border-indigo-700"
            }`}>
              <p className={`font-bold text-sm mb-2 ${highlight ? "text-yellow-300" : "text-indigo-300"}`}>{label}</p>
              <p className="text-white font-black text-2xl">{entry?.correct || 0}/{total}</p>
              <p className="text-indigo-400 text-xs">respuestas correctas</p>
            </div>
          ))}
        </div>

        <button onClick={onBack} className="w-full bg-violet-500 hover:bg-violet-400 text-white font-black py-4 rounded-xl transition active:scale-95">
          Volver a amigos
        </button>
      </div>
    </div>
  );
}

function LoadingScreen({ text }) {
  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">⚔️</div>
        <p className="text-indigo-300">{text}</p>
      </div>
    </div>
  );
}