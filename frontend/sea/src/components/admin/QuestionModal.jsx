// frontend/sea/src/components/admin/QuestionModal.jsx
import { useState, useEffect } from "react";
import { Plus, Trash2, Keyboard, Code2, X } from "lucide-react";
import CustomSelect from "../ui/CustomSelect";

const MODAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  .qmodal-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0;
  }
  @media (min-width: 640px) {
    .qmodal-overlay {
      align-items: center;
      padding: 1rem;
    }
  }

  .qmodal {
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 1.5rem 1.5rem 0 0;
    width: 100%;
    max-width: 42rem;
    max-height: 92vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 -8px 40px var(--glass-shadow);
    font-family: 'Nunito', sans-serif;
  }
  @media (min-width: 640px) {
    .qmodal {
      border-radius: 2rem;
      max-height: 90vh;
    }
  }

  /* Drag handle */
  .qmodal-handle {
    width: 2.5rem;
    height: 4px;
    background: var(--glass-border);
    border-radius: 999px;
    margin: 0.75rem auto 0;
    flex-shrink: 0;
  }
  @media (min-width: 640px) {
    .qmodal-handle { display: none; }
  }

  .qmodal-header {
    padding: 1rem 1.25rem 0.75rem;
    border-bottom: 1.5px solid var(--card-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .qmodal-body {
    overflow-y: auto;
    flex: 1;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  @media (min-width: 640px) {
    .qmodal-body { padding: 1.5rem; gap: 1.5rem; }
  }

  .qmodal-footer {
    padding: 1rem 1.25rem;
    border-top: 1.5px solid var(--card-border);
    flex-shrink: 0;
    background: var(--card-bg);
  }

  /* Inputs */
  .qm-input {
    width: 100%;
    background: var(--glass-bg-small);
    border: 1.5px solid var(--card-border);
    border-radius: 1rem;
    padding: 0.75rem 1rem;
    color: var(--text-primary);
    font-family: 'Nunito', sans-serif;
    font-weight: 600;
    font-size: 0.875rem;
    transition: border-color 0.2s, background 0.2s;
    outline: none;
    resize: none;
  }
  .qm-input:focus {
    border-color: var(--text-accent);
    background: color-mix(in srgb, var(--text-accent) 4%, var(--card-bg));
  }
  .qm-input::placeholder { color: var(--text-muted); }
  .qm-input:disabled { opacity: 0.45; cursor: not-allowed; }


  .qm-label {
    font-size: 0.65rem;
    font-weight: 800;
    color: var(--text-secondary);
    display: block;
    margin-bottom: 0.4rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* Section card */
  .qm-section {
    background: var(--glass-bg);
    border: 1.5px solid var(--glass-border);
    border-radius: 1.25rem;
    padding: 1rem;
  }
  @media (min-width: 640px) {
    .qm-section { padding: 1.25rem; }
  }

  .qm-section-title {
    font-size: 0.7rem;
    font-weight: 800;
    color: var(--text-accent);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  /* Option row */
  .qm-option-row {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .qm-correct-btn {
    flex-shrink: 0;
    padding: 0.5rem 0.75rem;
    border-radius: 0.75rem;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    border: 1.5px solid;
    transition: all 0.15s;
    white-space: nowrap;
    font-family: 'Nunito', sans-serif;
  }
  .qm-correct-btn.correct {
    background: var(--correct-bg);
    color: var(--correct);
    border-color: color-mix(in srgb, var(--correct) 30%, transparent);
  }
  .qm-correct-btn.wrong {
    background: var(--glass-bg);
    color: var(--text-muted);
    border-color: var(--glass-border);
  }
  .qm-correct-btn:active { transform: scale(0.96); }

  .qm-remove-btn {
    flex-shrink: 0;
    padding: 0.5rem;
    border-radius: 0.65rem;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
  }
  .qm-remove-btn:active { color: var(--incorrect); }

  .qm-add-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--text-accent);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem 0;
    font-family: 'Nunito', sans-serif;
    transition: opacity 0.15s;
  }
  .qm-add-btn:active { opacity: 0.7; }

  /* True/False buttons */
  .qm-tf-btn {
    flex: 1;
    padding: 0.85rem;
    border-radius: 1rem;
    font-weight: 800;
    font-size: 0.875rem;
    cursor: pointer;
    border: 1.5px solid;
    transition: all 0.2s;
    font-family: 'Nunito', sans-serif;
  }
  .qm-tf-btn.selected {
    background: var(--correct-bg);
    color: var(--correct);
    border-color: color-mix(in srgb, var(--correct) 30%, transparent);
  }
  .qm-tf-btn.unselected {
    background: var(--glass-bg-small);
    color: var(--text-muted);
    border-color: var(--card-border);
  }
  .qm-tf-btn:active { transform: scale(0.97); }

  /* Test case card */
  .qm-testcase {
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 1rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .qm-testtype-btn {
    flex: 1;
    padding: 0.6rem;
    border-radius: 0.75rem;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
    border: 1.5px solid;
    transition: all 0.15s;
    font-family: 'Nunito', sans-serif;
  }
  .qm-testtype-btn.stdout-active {
    background: color-mix(in srgb, var(--text-alternative-a) 12%, transparent);
    color: var(--text-alternative-a);
    border-color: color-mix(in srgb, var(--text-alternative-a) 30%, transparent);
  }
  .qm-testtype-btn.return-active {
    background: color-mix(in srgb, var(--text-accent) 12%, transparent);
    color: var(--text-accent);
    border-color: color-mix(in srgb, var(--text-accent) 30%, transparent);
  }
  .qm-testtype-btn.inactive {
    background: var(--glass-bg-small);
    color: var(--text-muted);
    border-color: var(--card-border);
  }
  .qm-testtype-btn:active { transform: scale(0.96); }

  .qm-code-input {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    letter-spacing: 0.02em;
  }

  /* Buttons */
  .qm-btn-primary {
    flex: 2;
    background: var(--btn-primary);
    color: var(--btn-text);
    border: none;
    border-radius: 1rem;
    padding: 0.9rem;
    font-weight: 800;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Nunito', sans-serif;
  }
  .qm-btn-primary:active:not(:disabled) { transform: scale(0.98); opacity: 0.9; }
  .qm-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .qm-btn-ghost {
    flex: 1;
    background: var(--glass-bg);
    color: var(--text-secondary);
    border: 1.5px solid var(--card-border);
    border-radius: 1rem;
    padding: 0.9rem;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Nunito', sans-serif;
  }
  .qm-btn-ghost:active { transform: scale(0.98); }

  .qm-close-btn {
    background: var(--glass-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 0.75rem;
    padding: 0.4rem;
    cursor: pointer;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    transition: all 0.15s;
  }
  .qm-close-btn:active { transform: scale(0.92); }

  /* Range slider */
  .qm-range { width: 100%; accent-color: var(--text-accent); }

  /* Scrollbar */
  .qmodal-body::-webkit-scrollbar { width: 4px; }
  .qmodal-body::-webkit-scrollbar-track { background: transparent; }
  .qmodal-body::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 2px; }

  /* Badge de tipo activo */
  .qm-type-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.6rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--text-accent) 12%, transparent);
    color: var(--text-accent);
    border: 1px solid color-mix(in srgb, var(--text-accent) 25%, transparent);
  }

  /* Info callout */
  .qm-callout {
    background: color-mix(in srgb, var(--text-accent) 6%, transparent);
    border: 1px solid color-mix(in srgb, var(--text-accent) 18%, transparent);
    border-radius: 0.875rem;
    padding: 0.75rem 1rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }
  .qm-callout-warn {
    background: color-mix(in srgb, var(--text-alternative-a) 8%, transparent);
    border-color: color-mix(in srgb, var(--text-alternative-a) 20%, transparent);
  }

  .qm-divider {
    height: 1px;
    background: var(--card-border);
    margin: 0.25rem 0;
  }
`;

const emptyTestCase = () => ({
  description: "",
  testType: "stdout",
  expectedOutput: "",
  callCode: "",
});

export default function QuestionModal({
  isOpen, onClose, question, onSave,
  subjects = [], units = [], lessons = [], selectedLessonId = ""
}) {

  const [form, setForm] = useState({
    lesson: "", type: "multiple_choice", prompt: "", difficulty: "easy",
    xpValue: 2, explanation: "", hint: "", conceptExplanation: "", tags: "",
    isReviewed: false, isActive: true,
    options: [{ text: "", isCorrect: false, explanation: "" }],
    correctBoolean: true, correctAnswers: [""], items: [""],
    pairs: [{ left: "", right: "" }], wordBank: [""],
    typingText: "", accuracyThreshold: 90,
    testCases: [emptyTestCase()],
  });

  useEffect(() => {
    const base = {
      lesson: "", type: "multiple_choice", prompt: "", difficulty: "easy",
      xpValue: 2, explanation: "", hint: "", conceptExplanation: "", tags: "",
      isReviewed: false, isActive: true,
      options: [{ text: "", isCorrect: false, explanation: "" }],
      correctBoolean: true, correctAnswers: [""], items: [""],
      pairs: [{ left: "", right: "" }], wordBank: [""],
      typingText: "", accuracyThreshold: 90,
      testCases: [emptyTestCase()],
    };
    if (question) {
      setForm({
        ...base,
        lesson: question.lesson?._id || question.lesson || "",
        type: question.type, prompt: question.prompt || "",
        difficulty: question.difficulty || "easy", xpValue: question.xpValue || 2,
        explanation: question.explanation || "", hint: question.hint || "",
        conceptExplanation: question.conceptExplanation || "",
        tags: question.tags ? question.tags.join(", ") : "",
        isReviewed: !!question.isReviewed, isActive: !!question.isActive,
        options: question.options?.length ? question.options : base.options,
        correctBoolean: question.correctBoolean ?? true,
        correctAnswers: question.correctAnswers?.length ? question.correctAnswers : [""],
        items: question.items?.length ? question.items : [""],
        pairs: question.pairs?.length ? question.pairs : [{ left: "", right: "" }],
        wordBank: question.wordBank?.length ? question.wordBank : [""],
        typingText: question.typingText || "",
        accuracyThreshold: question.accuracyThreshold ?? 90,
        testCases: question.testCases?.length ? question.testCases : [emptyTestCase()],
      });
    } else {
      setForm({ ...base, lesson: selectedLessonId || "" });
    }
  }, [question, selectedLessonId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    setForm(prev => {
      const arr = [...prev[field]]; arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };
  const addArrayItem = (field, empty = "") =>
    setForm(prev => ({ ...prev, [field]: [...prev[field], empty] }));
  const removeArrayItem = (field, index) =>
    setForm(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));

  const handleOptionChange = (index, key, value) => {
    setForm(prev => {
      const opts = [...prev.options]; opts[index][key] = value;
      return { ...prev, options: opts };
    });
  };

  const handleTestCaseChange = (index, key, value) => {
    setForm(prev => {
      const tc = [...prev.testCases]; tc[index] = { ...tc[index], [key]: value };
      return { ...prev, testCases: tc };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.lesson) { alert("Debes seleccionar una lección"); return; }
    if (form.type === "typing" && !form.typingText.trim()) {
      alert("El texto a escribir es obligatorio"); return;
    }
    if (form.type === "code_python") {
      if (form.testCases.some(tc => !tc.expectedOutput.trim())) {
        alert("Todos los tests deben tener salida esperada"); return;
      }
      if (form.testCases.some(tc => tc.testType === "return" && !tc.callCode.trim())) {
        alert('Los tests de tipo "retorno" necesitan una expresión de llamada'); return;
      }
    }

    const payload = {
      ...form,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      xpValue: Number(form.xpValue),
    };
    const t = form.type;
    if (t !== "multiple_choice")                        delete payload.options;
    if (t !== "true_false")                             delete payload.correctBoolean;
    if (t !== "fill_blank" && t !== "sentence_builder") delete payload.correctAnswers;
    if (t !== "order_items")                            delete payload.items;
    if (t !== "match_pairs")                            delete payload.pairs;
    if (t !== "sentence_builder")                       delete payload.wordBank;
    if (t !== "free_text")  { delete payload.evaluationCriteria; delete payload.maxScore; delete payload.isCodeExercise; }
    if (t !== "typing")     { delete payload.typingText; delete payload.accuracyThreshold; }
    if (t !== "code_python")                            delete payload.testCases;

    onSave(payload);
  };

  if (!isOpen) return null;

  const TYPING_MAX = 300;

  const typeLabels = {
    multiple_choice: "Opción Múltiple",
    true_false: "Verdadero / Falso",
    fill_blank: "Completar Espacio",
    order_items: "Ordenar Elementos",
    match_pairs: "Relacionar Columnas",
    sentence_builder: "Construir Oración",
    free_text: "Texto Libre (IA)",
    typing: "Mecanografía ⌨️",
    code_python: "Código Python 🐍",
  };

  return (
    <div className="qmodal-overlay" onClick={onClose}>
      <style>{MODAL_CSS}</style>

      <div className="qmodal" onClick={e => e.stopPropagation()}>
        <div className="qmodal-handle" />

        {/* Header */}
        <div className="qmodal-header">
          <div>
            <h2 className="text-base font-black italic uppercase tracking-tight" style={{ color: "var(--text-primary)" }}>
              {question ? "Editar Pregunta" : "Nueva Pregunta"}
            </h2>
            {form.type && (
              <span className="qm-type-pill mt-0.5 inline-flex">
                {typeLabels[form.type] || form.type}
              </span>
            )}
          </div>
          <button className="qm-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="qmodal-body">

          {/* Lección (solo al crear) */}
          {!question && (
            <div>
              <label className="qm-label">Lección <span style={{ color: "var(--incorrect)" }}>*</span></label>
              <CustomSelect
                value={form.lesson}
                onChange={val => setForm(prev => ({ ...prev, lesson: val }))}
                options={lessons}
                placeholder="Selecciona una lección"
                getOptionValue={opt => opt._id}
                getOptionLabel={opt => opt.name}
                emptyMessage="No hay lecciones disponibles"
              />
            </div>
          )}

          {/* Tipo + Dificultad + XP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="qm-label">Tipo</label>
              <CustomSelect
                value={form.type}
                onChange={val => setForm(prev => ({ ...prev, type: val }))}
                options={[
                  { value: "multiple_choice", label: "Opción Múltiple" },
                  { value: "true_false",       label: "Verdadero / Falso" },
                  { value: "fill_blank",        label: "Completar Espacio" },
                  { value: "order_items",       label: "Ordenar Elementos" },
                  { value: "match_pairs",       label: "Relacionar Columnas" },
                  { value: "sentence_builder",  label: "Construir Oración" },
                  { value: "free_text",         label: "Texto Libre (IA)" },
                  { value: "typing",            label: "Mecanografía ⌨️" },
                  { value: "code_python",       label: "Código Python 🐍" },
                ]}
                getOptionValue={opt => opt.value}
                getOptionLabel={opt => opt.label}
              />
            </div>
            <div>
              <label className="qm-label">Dificultad</label>
              <CustomSelect
                value={form.difficulty}
                onChange={val => setForm(prev => ({ ...prev, difficulty: val }))}
                options={[
                  { value: "easy",   label: "Fácil" },
                  { value: "medium", label: "Medio" },
                  { value: "hard",   label: "Difícil" },
                ]}
                getOptionValue={opt => opt.value}
                getOptionLabel={opt => opt.label}
              />
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="qm-label">
              {form.type === "typing" ? "Instrucción para el alumno" :
               form.type === "code_python" ? "Descripción del ejercicio" :
               "Enunciado"}
            </label>
            <textarea name="prompt" value={form.prompt} onChange={handleChange} required
              rows={form.type === "code_python" ? 4 : 3}
              className="qm-input"
              placeholder={
                form.type === "code_python"
                  ? "Ej: Escribe una función `suma` que reciba dos enteros y retorne su suma."
                  : form.type === "typing"
                  ? "Ej: Transcribe el siguiente fragmento con precisión"
                  : "Ej: ¿Cuál es el resultado de 14 + 25?"
              }
            />
          </div>

          {/* ── CAMPOS DINÁMICOS ── */}

          {form.type === "multiple_choice" && (
            <div className="qm-section">
              <p className="qm-section-title">Opciones de respuesta</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {form.options.map((opt, i) => (
                  <div key={i} className="qm-option-row">
                    <input type="text" value={opt.text}
                      onChange={(e) => handleOptionChange(i, "text", e.target.value)}
                      placeholder={`Opción ${i + 1}`}
                      className="qm-input" style={{ flex: 1 }} />
                    <button type="button"
                      className={`qm-correct-btn ${opt.isCorrect ? "correct" : "wrong"}`}
                      onClick={() => handleOptionChange(i, "isCorrect", !opt.isCorrect)}>
                      {opt.isCorrect ? "✓ OK" : "✗"}
                    </button>
                    <button type="button" className="qm-remove-btn"
                      onClick={() => setForm(p => ({ ...p, options: p.options.filter((_, idx) => idx !== i) }))}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {/* Explicaciones (colapsables por opción) */}
                {form.options.map((opt, i) => (
                  opt.text && (
                    <input key={`exp-${i}`} type="text" value={opt.explanation}
                      onChange={(e) => handleOptionChange(i, "explanation", e.target.value)}
                      placeholder={`Explicación opción ${i + 1} (opcional)`}
                      className="qm-input" style={{ fontSize: "0.8rem" }} />
                  )
                ))}
              </div>
              <button type="button" className="qm-add-btn" style={{ marginTop: "0.6rem" }}
                onClick={() => setForm(p => ({ ...p, options: [...p.options, { text: "", isCorrect: false, explanation: "" }] }))}>
                <Plus size={15} /> Agregar opción
              </button>
            </div>
          )}

          {form.type === "true_false" && (
            <div className="qm-section">
              <p className="qm-section-title">Respuesta correcta</p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {[true, false].map((val) => (
                  <button key={String(val)} type="button"
                    className={`qm-tf-btn ${form.correctBoolean === val ? "selected" : "unselected"}`}
                    onClick={() => setForm({ ...form, correctBoolean: val })}>
                    {val ? "✓ Verdadero" : "✗ Falso"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.type === "fill_blank" && (
            <div className="qm-section">
              <p className="qm-section-title">Respuestas aceptadas</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {form.correctAnswers.map((ans, i) => (
                  <div key={i} className="qm-option-row">
                    <input type="text" value={ans}
                      onChange={(e) => handleArrayChange("correctAnswers", i, e.target.value)}
                      placeholder={`Variante ${i + 1}`} className="qm-input" style={{ flex: 1 }} />
                    <button type="button" className="qm-remove-btn"
                      onClick={() => removeArrayItem("correctAnswers", i)}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
              <button type="button" className="qm-add-btn" style={{ marginTop: "0.5rem" }}
                onClick={() => addArrayItem("correctAnswers")}>
                <Plus size={15} /> Agregar variante
              </button>
            </div>
          )}

          {form.type === "order_items" && (
            <div className="qm-section">
              <p className="qm-section-title">Elementos en orden correcto</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {form.items.map((item, i) => (
                  <div key={i} className="qm-option-row">
                    <span style={{ color: "var(--text-muted)", fontWeight: 800, fontSize: "0.75rem", width: "1.25rem", textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                    <input type="text" value={item}
                      onChange={(e) => handleArrayChange("items", i, e.target.value)}
                      placeholder={`Elemento ${i + 1}`} className="qm-input" style={{ flex: 1 }} />
                    <button type="button" className="qm-remove-btn"
                      onClick={() => removeArrayItem("items", i)}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
              <button type="button" className="qm-add-btn" style={{ marginTop: "0.5rem" }}
                onClick={() => addArrayItem("items")}>
                <Plus size={15} /> Agregar elemento
              </button>
            </div>
          )}

          {form.type === "match_pairs" && (
            <div className="qm-section">
              <p className="qm-section-title">Pares a relacionar</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {form.pairs.map((pair, i) => (
                  <div key={i} className="qm-option-row">
                    <input type="text" value={pair.left}
                      onChange={(e) => { const p = [...form.pairs]; p[i] = { ...p[i], left: e.target.value }; setForm({ ...form, pairs: p }); }}
                      placeholder="Izquierda" className="qm-input" style={{ flex: 1 }} />
                    <span style={{ color: "var(--text-muted)", flexShrink: 0, fontSize: "0.75rem" }}>→</span>
                    <input type="text" value={pair.right}
                      onChange={(e) => { const p = [...form.pairs]; p[i] = { ...p[i], right: e.target.value }; setForm({ ...form, pairs: p }); }}
                      placeholder="Derecha" className="qm-input" style={{ flex: 1 }} />
                    <button type="button" className="qm-remove-btn"
                      onClick={() => setForm({ ...form, pairs: form.pairs.filter((_, idx) => idx !== i) })}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
              <button type="button" className="qm-add-btn" style={{ marginTop: "0.5rem" }}
                onClick={() => setForm({ ...form, pairs: [...form.pairs, { left: "", right: "" }] })}>
                <Plus size={15} /> Agregar par
              </button>
            </div>
          )}

          {form.type === "sentence_builder" && (
            <>
              <div className="qm-section">
                <p className="qm-section-title">Orden correcto de palabras</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {form.correctAnswers.map((word, i) => (
                    <div key={i} className="qm-option-row">
                      <span style={{ color: "var(--text-muted)", fontWeight: 800, fontSize: "0.75rem", width: "1.25rem", textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                      <input type="text" value={word}
                        onChange={(e) => handleArrayChange("correctAnswers", i, e.target.value)}
                        placeholder={`Palabra ${i + 1}`} className="qm-input" style={{ flex: 1 }} />
                      <button type="button" className="qm-remove-btn"
                        onClick={() => removeArrayItem("correctAnswers", i)}><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
                <button type="button" className="qm-add-btn" style={{ marginTop: "0.5rem" }}
                  onClick={() => addArrayItem("correctAnswers")}><Plus size={15} /> Agregar palabra</button>
              </div>
              <div className="qm-section">
                <p className="qm-section-title">Banco de palabras <span style={{ color: "var(--text-muted)", fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>— incluye extras para dificultar</span></p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {form.wordBank.map((word, i) => (
                    <div key={i} className="qm-option-row">
                      <input type="text" value={word}
                        onChange={(e) => handleArrayChange("wordBank", i, e.target.value)}
                        placeholder={`Palabra ${i + 1}`} className="qm-input" style={{ flex: 1 }} />
                      <button type="button" className="qm-remove-btn"
                        onClick={() => removeArrayItem("wordBank", i)}><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
                <button type="button" className="qm-add-btn" style={{ marginTop: "0.5rem" }}
                  onClick={() => addArrayItem("wordBank")}><Plus size={15} /> Agregar al banco</button>
              </div>
            </>
          )}

          {form.type === "free_text" && (
            <div className="qm-section">
              <p className="qm-section-title">Configuración IA</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <label className="qm-label">Criterios de evaluación</label>
                  <textarea name="evaluationCriteria" value={form.evaluationCriteria || ""} onChange={handleChange}
                    rows={3} className="qm-input"
                    placeholder="Ej: Evalúa si el alumno menciona los conceptos clave..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="qm-label">Puntaje máximo</label>
                    <input type="number" name="maxScore" value={form.maxScore || 10} onChange={handleChange}
                      min={1} max={100} className="qm-input" />
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input type="checkbox" checked={form.isCodeExercise || false}
                        onChange={(e) => setForm({ ...form, isCodeExercise: e.target.checked })}
                        style={{ accentColor: "var(--text-accent)", width: "1rem", height: "1rem" }} />
                      <div>
                        <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-primary)" }}>Es código</p>
                        <p style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Respuesta Python</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {form.type === "typing" && (
            <div className="qm-section">
              <p className="qm-section-title"><Keyboard size={12} /> Texto a transcribir</p>
              <div style={{ position: "relative" }}>
                <textarea name="typingText" value={form.typingText} onChange={handleChange}
                  rows={4} maxLength={TYPING_MAX} required={form.type === "typing"}
                  className="qm-input qm-code-input"
                  placeholder="Ej: La fotosíntesis convierte la luz solar en energía química." />
                <span style={{
                  position: "absolute", bottom: "0.6rem", right: "0.75rem",
                  fontSize: "0.65rem", fontWeight: 800,
                  color: form.typingText.length > TYPING_MAX * 0.9 ? "var(--text-alternative-a)" : "var(--text-muted)"
                }}>
                  {form.typingText.length}/{TYPING_MAX}
                </span>
              </div>
              <div style={{ marginTop: "0.75rem" }}>
                <label className="qm-label">
                  Umbral de precisión —
                  <span style={{ color: "var(--text-accent)", marginLeft: "0.3rem" }}>{form.accuracyThreshold ?? 90}%</span>
                </label>
                <input type="range" name="accuracyThreshold" min={70} max={100} step={5}
                  value={form.accuracyThreshold ?? 90} onChange={handleChange} className="qm-range" />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  <span>70%</span><span>100%</span>
                </div>
              </div>
            </div>
          )}

          {form.type === "code_python" && (
            <div className="qm-section">
              <p className="qm-section-title"><Code2 size={12} /> Casos de prueba</p>
              <div className="grid grid-cols-2 gap-2" style={{ marginBottom: "0.75rem" }}>
                <div className="qm-callout qm-callout-warn">
                  <p style={{ fontWeight: 800, color: "var(--text-alternative-a)", marginBottom: "0.2rem", fontSize: "0.7rem" }}>📤 stdout</p>
                  <p>El código imprime con <code>print()</code>. Se compara la salida exacta.</p>
                </div>
                <div className="qm-callout">
                  <p style={{ fontWeight: 800, color: "var(--text-accent)", marginBottom: "0.2rem", fontSize: "0.7rem" }}>↩ retorno</p>
                  <p>Se llama una función y se compara su valor <code>return</code>.</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {form.testCases.map((tc, i) => (
                  <div key={i} className="qm-testcase">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", fontFamily: "monospace" }}>#{i + 1}</span>
                      <input type="text" value={tc.description}
                        onChange={(e) => handleTestCaseChange(i, "description", e.target.value)}
                        placeholder="Descripción del test"
                        className="qm-input" style={{ flex: 1, fontSize: "0.8rem" }} />
                      {form.testCases.length > 1 && (
                        <button type="button" className="qm-remove-btn"
                          onClick={() => setForm(p => ({ ...p, testCases: p.testCases.filter((_, idx) => idx !== i) }))}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {["stdout", "return"].map(t => (
                        <button key={t} type="button"
                          className={`qm-testtype-btn ${
                            tc.testType === t
                              ? t === "stdout" ? "stdout-active" : "return-active"
                              : "inactive"
                          }`}
                          onClick={() => handleTestCaseChange(i, "testType", t)}>
                          {t === "stdout" ? "📤 stdout" : "↩ retorno"}
                        </button>
                      ))}
                    </div>
                    {tc.testType === "return" && (
                      <div>
                        <label className="qm-label">Expresión de llamada <span style={{ color: "var(--incorrect)" }}>*</span></label>
                        <input type="text" value={tc.callCode}
                          onChange={(e) => handleTestCaseChange(i, "callCode", e.target.value)}
                          placeholder="Ej: suma(2, 3)"
                          className="qm-input qm-code-input" style={{ color: "var(--text-accent)" }} />
                      </div>
                    )}
                    <div>
                      <label className="qm-label">Salida esperada <span style={{ color: "var(--incorrect)" }}>*</span></label>
                      <input type="text" value={tc.expectedOutput}
                        onChange={(e) => handleTestCaseChange(i, "expectedOutput", e.target.value)}
                        placeholder={tc.testType === "stdout" ? "Ej: Hola mundo" : "Ej: 5"}
                        className="qm-input qm-code-input" style={{ color: "var(--correct)" }} />
                    </div>
                  </div>
                ))}
              </div>

              <button type="button"
                style={{
                  width: "100%", marginTop: "0.75rem", padding: "0.75rem",
                  border: "1.5px dashed var(--glass-border)", borderRadius: "1rem",
                  background: "transparent", color: "var(--text-muted)",
                  fontSize: "0.8rem", fontWeight: 800, cursor: "pointer",
                  fontFamily: "Nunito, sans-serif", display: "flex",
                  alignItems: "center", justifyContent: "center", gap: "0.4rem"
                }}
                onClick={() => setForm(p => ({ ...p, testCases: [...p.testCases, emptyTestCase()] }))}>
                <Plus size={15} /> Agregar caso de prueba
              </button>

              {/* Resumen */}
              <div className="qm-callout" style={{ marginTop: "0.75rem" }}>
                <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>{form.testCases.length}</span> caso{form.testCases.length !== 1 ? "s" : ""} ·{" "}
                <span style={{ color: "var(--text-alternative-a)" }}>{form.testCases.filter(tc => tc.testType === "stdout").length} stdout</span> ·{" "}
                <span style={{ color: "var(--text-accent)" }}>{form.testCases.filter(tc => tc.testType === "return").length} retorno</span>
              </div>
            </div>
          )}

          {/* Info adicional */}
          <div className="qm-section">
            <p className="qm-section-title">Info adicional</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label className="qm-label">Pista (Hint)</label>
                <input type="text" name="hint" value={form.hint} onChange={handleChange}
                  className="qm-input" placeholder="Ej: Revisa las unidades…" />
              </div>
              <div>
                <label className="qm-label">Explicación post-respuesta</label>
                <textarea name="explanation" value={form.explanation} onChange={handleChange}
                  rows={2} className="qm-input" placeholder="Se muestra al alumno después de responder" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="qm-label">XP</label>
                  <input type="number" name="xpValue" value={form.xpValue} onChange={handleChange}
                    min={1} max={20} className="qm-input" />
                </div>
                <div>
                  <label className="qm-label">Tags</label>
                  <input type="text" name="tags" value={form.tags} onChange={handleChange}
                    className="qm-input" placeholder="tag1, tag2" />
                </div>
              </div>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="qmodal-footer">
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="button" className="qm-btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="qm-btn-primary"
              disabled={!form.lesson}
              onClick={handleSubmit}>
              {question ? "Guardar Cambios" : "Crear Pregunta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}