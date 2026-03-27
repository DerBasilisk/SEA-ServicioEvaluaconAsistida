import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast"; // <-- Importamos Toast
import { ShieldAlert, Zap, Ghost, Trophy, X, Swords } from "lucide-react";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

import MultipleChoice from "../components/lesson/MultipleChoice";
import TrueFalse from "../components/lesson/TrueFalse";
import FillBlank from "../components/lesson/FillBlank";
import OrderItems from "../components/lesson/OrderItems";
import MatchPairs from "../components/lesson/MatchPairs";
import SentenceBuilder from "../components/lesson/Sentencebuilder";

const QUESTION_COMPONENTS = {
  multiple_choice: MultipleChoice,
  true_false: TrueFalse,
  fill_blank: FillBlank,
  order_items: OrderItems,
  match_pairs: MatchPairs,
  sentence_builder: SentenceBuilder,
};

const MODIFIERS = [
  { id: "extra_questions", icon: "➕", label: "Extra", description: "+3 preguntas al oponente" },
  { id: "reduced_time",    icon: "⏱️", label: "Tiempo", description: "El oponente tiene 10s"   },
  { id: "blackout",        icon: "🌑", label: "Oscuridad",  description: "Ciega al oponente"    },
];

export default function Duel() {
  const { duelId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const socketRef = useRef(null);

  // Estados... (se mantienen los tuyos)
  const [phase, setPhase] = useState("connecting");
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
      console.log("[Duel] Socket conectado, emitiendo join:", duelId);
      // Pequeño delay para asegurar que el middleware de auth procesó el socket
      setTimeout(() => {
        socket.emit("duel:join", { duelId });
      }, 100);
    });

    socket.on("duel:start", ({ questions: qs, opponentId: oppId }) => {
      console.log("[Duel] duel:start recibido:", data);
      toast.success("¡Duelo Iniciado! Prepárate.", { icon: '⚔️' });
      setQuestions(qs);
      setOpponentId(oppId);
      setPhase("playing");
    });

    socket.on("duel:state", (duel) => {
      console.log("[Duel] duel:state recibido:", duel);
      if (!duel || !duel.questions) return;
      setQuestions(duel.questions);
      // Encontrar el opponentId
      const oppId = Object.keys(duel.players).find((id) => id !== user?._id);
      setOpponentId(oppId);
      // Restaurar progreso propio si reconectó
      const me = duel.players[user?._id];
      if (me) {
        setCurrentIndex(me.currentIndex);
        setMyScore(me.score);
        setMyCorrect(me.correct);
      }
      const opp = duel.players[oppId];
      if (opp) setOpponentProgress({ currentIndex: opp.currentIndex, score: opp.score, correct: opp.correct });
      setPhase("playing");
    });

    socket.on("duel:modifier_received", ({ modifier }) => {
      // Notificación de ataque recibido
      toast.error(`¡ATAQUE! El oponente usó: ${modifier.label}`, {
        duration: 4000,
        icon: '⚠️',
        style: { background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444' }
      });

      if (modifier.id === "blackout") {
        setBlackout(true);
        setTimeout(() => setBlackout(false), 3000);
      }
    });

    socket.on("duel:opponent_abandoned", () => {
      toast("El oponente se ha retirado de la batalla.", { icon: '🏳️' });
      setResult({ abandoned: true });
      setPhase("result");
    });

    socket.on("duel:error", ({ message }) => {
      toast.error(message);
      navigate("/friends");
    });

    return () => socket.disconnect();
  }, [duelId, token]);

  const handleUseModifier = (modifierId) => {
    if (!opponentId || modifiersUsed.includes(modifierId)) return;
    
    socketRef.current?.emit("duel:use_modifier", { duelId, modifierId, targetId: opponentId });
    setModifiersUsed((m) => [...m, modifierId]);
    
    // Toast de confirmación de ataque
    const mod = MODIFIERS.find(m => m.id === modifierId);
    toast(`Enviando ${mod.label}...`, {
      icon: '🚀',
      style: { background: '#1e3a8a', color: '#bfdbfe' }
    });
  };

  const handleAnswer = useCallback((answer) => {
    const question = questions[currentIndex];
    socketRef.current?.emit("duel:answer", {
      duelId,
      questionId: question._id,
      answer,
    });

    socketRef.current?.once("duel:answer_result", (data) => {
      if (data.isCorrect) {
        setMyScore((s) => s + 2);
        setMyCorrect((c) => c + 1);
      }
      setFeedback(data);
      setPhase("feedback");
    });

    socketRef.current?.once("duel:finished", (data) => {
      setResult(data);
      setPhase("result");
    });

    socketRef.current?.once("duel:opponent_progress", (data) => {
      setOpponentProgress(data);
    });
  }, [duelId, currentIndex, questions]);

  const handleContinue = useCallback(() => {
    setFeedback(null);
    setCurrentIndex((i) => i + 1);
    setPhase("playing");
  }, []);

  if (phase === "connecting") return <LoadingScreen text="Estableciendo conexión segura..." />;
  if (phase === "result") return <ResultScreen result={result} userId={user?._id} total={questions.length} onBack={() => navigate("/friends")} />;

  const question = questions[currentIndex];
  const QuestionComponent = QUESTION_COMPONENTS[question?.type];

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col relative overflow-hidden">
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* Efecto de Blackout Táctico */}
      {blackout && (
        <div className="absolute inset-0 bg-black z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <Ghost size={80} className="text-red-500 animate-bounce mb-4" />
          <p className="text-red-500 text-xl font-black tracking-tighter uppercase italic">Sistema Cegado</p>
        </div>
      )}

      {/* Header Estilo SEA */}
      <div className="px-6 py-4 border-b border-white/5 bg-white/5 backdrop-blur-md flex items-center gap-6">
        <button onClick={() => navigate("/friends")} className="text-slate-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Tu Progreso</span>
              <span className="text-white font-black italic text-lg">{myCorrect} <small className="text-[10px] opacity-50">ACERTOS</small></span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Rival</span>
              <span className="text-white font-black italic text-lg">{opponentProgress.correct} <small className="text-[10px] opacity-50">ACERTOS</small></span>
            </div>
          </div>
          
          {/* Barra de Progreso Dual */}
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
            <div 
               className="absolute h-full bg-blue-500 transition-all duration-500 shadow-[0_0_10px_#3b82f6]" 
               style={{ width: `${(currentIndex / questions.length) * 100}%` }} 
            />
            <div 
               className="absolute h-full bg-rose-500 opacity-30 transition-all duration-700" 
               style={{ width: `${(opponentProgress.currentIndex / questions.length) * 100}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Modificadores (Chips de Acción) */}
      <div className="flex gap-3 px-6 py-3 bg-black/20 border-b border-white/5 overflow-x-auto no-scrollbar">
        {MODIFIERS.map((m) => (
          <button
            key={m.id}
            onClick={() => handleUseModifier(m.id)}
            disabled={modifiersUsed.includes(m.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              modifiersUsed.includes(m.id)
                ? "bg-slate-800 text-slate-600 opacity-50"
                : "bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white active:scale-90"
            }`}
          >
            <span>{m.icon}</span> {m.label}
          </button>
        ))}
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full justify-center">
        {phase === "playing" && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-white text-2xl font-black italic text-center mb-10 tracking-tight leading-tight">
              {question?.prompt}
            </h2>
            {QuestionComponent && (
              <QuestionComponent question={question} onAnswer={handleAnswer} />
            )}
          </div>
        )}

        {phase === "feedback" && feedback && (
           <div className={`w-full rounded-[2.5rem] p-8 border-2 animate-in zoom-in-95 ${
            feedback.isCorrect ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.1)]" : "bg-rose-500/10 border-rose-500/50"
          }`}>
             <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-2xl ${feedback.isCorrect ? "bg-emerald-500" : "bg-rose-500"}`}>
                  {feedback.isCorrect ? <Trophy size={24} className="text-white" /> : <ShieldAlert size={24} className="text-white" />}
                </div>
                <div>
                   <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${feedback.isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                    {feedback.isCorrect ? "Impacto Crítico" : "Fallo de Sistema"}
                   </h3>
                   <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Respuesta Procesada</p>
                </div>
             </div>

             {!feedback.isCorrect && feedback.correctAnswer && (
               <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/5">
                 <p className="text-slate-400 text-xs uppercase font-black mb-1 tracking-widest">Respuesta Correcta</p>
                 <p className="text-white font-bold">{String(feedback.correctAnswer)}</p>
               </div>
             )}

             <button 
                onClick={handleContinue} 
                className={`w-full py-5 rounded-2xl font-black italic uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg ${
                  feedback.isCorrect ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-rose-500 text-white shadow-rose-500/20"
                }`}
             >
               Continuar Duelo
             </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen({ text }) {
  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-6">
      <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-blue-400 font-black italic uppercase tracking-widest text-sm">{text}</p>
    </div>
  );
}

function ResultScreen({ result, userId, total, onBack }) {
  if (result?.abandoned) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-7xl mb-6">🏳️</div>
          <h2 className="text-white font-black italic uppercase text-3xl mb-4">El oponente se retiró</h2>
          <p className="text-slate-400 mb-8">Ganaste por abandono.</p>
          <button onClick={onBack} className="bg-blue-500 text-white font-black px-8 py-4 rounded-2xl uppercase tracking-widest">
            Volver
          </button>
        </div>
      </div>
    );
  }

  const players = result?.players || [];
  const winner = result?.winner;
  const isWinner = winner === userId;
  const me = players.find((p) => p.userId === userId);
  const opponent = players.find((p) => p.userId !== userId);

  const formatTime = (ms) => {
    if (!ms) return "--";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-8">
        <div>
          <div className="text-8xl mb-4">{isWinner ? "🏆" : "💀"}</div>
          <h2 className={`text-4xl font-black italic uppercase tracking-tighter ${isWinner ? "text-yellow-400" : "text-rose-400"}`}>
            {isWinner ? "¡Victoria!" : "Derrota"}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5 text-center">
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">Tú</p>
            <p className="text-white text-3xl font-black italic">{me?.correct ?? 0}</p>
            <p className="text-slate-500 text-xs">de {total} correctas</p>
            <p className="text-blue-400 text-xs mt-1">{formatTime(me?.timeSpent)}</p>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 text-center">
            <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest mb-2">Rival</p>
            <p className="text-white text-3xl font-black italic">{opponent?.correct ?? 0}</p>
            <p className="text-slate-500 text-xs">de {total} correctas</p>
            <p className="text-rose-400 text-xs mt-1">{formatTime(opponent?.timeSpent)}</p>
          </div>
        </div>

        <button onClick={onBack} className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all active:scale-95">
          Volver a la base
        </button>
      </div>
    </div>
  );
}