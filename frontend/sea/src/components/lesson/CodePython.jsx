// frontend/sea/src/components/lesson/CodePython.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, CheckCircle2, XCircle, Loader2, RotateCcw,
  Terminal, Cpu, ChevronDown, ChevronUp, AlertTriangle
} from "lucide-react";

// ── CSS ──────────────────────────────────────────────────────────────
const CODE_CSS = `
  .cp-wrapper { font-family: 'Nunito', sans-serif; }

  /* ── EDITOR ── */
  .cp-editor-shell {
    background: #0d1117;
    border: 2px solid var(--glass-border);
    border-radius: 1.5rem;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    transition: border-color 0.2s;
  }
  .cp-editor-shell:focus-within { border-color: #2B7FE8; }

  .cp-editor-topbar {
    background: #161b22;
    border-bottom: 1px solid #30363d;
    padding: 0.6rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .cp-dot {
    width: 12px; height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .cp-editor-body {
    display: flex;
    overflow: hidden;
    max-height: 380px;
  }

  /* Line numbers */
  .cp-line-nums {
    background: #0d1117;
    padding: 1rem 0.75rem 1rem 1rem;
    color: #484f58;
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
    font-size: 0.8rem;
    line-height: 1.6;
    text-align: right;
    user-select: none;
    min-width: 3rem;
    overflow: hidden;
    border-right: 1px solid #21262d;
    flex-shrink: 0;
  }
  .cp-line-nums div { min-height: 1.28rem; }

  /* Textarea */
  .cp-textarea {
    flex: 1;
    background: #0d1117;
    color: #e6edf3;
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
    font-size: 0.8rem;
    line-height: 1.6;
    padding: 1rem 1.25rem;
    resize: none;
    border: none;
    outline: none;
    overflow-y: auto;
    white-space: pre;
    overflow-wrap: normal;
    overflow-x: auto;
    caret-color: #2B7FE8;
  }
  .cp-textarea::selection { background: rgba(43,127,232,0.3); }
  .cp-textarea::placeholder { color: #484f58; }

  /* ── CONSOLE ── */
  .cp-console {
    background: #0d1117;
    border: 2px solid #21262d;
    border-radius: 1.25rem;
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
    font-size: 0.75rem;
    color: #7ee787;
    padding: 1rem 1.25rem;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 120px;
    overflow-y: auto;
    line-height: 1.5;
  }
  .cp-console.error { color: #ff7b72; }

  /* ── TEST CASES ── */
  .cp-test-card {
    background: var(--glass-bg);
    backdrop-filter: blur(10px);
    border: 2px solid var(--glass-border);
    border-radius: 1.25rem;
    padding: 1rem 1.25rem;
    transition: border-color 0.3s, background 0.3s;
  }
  .cp-test-card.pass {
    border-color: #238636;
    background: rgba(35,134,54,0.08);
  }
  .cp-test-card.fail {
    border-color: #da3633;
    background: rgba(218,54,51,0.08);
  }

  /* ── RUN BUTTON ── */
  .cp-run-btn {
    background: #238636;
    box-shadow: 0 8px 20px rgba(35,134,54,0.35);
    transition: all 0.2s;
  }
  .cp-run-btn:hover:not(:disabled) {
    background: #2ea043;
    transform: translateY(-1px);
    box-shadow: 0 12px 24px rgba(35,134,54,0.45);
  }
  .cp-run-btn:active:not(:disabled) { transform: scale(0.97); }

  /* ── SUBMIT BUTTON ── */
  .cp-submit-btn {
    background: #2B7FE8;
    box-shadow: 0 8px 20px rgba(43,127,232,0.35);
    transition: all 0.2s;
  }
  .cp-submit-btn:hover:not(:disabled) {
    background: #3b8ff8;
    transform: translateY(-1px);
  }
  .cp-submit-btn:active:not(:disabled) { transform: scale(0.97); }

  /* ── STAT CHIP ── */
  .cp-chip {
    background: var(--glass-bg);
    border: 1.5px solid var(--glass-border);
    border-radius: 0.75rem;
    padding: 0.35rem 0.75rem;
    font-size: 0.7rem;
    font-weight: 900;
    font-style: italic;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  /* ── RESULT OVERLAY ── */
  .cp-result {
    animation: cp-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards;
    border-radius: 2rem;
    padding: 1.75rem;
    border-width: 4px;
    border-style: solid;
  }
  @keyframes cp-pop {
    from { opacity:0; transform: scale(0.85); }
    to   { opacity:1; transform: scale(1); }
  }

  /* ── LOADING OVERLAY ── */
  .cp-loading-bar {
    height: 3px;
    background: linear-gradient(90deg, transparent, #2B7FE8, transparent);
    background-size: 200% 100%;
    animation: cp-scan 1.2s linear infinite;
    border-radius: 99px;
  }
  @keyframes cp-scan {
    0%   { background-position: -100% 0; }
    100% { background-position: 200% 0; }
  }

  /* ── BADGE TIPO TEST ── */
  .badge-stdout {
    background: rgba(210,153,34,0.15);
    color: #e3b341;
    border: 1px solid rgba(210,153,34,0.3);
  }
  .badge-return {
    background: rgba(43,127,232,0.15);
    color: #79c0ff;
    border: 1px solid rgba(43,127,232,0.3);
  }
`;

