// frontend/sea/src/components/lesson/Typing.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle2, AlertCircle, Keyboard, TimerReset, Zap } from "lucide-react";

const TYPING_CSS = `
  .typing-wrapper {
    font-family: 'Nunito', sans-serif;
  }

  /* ── CAMPO DE TEXTO ── */
  .typing-input {
    caret-color: #2B7FE8;
    resize: none;
    outline: none;
  }
  .typing-input:focus {
    box-shadow: 0 0 0 3px rgba(43, 127, 232, 0.25);
  }

  /* ── TEXTO OBJETIVO ── */
  .char-default  { color: var(--text-secondary); opacity: 0.55; }
  .char-correct  { color: var(--text-primary); }
  .char-wrong    { color: #EF4444; text-decoration: underline; text-underline-offset: 4px; }
  .char-cursor   {
    position: relative;
    color: var(--text-primary);
  }
  .char-cursor::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -2px;
    width: 100%;
    height: 2px;
    background: #2B7FE8;
    border-radius: 99px;
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }

  /* ── STAT CHIPS ── */
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

  /* ── PROGRESS BAR ── */
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

  /* ── TARGET TEXT BOX ── */
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

  /* ── INPUT BOX ── */
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
  .input-box:focus {
    border-color: #2B7FE8;
  }

  /* ── SHAKE ── */
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
  }
  .shake { animation: shake 0.35s ease; }

  /* ── RESULT OVERLAY ── */
  .result-overlay {
    animation: pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  @keyframes pop-in {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* ── SEA BTN ── */
  .sea-btn-main {
    background: #2B7FE8;
    box-shadow: 0 10px 25px rgba(43, 127, 232, 0.3);
  }
`;

// ── Helpers ─────────────────────────────────────────────────────────

function calcWPM(chars, elapsedMs) {
  if (elapsedMs < 500) return 0;
  const minutes = elapsedMs / 60_000;
  const words = chars / 5; // convención estándar
  return Math.round(words / minutes);
}

function calcAccuracy(typed, target) {
  if (!typed.length) return 100;
  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) correct++;
  }
  return Math.round((correct / typed.length) * 100);
}

// ── Componente principal ─────────────────────────────────────────────

export default function Typing({ question, onAnswer }) {
  // El texto objetivo viene en question.correctAnswer (string)
  // o en question.prompt (fallback).
  const targetText = String(
    question.typingText ?? question.correctAnswer ?? question.prompt ?? ""
  ).trim();

  const [typed, setTyped]           = useState("");
  const [submitted, setSubmitted]   = useState(false);
  const [isCorrect, setIsCorrect]   = useState(null);
  const [startTime, setStartTime]   = useState(null);
  const [elapsed, setElapsed]       = useState(0);   // ms
  const [wpm, setWpm]               = useState(0);
  const [accuracy, setAccuracy]     = useState(100);
  const [shaking, setShaking]       = useState(false);

  const inputRef     = useRef(null);
  const timerRef     = useRef(null);
  const startedRef   = useRef(false);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
    return () => clearInterval(timerRef.current);
  }, []);

  // Live timer
  const startTimer = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const t0 = Date.now();
    setStartTime(t0);
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - t0);
    }, 200);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // Manejo del input
  const handleChange = useCallback(
    (e) => {
      if (submitted) return;

      const value = e.target.value;

      // Prevent typing past target length
      if (value.length > targetText.length) return;

      // Start timer on first keystroke
      if (!startedRef.current) startTimer();

      setTyped(value);
      setAccuracy(calcAccuracy(value, targetText));
      setWpm(calcWPM(value.length, elapsed || 1));

      // Wrong char → shake
      const lastIdx = value.length - 1;
      if (value.length > 0 && value[lastIdx] !== targetText[lastIdx]) {
        setShaking(true);
        setTimeout(() => setShaking(false), 380);
      }

      // Auto-submit when complete
      if (value.length === targetText.length) {
        stopTimer();
        finishTyping(value);
      }
    },
    [submitted, targetText, elapsed, startTimer, stopTimer]
  );

  const finishTyping = useCallback(
    async (finalTyped) => {
      setSubmitted(true);
      const finalElapsed = Date.now() - (startTime ?? Date.now());
      const finalWpm      = calcWPM(finalTyped.length, finalElapsed);
      const finalAccuracy = calcAccuracy(finalTyped, targetText);

      setWpm(finalWpm);
      setAccuracy(finalAccuracy);

      const perfect = finalTyped === targetText;

      try {
        const result = await onAnswer({
          typed: finalTyped,
          wpm: finalWpm,
          accuracy: finalAccuracy,
          timeMs: finalElapsed,
          isCorrect: perfect,
        });
        setIsCorrect(result?.isCorrect ?? perfect);
      } catch {
        setIsCorrect(perfect);
      }
    },
    [onAnswer, targetText, startTime]
  );

  // Manual submit (Ctrl+Enter o botón)
  const handleManualSubmit = () => {
    if (submitted || !typed.length) return;
    stopTimer();
    finishTyping(typed);
  };

  // Stats
  const progress = targetText.length
    ? Math.round((typed.length / targetText.length) * 100)
    : 0;

  const formattedTime = (elapsed / 1000).toFixed(1) + "s";

  // ── RENDER ──────────────────────────────────────────────────────────
  return (
    <div className="typing-wrapper w-full max-w-2xl mx-auto space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
      <style>{TYPING_CSS}</style>

      {/* ── Stats row ── */}
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

      {/* ── Target text ── */}
      <div className={`target-box ${shaking ? "shake" : ""}`}>
        {targetText.split("").map((char, i) => {
          let cls = "char-default";
          if (i < typed.length) {
            cls = typed[i] === char ? "char-correct" : "char-wrong";
          } else if (i === typed.length) {
            cls = "char-cursor";
          }
          return (
            <span key={i} className={cls}>
              {char}
            </span>
          );
        })}
      </div>

      {/* ── Input ── */}
      {!submitted ? (
        <div className="space-y-3">
          <textarea
            ref={inputRef}
            value={typed}
            onChange={handleChange}
            onKeyDown={(e) => {
              // Ctrl+Enter → submit
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
        /* ── Result overlay ── */
        <div className="result-overlay rounded-[2rem] p-7 border-4 shadow-2xl"
          style={{
            backgroundColor: isCorrect ? "var(--correct-bg)" : "var(--incorrect-bg)",
            borderColor:     isCorrect ? "var(--correct)"    : "var(--incorrect)",
          }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className="p-3 rounded-2xl"
              style={{ backgroundColor: isCorrect ? "var(--correct)" : "var(--incorrect)" }}
            >
              {isCorrect
                ? <CheckCircle2 size={22} className="text-white" />
                : <AlertCircle  size={22} className="text-white" />}
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-[var(--text-primary)]">
                {isCorrect ? "¡Transmisión Completada!" : "Error en la Transmisión"}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                {isCorrect
                  ? "Protocolo ejecutado sin fallos"
                  : "Revisa los caracteres incorrectos"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { label: "Velocidad", value: `${wpm} WPM`,   icon: <Zap size={14} /> },
              { label: "Precisión", value: `${accuracy}%`, icon: <CheckCircle2 size={14} /> },
              { label: "Tiempo",    value: formattedTime,  icon: <TimerReset size={14} /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="stat-chip flex-col items-start gap-1 py-3">
                <div className="flex items-center gap-1.5 text-[#2B7FE8]">{icon}<span>{label}</span></div>
                <span className="text-2xl font-black text-[var(--text-primary)]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}