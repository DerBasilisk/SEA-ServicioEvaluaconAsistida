// frontend/sea/src/components/admin/QuestionModal.jsx
import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";

export default function QuestionModal({
  isOpen,
  onClose,
  question,
  onSave,
  subjects = [],
  units = [],
  lessons = [],
  selectedLessonId = ""
}) {

  const [form, setForm] = useState({
    lesson: "",
    type: "multiple_choice",
    prompt: "",
    difficulty: "easy",
    xpValue: 2,
    explanation: "",
    hint: "",
    conceptExplanation: "",
    tags: "",
    isReviewed: false,
    isActive: true,
    options: [{ text: "", isCorrect: false, explanation: "" }],
    correctBoolean: true,
    correctAnswers: [""],
    items: [""],
    pairs: [{ left: "", right: "" }],
    wordBank: [""],
  });

  // Cargar datos al editar o precargar lección seleccionada
  useEffect(() => {
    if (question) {
      setForm({
        lesson: question.lesson?._id || question.lesson || "",
        type: question.type,
        prompt: question.prompt || "",
        difficulty: question.difficulty || "easy",
        xpValue: question.xpValue || 2,
        explanation: question.explanation || "",
        hint: question.hint || "",
        conceptExplanation: question.conceptExplanation || "",
        tags: question.tags ? question.tags.join(", ") : "",
        isReviewed: !!question.isReviewed,
        isActive: !!question.isActive,
        options: question.options?.length ? question.options : [{ text: "", isCorrect: false, explanation: "" }],
        correctBoolean: question.correctBoolean ?? true,
        correctAnswers: question.correctAnswers?.length ? question.correctAnswers : [""],
        items: question.items?.length ? question.items : [""],
        pairs: question.pairs?.length ? question.pairs : [{ left: "", right: "" }],
        wordBank: question.wordBank?.length ? question.wordBank : [""],
      });
    } else {
      setForm({
        lesson: selectedLessonId || "",
        type: "multiple_choice",
        prompt: "",
        difficulty: "easy",
        xpValue: 2,
        explanation: "",
        hint: "",
        conceptExplanation: "",
        tags: "",
        isReviewed: false,
        isActive: true,
        options: [{ text: "", isCorrect: false, explanation: "" }],
        correctBoolean: true,
        correctAnswers: [""],
        items: [""],
        pairs: [{ left: "", right: "" }],
        wordBank: [""],
      });
    }
  }, [question, selectedLessonId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Manejo de arrays simples
  const handleArrayChange = (field, index, value) => {
    setForm(prev => {
      const newArr = [...prev[field]];
      newArr[index] = value;
      return { ...prev, [field]: newArr };
    });
  };

  const addArrayItem = (field) => {
    setForm(prev => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const removeArrayItem = (field, index) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Manejo específico para options (multiple_choice)
  const handleOptionChange = (index, key, value) => {
    setForm(prev => {
      const newOptions = [...prev.options];
      newOptions[index][key] = value;
      return { ...prev, options: newOptions };
    });
  };

  const addOption = () => {
    setForm(prev => ({
      ...prev,
      options: [...prev.options, { text: "", isCorrect: false, explanation: "" }]
    }));
  };

  const removeOption = (index) => {
    if (form.options.length <= 2) return;
    setForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.lesson) {
      alert("Debes seleccionar una lección para crear la pregunta");
      return;
    }

    const payload = {
      ...form,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      xpValue: Number(form.xpValue),
    };

    // Limpiar campos según tipo
    const type = form.type;
    if (type !== "multiple_choice") delete payload.options;
    if (type !== "true_false") delete payload.correctBoolean;
    if (type !== "fill_blank" && type !== "sentence_builder") delete payload.correctAnswers;
    if (type !== "order_items") delete payload.items;
    if (type !== "match_pairs") delete payload.pairs;
    if (type !== "sentence_builder") delete payload.wordBank;
    if (type !== "free_text") { delete payload.evaluationCriteria; delete payload.maxScore; delete payload.isCodeExercise; }

    onSave(payload);
  };

  if (!isOpen) return null;

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

          {/* Selector Jerárquico - Solo al crear */}
          {!question && (
            <div className="bg-gray-800 rounded-3xl p-6">
              <label className="text-gray-400 text-sm font-medium block mb-3">Lección <span className="text-red-400">*</span></label>
              <select 
                name="lesson"
                value={form.lesson}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4 text-white"
                required
              >
                <option value="">Selecciona una lección</option>
                {lessons.map(l => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tipo y Dificultad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-gray-400 text-sm font-medium ml-1">Tipo de Pregunta</label>
              <select name="type" value={form.type} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white">
                <option value="multiple_choice">Opción Múltiple</option>
                <option value="true_false">Verdadero / Falso</option>
                <option value="fill_blank">Completar el Espacio</option>
                <option value="order_items">Ordenar Elementos</option>
                <option value="match_pairs">Relacionar Columnas</option>
                <option value="sentence_builder">Construir Oración</option>
                <option value="free_text">Texto Libre (evaluado por IA)</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-sm font-medium ml-1">Dificultad</label>
              <select name="difficulty" value={form.difficulty} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white">
                <option value="easy">Fácil</option>
                <option value="medium">Medio</option>
                <option value="hard">Difícil</option>
              </select>
            </div>
          </div>

          {/* Enunciado */}
          <div>
            <label className="text-gray-400 text-sm font-medium ml-1">Enunciado de la Pregunta</label>
            <textarea
              name="prompt"
              value={form.prompt}
              onChange={handleChange}
              required
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white resize-none"
              placeholder="Ej: ¿Cuál es el resultado de 14 + 25?"
            />
          </div>

          {/* Campos dinámicos según tipo */}
          <div className="bg-gray-950/50 border border-gray-800 rounded-3xl p-6">
            {form.type === "multiple_choice" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-white mb-4">Opciones</h3>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <input type="text" value={opt.text}
                      onChange={(e) => handleOptionChange(i, "text", e.target.value)}
                      placeholder="Texto de la opción"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                    <input type="text" value={opt.explanation}
                      onChange={(e) => handleOptionChange(i, "explanation", e.target.value)}
                      placeholder="Explicación (opcional)"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                    <button type="button" onClick={() => handleOptionChange(i, "isCorrect", !opt.isCorrect)}
                      className={`px-5 py-3 rounded-xl font-medium min-w-[110px] ${opt.isCorrect ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-300"}`}>
                      {opt.isCorrect ? "Correcta" : "Incorrecta"}
                    </button>
                    <button type="button" onClick={() => removeOption(i)} className="text-red-400 hover:text-red-500 p-3">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addOption} className="text-violet-400 hover:text-violet-300 flex items-center gap-2 text-sm font-medium">
                  <Plus size={18} /> Agregar opción
                </button>
              </div>
            )}

            {form.type === "true_false" && (
              <div className="space-y-4">
                <label className="text-white font-medium block">Respuesta Correcta</label>
                <div className="flex gap-4">
                  {[true, false].map((val) => (
                    <button key={String(val)} type="button"
                      onClick={() => setForm({ ...form, correctBoolean: val })}
                      className={`flex-1 py-4 rounded-2xl font-semibold border transition-all ${
                        form.correctBoolean === val
                          ? "bg-emerald-600 border-emerald-400 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                      }`}>
                      {val ? "Verdadero" : "Falso"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {form.type === "fill_blank" && (
              <div className="space-y-3">
                <label className="text-white font-medium block">
                  Respuestas aceptadas
                  <span className="text-gray-400 text-xs ml-2">— se acepta cualquiera de estas</span>
                </label>
                {form.correctAnswers.map((ans, i) => (
                  <div key={i} className="flex gap-3">
                    <input type="text" value={ans}
                      onChange={(e) => handleArrayChange("correctAnswers", i, e.target.value)}
                      placeholder={`Variante ${i + 1} (ej: "39", "treinta y nueve")`}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                    <button type="button" onClick={() => removeArrayItem("correctAnswers", i)}
                      className="text-red-400 hover:text-red-500 p-3"><Trash2 size={18} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem("correctAnswers")}
                  className="text-violet-400 hover:text-violet-300 flex items-center gap-2 text-sm font-medium">
                  <Plus size={18} /> Agregar variante
                </button>
              </div>
            )}

            {form.type === "order_items" && (
              <div className="space-y-3">
                <label className="text-white font-medium block">
                  Elementos en orden correcto
                  <span className="text-gray-400 text-xs ml-2">— se mostrarán mezclados al usuario</span>
                </label>
                {form.items.map((item, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <span className="text-gray-500 font-bold w-6 text-center">{i + 1}</span>
                    <input type="text" value={item}
                      onChange={(e) => handleArrayChange("items", i, e.target.value)}
                      placeholder={`Elemento ${i + 1}`}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                    <button type="button" onClick={() => removeArrayItem("items", i)}
                      className="text-red-400 hover:text-red-500 p-3"><Trash2 size={18} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem("items")}
                  className="text-violet-400 hover:text-violet-300 flex items-center gap-2 text-sm font-medium">
                  <Plus size={18} /> Agregar elemento
                </button>
              </div>
            )}

            {form.type === "match_pairs" && (
              <div className="space-y-3">
                <label className="text-white font-medium block">Pares a relacionar</label>
                {form.pairs.map((pair, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <input type="text" value={pair.left}
                      onChange={(e) => {
                        const newPairs = [...form.pairs];
                        newPairs[i] = { ...newPairs[i], left: e.target.value };
                        setForm({ ...form, pairs: newPairs });
                      }}
                      placeholder="Columna izquierda"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                    <span className="text-gray-500 font-bold">→</span>
                    <input type="text" value={pair.right}
                      onChange={(e) => {
                        const newPairs = [...form.pairs];
                        newPairs[i] = { ...newPairs[i], right: e.target.value };
                        setForm({ ...form, pairs: newPairs });
                      }}
                      placeholder="Columna derecha"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                    <button type="button"
                      onClick={() => setForm({ ...form, pairs: form.pairs.filter((_, idx) => idx !== i) })}
                      className="text-red-400 hover:text-red-500 p-3"><Trash2 size={18} /></button>
                  </div>
                ))}
                <button type="button"
                  onClick={() => setForm({ ...form, pairs: [...form.pairs, { left: "", right: "" }] })}
                  className="text-violet-400 hover:text-violet-300 flex items-center gap-2 text-sm font-medium">
                  <Plus size={18} /> Agregar par
                </button>
              </div>
            )}

            {form.type === "sentence_builder" && (
              <div className="space-y-6">
                {/* Respuesta correcta */}
                <div className="space-y-3">
                  <label className="text-white font-medium block">
                    Orden correcto de palabras
                    <span className="text-gray-400 text-xs ml-2">— la oración correcta en orden</span>
                  </label>
                  {form.correctAnswers.map((word, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <span className="text-gray-500 font-bold w-6 text-center">{i + 1}</span>
                      <input type="text" value={word}
                        onChange={(e) => handleArrayChange("correctAnswers", i, e.target.value)}
                        placeholder={`Palabra ${i + 1}`}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                      <button type="button" onClick={() => removeArrayItem("correctAnswers", i)}
                        className="text-red-400 hover:text-red-500 p-3"><Trash2 size={18} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem("correctAnswers")}
                    className="text-violet-400 hover:text-violet-300 flex items-center gap-2 text-sm font-medium">
                    <Plus size={18} /> Agregar palabra
                  </button>
                </div>

                {/* Word Bank */}
                <div className="space-y-3 border-t border-gray-800 pt-6">
                  <label className="text-white font-medium block">
                    Banco de palabras
                    <span className="text-gray-400 text-xs ml-2">— incluí palabras extra para dificultar</span>
                  </label>
                  {form.wordBank.map((word, i) => (
                    <div key={i} className="flex gap-3">
                      <input type="text" value={word}
                        onChange={(e) => handleArrayChange("wordBank", i, e.target.value)}
                        placeholder={`Palabra ${i + 1}`}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                      <button type="button" onClick={() => removeArrayItem("wordBank", i)}
                        className="text-red-400 hover:text-red-500 p-3"><Trash2 size={18} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem("wordBank")}
                    className="text-violet-400 hover:text-violet-300 flex items-center gap-2 text-sm font-medium">
                    <Plus size={18} /> Agregar al banco
                  </button>
                </div>
              </div>
            )}

            {form.type === "free_text" && (
              <div className="space-y-6">
                <div>
                  <label className="text-white font-medium block mb-2">
                    Criterios de evaluación
                    <span className="text-gray-400 text-xs ml-2">— instrucciones para la IA al evaluar</span>
                  </label>
                  <textarea
                    name="evaluationCriteria"
                    value={form.evaluationCriteria || ""}
                    onChange={handleChange}
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white resize-none"
                    placeholder="Ej: Evalúa si el alumno menciona los conceptos clave: fotosíntesis, clorofila, luz solar. Considera correcta cualquier respuesta que mencione al menos 2 de 3 conceptos..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-white font-medium block mb-2">Puntaje máximo</label>
                    <input type="number" name="maxScore" value={form.maxScore || 10}
                      onChange={handleChange} min={1} max={100}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white" />
                  </div>

                  <div className="flex flex-col justify-center">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.isCodeExercise || false}
                        onChange={(e) => setForm({ ...form, isCodeExercise: e.target.checked })}
                        className="w-5 h-5 rounded accent-violet-500" />
                      <div>
                        <p className="text-white font-medium text-sm">Ejercicio de código</p>
                        <p className="text-gray-400 text-xs">La respuesta esperada es código Python</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="text-gray-400 text-sm font-medium ml-1">Pista (Hint)</label>
              <input
                type="text"
                name="hint"
                value={form.hint}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white"
                placeholder="Ej: Revisa las unidades..."
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm font-medium ml-1">Explicación post-respuesta</label>
              <textarea
                name="explanation"
                value={form.explanation}
                onChange={handleChange}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white resize-none"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-gray-400 text-sm font-medium ml-1">Tags (separados por coma)</label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white"
              placeholder="matemáticas, suma, primaria"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-6 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-2xl font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!form.lesson}
              className="flex-[2] py-4 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all"
            >
              {question ? "Guardar Cambios" : "Crear Pregunta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}