// ── Python helpers que se definen una vez en Pyodide ─────────────────
const PYODIDE_HELPERS = `
import sys, traceback
from io import StringIO

def _cp_run_stdout(code, expected):
    buf = StringIO()
    old = sys.stdout
    sys.stdout = buf
    try:
        exec(compile(code, '<student>', 'exec'), {})
        got = buf.getvalue().strip()
        return {"passed": got == str(expected).strip(), "got": got, "error": None}
    except Exception:
        err = traceback.format_exc(limit=4)
        return {"passed": False, "got": "", "error": err}
    finally:
        sys.stdout = old

def _cp_run_return(code, call_expr, expected):
    ns = {}
    try:
        exec(compile(code, '<student>', 'exec'), ns)
        result = eval(call_expr, ns)
        got = str(result)
        return {"passed": got == str(expected), "got": got, "error": None}
    except Exception:
        err = traceback.format_exc(limit=4)
        return {"passed": False, "got": "", "error": err}
`;

// ── Loader de Pyodide (singleton cacheado en window) ─────────────────
let pyodidePromise = null;

async function getPyodide() {
  if (window.__pyodide) return window.__pyodide;
  if (!pyodidePromise) {
    pyodidePromise = new Promise((resolve, reject) => {
      if (window.loadPyodide) {
        window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.0/full/" })
          .then(py => { window.__pyodide = py; resolve(py); })
          .catch(reject);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.0/full/pyodide.js";
      script.onload = () => {
        window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.0/full/" })
          .then(py => { window.__pyodide = py; resolve(py); })
          .catch(reject);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return pyodidePromise;
}

// ── Componente principal ──────────────────────────────────────────────
export default function CodePython({ question, onAnswer }) {
  const testCases = question.testCases || [];

  const [code, setCode]               = useState("");
  const [pyodide, setPyodide]         = useState(null);
  const [pyLoading, setPyLoading]     = useState(true);
  const [pyError, setPyError]         = useState(null);
  const [running, setRunning]         = useState(false);
  const [testResults, setTestResults] = useState(null);    // null | array
  const [consoleOut, setConsoleOut]   = useState(null);    // null | string
  const [submitted, setSubmitted]     = useState(false);
  const [isCorrect, setIsCorrect]     = useState(null);
  const [consoleOpen, setConsoleOpen] = useState(true);

  const editorRef  = useRef(null);
  const lineRef    = useRef(null);

  // ── Carga de Pyodide ───────────────────────────────────────────────
  useEffect(() => {
    getPyodide()
      .then(async (py) => {
        // Definir helpers una sola vez
        if (!window.__pyodide_helpers_loaded) {
          await py.runPythonAsync(PYODIDE_HELPERS);
          window.__pyodide_helpers_loaded = true;
        }
        setPyodide(py);
        setPyLoading(false);
      })
      .catch(err => {
        setPyError("No se pudo cargar el entorno Python. Verifica tu conexión.");
        setPyLoading(false);
      });
  }, []);

  // ── Sincronizar scroll líneas / textarea ───────────────────────────
  const syncScroll = useCallback(() => {
    if (lineRef.current && editorRef.current) {
      lineRef.current.scrollTop = editorRef.current.scrollTop;
    }
  }, []);

  // ── Tab key support ────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const INDENT = "    ";
      const newCode = code.substring(0, start) + INDENT + code.substring(end);
      setCode(newCode);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
  }, [code]);

  // ── Ejecutar tests ─────────────────────────────────────────────────
  const runTests = useCallback(async () => {
    if (!pyodide || !code.trim() || running) return;
    setRunning(true);
    setTestResults(null);
    setConsoleOut(null);

    const results = [];
    let globalConsole = "";

    try {
      // Capturar stdout global para mostrarlo en la consola
      await pyodide.runPythonAsync(`
import sys
from io import StringIO
_global_buf = StringIO()
sys.stdout = _global_buf
`);

      for (const tc of testCases) {
        let r;
        if (tc.testType === "stdout") {
          const res = await pyodide.runPythonAsync(
            `_cp_run_stdout(${JSON.stringify(code)}, ${JSON.stringify(tc.expectedOutput)})`
          );
          r = res.toJs({ dict_converter: Object.fromEntries });
        } else {
          // return
          const res = await pyodide.runPythonAsync(
            `_cp_run_return(${JSON.stringify(code)}, ${JSON.stringify(tc.callCode)}, ${JSON.stringify(tc.expectedOutput)})`
          );
          r = res.toJs({ dict_converter: Object.fromEntries });
        }
        results.push({ ...tc, ...r });
      }

      // Recuperar lo que se imprimió globalmente
      const out = await pyodide.runPythonAsync(
        `sys.stdout = sys.__stdout__; _global_buf.getvalue()`
      );
      if (out && out.trim()) globalConsole = out;

    } catch (err) {
      globalConsole = `Error inesperado: ${err.message}`;
    } finally {
      // Restaurar stdout por si acaso
      try { await pyodide.runPythonAsync(`sys.stdout = sys.__stdout__`); } catch {}
    }

    setConsoleOut(globalConsole || null);
    setTestResults(results);
    setRunning(false);
    setConsoleOpen(true);
  }, [pyodide, code, running, testCases]);

  // ── Confirmar / enviar ─────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (submitted || !allPassed) return;
    setSubmitted(true);
    try {
      const result = await onAnswer({
        code,
        passed: true,
        passedCount: testResults.filter(r => r.passed).length,
        totalCount: testResults.length,
      });
      setIsCorrect(result?.isCorrect ?? true);
    } catch {
      setIsCorrect(true);
    }
  }, [submitted, code, testResults, onAnswer]);

  // ── Reiniciar ──────────────────────────────────────────────────────
  const handleReset = () => {
    setCode("");
    setTestResults(null);
    setConsoleOut(null);
  };

  // ── Derivados ──────────────────────────────────────────────────────
  const lineCount  = (code || "").split("\n").length;
  const passedCount = testResults ? testResults.filter(r => r.passed).length : 0;
  const allPassed   = testResults && passedCount === testCases.length;
  const hasErrors   = testResults && testResults.some(r => r.error);

  // ── RENDER: cargando Pyodide ───────────────────────────────────────
  if (pyLoading) {
    return (
      <div className="cp-wrapper w-full max-w-2xl mx-auto animate-in fade-in duration-500">
        <style>{CODE_CSS}</style>
        <div className="cp-editor-shell">
          <div className="cp-editor-topbar">
            <div className="cp-dot" style={{ background: "#ff5f57" }} />
            <div className="cp-dot" style={{ background: "#febc2e" }} />
            <div className="cp-dot" style={{ background: "#28c840" }} />
            <span className="text-[#484f58] text-xs font-mono ml-2">student.py</span>
            <div className="ml-auto flex items-center gap-2 text-[#484f58] text-xs">
              <Cpu size={12} className="animate-pulse" />
              <span>Inicializando entorno Python…</span>
            </div>
          </div>
          <div className="p-6 space-y-3">
            <div className="cp-loading-bar w-full" />
            <div className="cp-loading-bar w-3/4 opacity-60" style={{ animationDelay: "0.3s" }} />
            <div className="cp-loading-bar w-1/2 opacity-40" style={{ animationDelay: "0.6s" }} />
          </div>
        </div>
        <p className="text-center text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-3">
          Cargando Python 3.11 · primera vez puede tardar ~15s
        </p>
      </div>
    );
  }

  // ── RENDER: error al cargar Pyodide ───────────────────────────────
  if (pyError) {
    return (
      <div className="cp-wrapper w-full max-w-2xl mx-auto animate-in fade-in duration-500">
        <style>{CODE_CSS}</style>
        <div className="cp-editor-shell p-8 text-center">
          <AlertTriangle size={32} className="text-amber-400 mx-auto mb-3" />
          <p className="text-[#e6edf3] font-bold">{pyError}</p>
        </div>
      </div>
    );
  }

  // ── RENDER: resultado final ────────────────────────────────────────
  if (submitted && isCorrect !== null) {
    return (
      <div className="cp-wrapper w-full max-w-2xl mx-auto">
        <style>{CODE_CSS}</style>
        <div
          className="cp-result"
          style={{
            backgroundColor: isCorrect ? "var(--correct-bg)" : "var(--incorrect-bg)",
            borderColor: isCorrect ? "var(--correct)" : "var(--incorrect)",
          }}
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="p-3 rounded-2xl" style={{ backgroundColor: isCorrect ? "var(--correct)" : "var(--incorrect)" }}>
              {isCorrect
                ? <CheckCircle2 size={22} className="text-white" />
                : <XCircle size={22} className="text-white" />}
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-[var(--text-primary)]">
                {isCorrect ? "¡Código Validado!" : "Solución Incorrecta"}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                {passedCount}/{testCases.length} pruebas superadas
              </p>
            </div>
          </div>

          {/* Code snippet */}
          <div className="bg-[#0d1117] rounded-2xl p-4 mb-4 overflow-x-auto">
            <pre className="text-[#7ee787] font-mono text-xs leading-relaxed">{code}</pre>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Tests",    value: `${passedCount}/${testCases.length}` },
              { label: "Líneas",   value: lineCount },
              { label: "Estado",   value: isCorrect ? "OK" : "FAIL" },
            ].map(({ label, value }) => (
              <div key={label} className="cp-chip flex-col items-start gap-1 py-3">
                <span className="text-[var(--text-secondary)]">{label}</span>
                <span className="text-lg font-black text-[var(--text-primary)]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER: ejercicio ──────────────────────────────────────────────
  return (
    <div className="cp-wrapper w-full max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <style>{CODE_CSS}</style>

      {/* ── Stats row ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="cp-chip">
          <Terminal size={12} className="text-[#2B7FE8]" />
          Python 3.11
        </div>
        <div className="cp-chip">
          <span className="text-emerald-400">⬛</span>
          {lineCount} {lineCount === 1 ? "línea" : "líneas"}
        </div>
        {testResults && (
          <div className={`cp-chip ${allPassed ? "text-emerald-400" : "text-red-400"}`}>
            {allPassed
              ? <CheckCircle2 size={12} />
              : <XCircle size={12} />}
            {passedCount}/{testCases.length} pruebas
          </div>
        )}
        <button
          onClick={handleReset}
          className="cp-chip ml-auto hover:text-red-400 transition-colors cursor-pointer border-red-900/30"
          title="Reiniciar código"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {/* ── Editor ── */}
      <div className="cp-editor-shell">
        {/* Topbar */}
        <div className="cp-editor-topbar">
          <div className="cp-dot" style={{ background: "#ff5f57" }} />
          <div className="cp-dot" style={{ background: "#febc2e" }} />
          <div className="cp-dot" style={{ background: "#28c840" }} />
          <span className="text-[#484f58] text-xs font-mono ml-2">student.py</span>
          {running && (
            <div className="ml-auto flex items-center gap-2 text-[#2B7FE8] text-xs">
              <Loader2 size={12} className="animate-spin" />
              <span>Ejecutando…</span>
            </div>
          )}
        </div>

        {/* Body: números + textarea */}
        <div className="cp-editor-body">
          <div className="cp-line-nums" ref={lineRef}>
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            ref={editorRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            placeholder="# Escribe tu solución en Python aquí…"
            className="cp-textarea"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      </div>

      {/* ── Botón ejecutar ── */}
      <button
        onClick={runTests}
        disabled={!code.trim() || running}
        className="cp-run-btn w-full py-4 rounded-2xl text-white font-black italic uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale"
      >
        {running
          ? <><Loader2 size={16} className="animate-spin" /> Ejecutando pruebas…</>
          : <><Play size={16} /> Ejecutar pruebas</>}
      </button>

      {/* ── Console output ── */}
      {(consoleOut !== null || running) && (
        <div className="space-y-2">
          <button
            onClick={() => setConsoleOpen(o => !o)}
            className="flex items-center gap-2 text-[#484f58] text-[10px] font-black uppercase tracking-widest w-full"
          >
            <Terminal size={12} />
            Salida de consola
            {consoleOpen ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
          </button>
          {consoleOpen && (
            <div className={`cp-console ${hasErrors ? "error" : ""}`}>
              {consoleOut
                ? consoleOut
                : <span className="opacity-40">Sin salida de consola</span>}
            </div>
          )}
        </div>
      )}

      {/* ── Test results ── */}
      {testResults && (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
            <span className={allPassed ? "text-emerald-400" : "text-red-400"}>●</span>
            Resultados de pruebas
          </p>

          {testResults.map((r, i) => (
            <div key={i} className={`cp-test-card ${r.passed ? "pass" : "fail"}`}>
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {r.passed
                    ? <CheckCircle2 size={18} className="text-emerald-400" />
                    : <XCircle size={18} className="text-red-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[var(--text-primary)] font-black text-sm italic">
                      {r.description || `Prueba ${i + 1}`}
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      r.testType === "stdout" ? "badge-stdout" : "badge-return"
                    }`}>
                      {r.testType === "stdout" ? "stdout" : "retorno"}
                    </span>
                  </div>

                  {/* Detalle */}
                  <div className="grid grid-cols-1 gap-1.5 font-mono text-xs">
                    {/* Expresión de llamada (solo return) */}
                    {r.testType === "return" && r.callCode && (
                      <div className="flex gap-2">
                        <span className="text-[#484f58] flex-shrink-0">llamada</span>
                        <code className="text-[#79c0ff]">{r.callCode}</code>
                      </div>
                    )}
                    {/* Esperado */}
                    <div className="flex gap-2">
                      <span className="text-[#484f58] flex-shrink-0">esperado</span>
                      <code className="text-[#7ee787]">
                        {String(r.expectedOutput)}
                      </code>
                    </div>
                    {/* Obtenido */}
                    {!r.passed && (
                      <div className="flex gap-2">
                        <span className="text-[#484f58] flex-shrink-0">obtenido</span>
                        <code className={r.error ? "text-[#ff7b72]" : "text-[#ffa657]"}>
                          {r.error
                            ? r.error.split("\n").slice(-1)[0]   // última línea del traceback
                            : (r.got || "(vacío)")}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* Traceback expandible */}
                  {r.error && (
                    <details className="mt-2">
                      <summary className="text-[9px] font-bold uppercase text-[#ff7b72] cursor-pointer">
                        Ver traceback completo
                      </summary>
                      <pre className="mt-1 text-[10px] text-[#ff7b72] opacity-70 whitespace-pre-wrap leading-relaxed">
                        {r.error}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Botón confirmar ── */}
      {testResults && (
        <button
          onClick={handleSubmit}
          disabled={!allPassed || submitted}
          className="cp-submit-btn w-full py-5 rounded-2xl text-white font-black italic uppercase text-xs tracking-[0.2em] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale"
        >
          {allPassed
            ? "✓ Confirmar Solución"
            : `${testCases.length - passedCount} prueba${testCases.length - passedCount !== 1 ? "s" : ""} pendiente${testCases.length - passedCount !== 1 ? "s" : ""}`}
        </button>
      )}
    </div>
  );
}