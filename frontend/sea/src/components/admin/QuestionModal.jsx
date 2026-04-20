// frontend/sea/src/components/admin/QuestionModal.jsx
import { useState, useEffect } from "react";
import { Plus, Trash2, Keyboard, Code2 } from "lucide-react";

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
    if (t !== "multiple_choice")                     delete payload.options;
    if (t !== "true_false")                          delete payload.correctBoolean;
    if (t !== "fill_blank" && t !== "sentence_builder") delete payload.correctAnswers;
    if (t !== "order_items")                         delete payload.items;
    if (t !== "match_pairs")                         delete payload.pairs;
    if (t !== "sentence_builder")                    delete payload.wordBank;
    if (t !== "free_text")  { delete payload.evaluationCriteria; delete payload.maxScore; delete payload.isCodeExercise; }
    if (t !== "typing")     { delete payload.typingText; delete payload.accuracyThreshold; }
    if (t !== "code_python")                         delete payload.testCases;

    console.log("PAYLOAD FINAL:", JSON.stringify(payload, null, 2));
    onSave(payload);
  };

  if (!isOpen) return null;

  const TYPING_MAX = 300;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden border border-gray-700 shadow-2xl">

        <div className="px-8 py-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {question ? "Editar Pregunta" : "Crear Nueva Pregunta"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-4xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[calc(95vh-80px)] space-y-8">

          {/* Lección */}
          {!question && (
            <div className="bg-gray-800 rounded-3xl p-6">
              <label className="text-gray-400 text-sm font-medium block mb-3">Lección <span className="text-red-400">*</span></label>
              <select name="lesson" value={form.lesson} onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4 text-white" required>
                <option value="">Selecciona una lección</option>
                {lessons.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            </div>
          )}

          {/* Tipo y dificultad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-gray-400 text-sm font-medium ml-1">Tipo de Pregunta</label>
              <select name="type" value={form.type} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white">
                <option value="multiple_choice">Opción Múltiple</option>
                <option value="true_false">Verdadero / Falso</option>
                <option value="fill_blank">Completar el Espacio</option>
                <option value="order_items">Ordenar Elementos</option>
                <option value="match_pairs">Relacionar Columnas</option>
                <option value="sentence_builder">Construir Oración</option>
                <option value="free_text">Texto Libre (IA)</option>
                <option value="typing">Mecanografía ⌨️</option>
                <option value="code_python">Código Python 🐍</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm font-medium ml-1">Dificultad</label>
              <select name="difficulty" value={form.difficulty} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white">
                <option value="easy">Fácil</option>
                <option value="medium">Medio</option>
                <option value="hard">Difícil</option>
              </select>
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="text-gray-400 text-sm font-medium ml-1">
              {form.type === "typing" ? "Instrucción para el alumno" :
               form.type === "code_python" ? "Descripción del ejercicio" :
               "Enunciado de la Pregunta"}
            </label>
            <textarea name="prompt" value={form.prompt} onChange={handleChange} required
              rows={form.type === "code_python" ? 4 : 3}
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white resize-none"
              placeholder={
                form.type === "code_python"
                  ? "Ej: Escribe una función llamada `suma` que reciba dos enteros y retorne su suma."
                  : form.type === "typing"
                  ? "Ej: Transcribe el siguiente fragmento con precisión"
                  : "Ej: ¿Cuál es el resultado de 14 + 25?"
              }
            />
          </div>

          {/* ── CAMPOS DINÁMICOS ── */}
          <div className="bg-gray-950/50 border border-gray-800 rounded-3xl p-6">

            {form.type === "multiple_choice" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-white mb-4">Opciones</h3>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <input type="text" value={opt.text} onChange={(e) => handleOptionChange(i, "text", e.target.value)}
                      placeholder="Texto de la opción" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                    <input type="text" value={opt.explanation} onChange={(e) => handleOptionChange(i, "explanation", e.target.value)}
                      placeholder="Explicación (opcional)" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                    <button type="button" onClick={() => handleOptionChange(i, "isCorrect", !opt.isCorrect)}
                      className={`px-5 py-3 rounded-xl font-medium min-w-[110px] ${opt.isCorrect ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-300"}`}>
                      {opt.isCorrect ? "Correcta" : "Incorrecta"}
                    </button>
                    <button type="button" onClick={() => setForm(p => ({ ...p, options: p.options.filter((_, idx) => idx !== i) }))}
                      className="text-red-400 hover:text-red-500 p-3"><Trash2 size={20} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setForm(p => ({ ...p, options: [...p.options, { text: "", isCorrect: false, explanation: "" }] }))}
                  className="text-violet-400 hover:text-violet-300 flex items-center gap-2 text-sm font-medium">
                  <Plus size={18} /> Agregar opción
                </button>
              </div>
            )}

            {form.type === "true_false" && (
              <div className="space-y-4">
                <label className="text-white font-medium block">Respuesta Correcta</label>
                <div className="flex gap-4">
                  {[true, false].map((val) => (
                    <button key={String(val)} type="button" onClick={() => setForm({ ...form, correctBoolean: val })}
                      className={`flex-1 py-4 rounded-2xl font-semibold border transition-all ${
                        form.correctBoolean === val ? "bg-emerald-600 border-emerald-400 text-white" : "bg-gray-800 border-gray-700 text-gray-400"
                      }`}>{val ? "Verdadero" : "Falso"}</button>
                  ))}
                </div>
              </div>
            )}

            {form.type === "fill_blank" && (
              <div className="space-y-3">
                <label className="text-white font-medium block">Respuestas aceptadas <span className="text-gray-400 text-xs ml-1">— cualquiera de estas</span></label>
                {form.correctAnswers.map((ans, i) => (
                  <div key={i} className="flex gap-3">
                    <input type="text" value={ans} onChange={(e) => handleArrayChange("correctAnswers", i, e.target.value)}
                      placeholder={`Variante ${i + 1}`} className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                    <button type="button" onClick={() => removeArrayItem("correctAnswers", i)} className="text-red-400 p-3"><Trash2 size={18} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem("correctAnswers")} className="text-violet-400 flex items-center gap-2 text-sm font-medium"><Plus size={18} /> Agregar variante</button>
              </div>
            )}

            {form.type === "order_items" && (
              <div className="space-y-3">
                <label className="text-white font-medium block">Elementos en orden correcto</label>
                {form.items.map((item, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <span className="text-gray-500 font-bold w-6 text-center">{i + 1}</span>
                    <input type="text" value={item} onChange={(e) => handleArrayChange("items", i, e.target.value)}
                      placeholder={`Elemento ${i + 1}`} className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                    <button type="button" onClick={() => removeArrayItem("items", i)} className="text-red-400 p-3"><Trash2 size={18} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem("items")} className="text-violet-400 flex items-center gap-2 text-sm font-medium"><Plus size={18} /> Agregar elemento</button>
              </div>
            )}

            {form.type === "match_pairs" && (
              <div className="space-y-3">
                <label className="text-white font-medium block">Pares a relacionar</label>
                {form.pairs.map((pair, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <input type="text" value={pair.left}
                      onChange={(e) => { const p = [...form.pairs]; p[i] = { ...p[i], left: e.target.value }; setForm({ ...form, pairs: p }); }}
                      placeholder="Izquierda" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                    <span className="text-gray-500">→</span>
                    <input type="text" value={pair.right}
                      onChange={(e) => { const p = [...form.pairs]; p[i] = { ...p[i], right: e.target.value }; setForm({ ...form, pairs: p }); }}
                      placeholder="Derecha" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                    <button type="button" onClick={() => setForm({ ...form, pairs: form.pairs.filter((_, idx) => idx !== i) })}
                      className="text-red-400 p-3"><Trash2 size={18} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setForm({ ...form, pairs: [...form.pairs, { left: "", right: "" }] })}
                  className="text-violet-400 flex items-center gap-2 text-sm font-medium"><Plus size={18} /> Agregar par</button>
              </div>
            )}

            {form.type === "sentence_builder" && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-white font-medium block">Orden correcto de palabras</label>
                  {form.correctAnswers.map((word, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <span className="text-gray-500 font-bold w-6 text-center">{i + 1}</span>
                      <input type="text" value={word} onChange={(e) => handleArrayChange("correctAnswers", i, e.target.value)}
                        placeholder={`Palabra ${i + 1}`} className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                      <button type="button" onClick={() => removeArrayItem("correctAnswers", i)} className="text-red-400 p-3"><Trash2 size={18} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem("correctAnswers")} className="text-violet-400 flex items-center gap-2 text-sm font-medium"><Plus size={18} /> Agregar palabra</button>
                </div>
                <div className="space-y-3 border-t border-gray-800 pt-6">
                  <label className="text-white font-medium block">Banco de palabras <span className="text-gray-400 text-xs ml-1">— incluí extras para dificultar</span></label>
                  {form.wordBank.map((word, i) => (
                    <div key={i} className="flex gap-3">
                      <input type="text" value={word} onChange={(e) => handleArrayChange("wordBank", i, e.target.value)}
                        placeholder={`Palabra ${i + 1}`} className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                      <button type="button" onClick={() => removeArrayItem("wordBank", i)} className="text-red-400 p-3"><Trash2 size={18} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem("wordBank")} className="text-violet-400 flex items-center gap-2 text-sm font-medium"><Plus size={18} /> Agregar al banco</button>
                </div>
              </div>
            )}

            {form.type === "free_text" && (
              <div className="space-y-6">
                <div>
                  <label className="text-white font-medium block mb-2">Criterios de evaluación <span className="text-gray-400 text-xs ml-1">— instrucciones para la IA</span></label>
                  <textarea name="evaluationCriteria" value={form.evaluationCriteria || ""} onChange={handleChange}
                    rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white resize-none"
                    placeholder="Ej: Evalúa si el alumno menciona los conceptos clave..." />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-white font-medium block mb-2">Puntaje máximo</label>
                    <input type="number" name="maxScore" value={form.maxScore || 10} onChange={handleChange}
                      min={1} max={100} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.isCodeExercise || false}
                        onChange={(e) => setForm({ ...form, isCodeExercise: e.target.checked })} className="w-5 h-5 rounded accent-violet-500" />
                      <div>
                        <p className="text-white font-medium text-sm">Ejercicio de código</p>
                        <p className="text-gray-400 text-xs">La respuesta esperada es código Python</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {form.type === "typing" && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2.5 rounded-xl"><Keyboard size={18} className="text-blue-400" /></div>
                  <div>
                    <h3 className="text-white font-semibold">Texto a transcribir</h3>
                    <p className="text-gray-400 text-xs">El alumno deberá escribirlo exactamente</p>
                  </div>
                </div>
                <div className="relative">
                  <textarea name="typingText" value={form.typingText} onChange={handleChange}
                    rows={5} maxLength={TYPING_MAX} required={form.type === "typing"}
                    className="w-full bg-gray-800 border border-gray-700 focus:border-blue-500 rounded-2xl px-5 py-4 text-white resize-none font-mono text-sm leading-relaxed outline-none transition-colors"
                    placeholder="Ej: La fotosíntesis convierte la luz solar en energía química." />
                  <span className={`absolute bottom-3 right-4 text-xs font-bold tabular-nums ${form.typingText.length > TYPING_MAX * 0.9 ? "text-amber-400" : "text-gray-600"}`}>
                    {form.typingText.length}/{TYPING_MAX}
                  </span>
                </div>
                <div>
                  <label className="text-gray-400 text-sm font-medium ml-1 block mb-1">
                    Umbral de precisión <span className="text-blue-400 font-bold ml-2">{form.accuracyThreshold ?? 90}%</span>
                  </label>
                  <input type="range" name="accuracyThreshold" min={70} max={100} step={5}
                    value={form.accuracyThreshold ?? 90} onChange={handleChange} className="w-full accent-blue-500" />
                  <div className="flex justify-between text-gray-600 text-xs mt-1"><span>70%</span><span>100%</span></div>
                </div>
              </div>
            )}

            {/* ── CODE PYTHON ── */}
            {form.type === "code_python" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/10 p-2.5 rounded-xl"><Code2 size={18} className="text-green-400" /></div>
                  <div>
                    <h3 className="text-white font-semibold">Casos de prueba</h3>
                    <p className="text-gray-400 text-xs">El alumno debe superar todos los tests para aprobar</p>
                  </div>
                </div>

                {/* Leyenda de tipos */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3">
                    <p className="text-yellow-400 font-bold mb-1">📤 stdout</p>
                    <p className="text-gray-400">El código imprime con <code className="text-yellow-300">print()</code>. Se compara la salida exacta.</p>
                  </div>
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                    <p className="text-blue-400 font-bold mb-1">↩ retorno</p>
                    <p className="text-gray-400">Se llama una función y se compara su valor <code className="text-blue-300">return</code>.</p>
                  </div>
                </div>

                {/* Tests */}
                {form.testCases.map((tc, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-mono text-sm font-bold">#{i + 1}</span>
                      <input type="text" value={tc.description}
                        onChange={(e) => handleTestCaseChange(i, "description", e.target.value)}
                        placeholder="Descripción del test (ej: Suma de positivos)"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm" />
                      {form.testCases.length > 1 && (
                        <button type="button" onClick={() => setForm(p => ({ ...p, testCases: p.testCases.filter((_, idx) => idx !== i) }))}
                          className="text-red-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                      )}
                    </div>

                    {/* Tipo */}
                    <div className="flex gap-3">
                      {["stdout", "return"].map(t => (
                        <button key={t} type="button" onClick={() => handleTestCaseChange(i, "testType", t)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase border transition-all ${
                            tc.testType === t
                              ? t === "stdout"
                                ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400"
                                : "bg-blue-500/15 border-blue-500/40 text-blue-400"
                              : "bg-gray-800 border-gray-700 text-gray-500 hover:bg-gray-700"
                          }`}>
                          {t === "stdout" ? "📤 stdout" : "↩ retorno"}
                        </button>
                      ))}
                    </div>

                    {/* Expresión de llamada — solo return */}
                    {tc.testType === "return" && (
                      <div>
                        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1.5">
                          Expresión de llamada <span className="text-red-400">*</span>
                        </label>
                        <input type="text" value={tc.callCode}
                          onChange={(e) => handleTestCaseChange(i, "callCode", e.target.value)}
                          placeholder="Ej: suma(2, 3)  |  es_par(10)  |  factorial(5)"
                          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-blue-300 font-mono text-sm" />
                        <p className="text-gray-600 text-xs mt-1">
                          Se evalúa con <code>eval()</code> sobre el namespace del código del alumno.
                        </p>
                      </div>
                    )}

                    {/* Salida esperada */}
                    <div>
                      <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-1.5">
                        Salida esperada <span className="text-red-400">*</span>
                      </label>
                      <input type="text" value={tc.expectedOutput}
                        onChange={(e) => handleTestCaseChange(i, "expectedOutput", e.target.value)}
                        placeholder={tc.testType === "stdout" ? "Ej: Hola mundo  |  42  |  [1, 2, 3]" : "Ej: 5  |  True  |  [1, 2, 3]"}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-green-300 font-mono text-sm" />
                      <p className="text-gray-600 text-xs mt-1">
                        Se compara como string. Booleanos: <code>True</code>/<code>False</code>. Listas: <code>[1, 2, 3]</code>.
                      </p>
                    </div>
                  </div>
                ))}

                {/* Agregar test */}
                <button type="button" onClick={() => setForm(p => ({ ...p, testCases: [...p.testCases, emptyTestCase()] }))}
                  className="w-full py-3 border-2 border-dashed border-gray-700 hover:border-green-500/50 rounded-2xl text-gray-400 hover:text-green-400 text-sm font-bold transition-all flex items-center justify-center gap-2">
                  <Plus size={18} /> Agregar caso de prueba
                </button>

                {/* Resumen */}
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 text-xs text-gray-400 space-y-1">
                  <p className="font-bold text-gray-300 mb-2">📋 Resumen</p>
                  <p>· <span className="text-white">{form.testCases.length}</span> caso{form.testCases.length !== 1 ? "s" : ""} de prueba</p>
                  <p>· <span className="text-yellow-400">{form.testCases.filter(tc => tc.testType === "stdout").length}</span> stdout · <span className="text-blue-400">{form.testCases.filter(tc => tc.testType === "return").length}</span> retorno</p>
                  <p>· El alumno debe superar <span className="text-green-400">todos</span> los tests para aprobar</p>
                </div>
              </div>
            )}
          </div>

          {/* Info adicional */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="text-gray-400 text-sm font-medium ml-1">Pista (Hint)</label>
              <input type="text" name="hint" value={form.hint} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white"
                placeholder={form.type === "code_python" ? "Ej: Recuerda que print() agrega \\n al final" : "Ej: Revisa las unidades..."} />
            </div>
            <div>
              <label className="text-gray-400 text-sm font-medium ml-1">Explicación post-respuesta</label>
              <textarea name="explanation" value={form.explanation} onChange={handleChange}
                rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white resize-none"
                placeholder={form.type === "code_python" ? "Ej: Una solución posible: def suma(a, b): return a + b" : ""} />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-gray-400 text-sm font-medium ml-1">Tags (separados por coma)</label>
            <input type="text" name="tags" value={form.tags} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white"
              placeholder={form.type === "code_python" ? "python, funciones, bucles" : "matemáticas, suma, primaria"} />
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-6 border-t border-gray-800">
            <button type="button" onClick={onClose}
              className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-2xl font-semibold transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={!form.lesson}
              className="flex-[2] py-4 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all">
              {question ? "Guardar Cambios" : "Crear Pregunta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}