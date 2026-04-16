// frontend/sea/src/components/lesson/Typing.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Keyboard, TimerReset, Zap, CheckCircle2 } from "lucide-react";

const TYPING_CSS = `
  .typing-wrapper {
    font-family: 'Nunito', sans-serif;
  }
  .typing-input {
    caret-color: #2B7FE8;
    resize: none;
    outline: none;
  }
  .typing-input:focus {
    box-shadow: 0 0 0 3px rgba(43, 127, 232, 0.25);
  }
  .char-default  { color: var(--text-secondary); opacity: 0.55; }
  .char-correct  { color: var(--text-primary); }
  .char-wrong    { color: #EF4444; text-decoration: underline; text-underline-offset: 4px; }
  .char-cursor   { position: relative; color: var(--text-primary); }
  .char-cursor::after {
    content: '';
    position: absolute;
    left: 0; bottom: -2px;
    width: 100%; height: 2px;
    background: #2B7FE8;
    border-radius: 99px;
    animation: blink 1s step-end infinite;
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  .stat-chip {
    background: var(--glass-bg);
    backdrop-filter: blur(10px);
    border: 1.5px solid var(--glass-border);
    border-radius: 1rem;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 900;
    font-style: italic;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-primary);
  }
  .typing-progress-track {
    background: var(--progress-track);
    border: 1.5px solid var(--glass-border);
    height: 8px;
    border-radius: 99px;
    overflow: hidden;
  }
  .typing-progress-fill {
    background: #2B7FE8;
    height: 100%;
    border-radius: 99px;
    transition: width 0.15s ease-out;
  }
  .target-box {
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    border: 2px solid var(--glass-border);
    border-radius: 1.5rem;
    padding: 1.5rem 2rem;
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: 0.03em;
    line-height: 2;
    word-break: break-word;
    white-space: pre-wrap;
    box-shadow: 0 10px 30px var(--glass-shadow);
    min-height: 90px;
    user-select: none;
  }
  .input-box {
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    border: 2px solid var(--glass-border);
    border-radius: 1.5rem;
    color: var(--text-primary);
    font-size: 1.1rem;
    font-weight: 700;
    font-family: 'Nunito', sans-serif;
    padding: 1.25rem 1.5rem;
    width: 100%;
    box-shadow: 0 10px 30px var(--glass-shadow);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-box:focus { border-color: #2B7FE8; }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
  }
  .shake { animation: shake 0.35s ease; }
  .sea-btn-main {
    background: #2B7FE8;
    box-shadow: 0 10px 25px rgba(43, 127, 232, 0.3);
  }
`;

function calcWPM(chars, elapsedMs) {
  if (elapsedMs < 500) return 0;
  return Math.round((chars / 5) / (elapsedMs / 60_000));
}

function calcAccuracy(typed, target) {
  if (!typed.length) return 100;
  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) correct++;
  }
  return Math.round((correct / typed.length) * 100);
}

export default function Typing({ question, onAnswer }) {
  const targetText = String(
    question.typingText ?? question.correctAnswer ?? question.prompt ?? ""
  ).trim();

  const [typed, setTyped]       = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [elapsed, setElapsed]   = useState(0);
  const [wpm, setWpm]           = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [shaking, setShaking]   = useState(false);

  // ─── Usar refs para el timer — evita stale closures ───────────
  const inputRef     = useRef(null);
  const timerRef     = useRef(null);
  const startedRef   = useRef(false);
  const startTimeRef = useRef(null); // ← fuente de verdad del tiempo

  useEffect(() => {
    inputRef.current?.focus();
    return () => clearInterval(timerRef.current);
  }, []);

  const startTimer = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 200);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // ─── finishTyping lee siempre desde la ref — sin stale closure ─
  const finishTyping = useCallback(async (finalTyped) => {
    setSubmitted(true);
    stopTimer();

    const finalElapsed = startTimeRef.current
      ? Date.now() - startTimeRef.current
      : 0;

    const finalWpm      = calcWPM(finalTyped.length, finalElapsed);
    const finalAccuracy = calcAccuracy(finalTyped, targetText);

    setWpm(finalWpm);
    setAccuracy(finalAccuracy);

    // Solo envía — el resultado lo maneja FeedbackPanel en Lesson
    await onAnswer({
      typed: finalTyped,
      wpm: finalWpm,
      accuracy: finalAccuracy,
      timeMs: finalElapsed,
    });
  }, [onAnswer, targetText, stopTimer]);

  const handleChange = useCallback((e) => {
    if (submitted) return;

    const value = e.target.value;
    if (value.length > targetText.length) return;

    if (!startedRef.current) startTimer();

    setTyped(value);
    setAccuracy(calcAccuracy(value, targetText));
    setWpm(calcWPM(value.length, Date.now() - (startTimeRef.current ?? Date.now())));

    // Shake en caracter incorrecto
    const lastIdx = value.length - 1;
    if (value.length > 0 && value[lastIdx] !== targetText[lastIdx]) {
      setShaking(true);
      setTimeout(() => setShaking(false), 380);
    }

    // Auto-submit al completar
    if (value.length === targetText.length) {
      finishTyping(value);
    }
  }, [submitted, targetText, startTimer, finishTyping]);

  const handleManualSubmit = useCallback(() => {
    if (submitted || !typed.length) return;
    finishTyping(typed);
  }, [submitted, typed, finishTyping]);

  const progress = targetText.length
    ? Math.round((typed.length / targetText.length) * 100)
    : 0;

  const formattedTime = (elapsed / 1000).toFixed(1) + "s";

  return (
    <div className="typing-wrapper w-full max-w-2xl mx-auto space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
      <style>{TYPING_CSS}</style>

      {/* Stats row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="stat-chip">
          <Zap size={14} className="text-[#2B7FE8]" />
          <span>{wpm} WPM</span>
        </div>
        <div className="stat-chip">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span>{accuracy}% Precisión</span>
        </div>
        <div className="stat-chip">
          <TimerReset size={14} className="text-amber-400" />
          <span>{formattedTime}</span>
        </div>
        <div className="flex-1 typing-progress-track min-w-[60px]">
          <div className="typing-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[10px] font-black uppercase text-[var(--text-secondary)] tabular-nums">
          {typed.length}/{targetText.length}
        </span>
      </div>

      {/* Target text */}
      <div className={`target-box ${shaking ? "shake" : ""}`}>
        {targetText.split("").map((char, i) => {
          let cls = "char-default";
          if (i < typed.length) {
            cls = typed[i] === char ? "char-correct" : "char-wrong";
          } else if (i === typed.length) {
            cls = "char-cursor";
          }
          return <span key={i} className={cls}>{char}</span>;
        })}
      </div>

      {/* Input — se oculta mientras espera respuesta del backend */}
      {!submitted ? (
        <div className="space-y-3">
          <textarea
            ref={inputRef}
            value={typed}
            onChange={handleChange}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleManualSubmit();
              }
            }}
            rows={3}
            placeholder="Empieza a escribir aquí..."
            className="typing-input input-box"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-[0.2em] flex items-center gap-2">
              <Keyboard size={12} />
              Escribe el texto exactamente como aparece
            </p>
            <button
              onClick={handleManualSubmit}
              disabled={!typed.length}
              className="sea-btn-main text-white font-black italic uppercase text-[10px] tracking-[0.2em] px-5 py-3 rounded-xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
            >
              Confirmar →
            </button>
          </div>
        </div>
      ) : (
        /* Loader mientras el backend procesa — FeedbackPanel toma el control después */
        <div className="flex items-center justify-center py-8">
          <div className="stat-chip animate-pulse">
            <Zap size={14} className="text-[#2B7FE8]" />
            <span>Procesando transmisión...</span>
          </div>
        </div>
      )}
    </div>
  );
}