// frontend/sea/src/components/admin/QuestionModal.jsx
// frontend/sea/src/components/admin/QuestionModal.jsx
import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";

export default function QuestionModal({ isOpen, onClose, question, onSave }) {
  const [form, setForm] = useState({
    type: "multiple_choice",
    prompt: "",
    difficulty: "easy",
    xpValue: 2,
    explanation: "",
    hint: "",
    conceptExplanation: "",
    tags: "",
    isReviewed: false,
    isActive: false,
    options: [{ text: "", isCorrect: false, explanation: "" }],
    correctBoolean: true,
    correctAnswers: [""],
    items: [""],
    pairs: [{ left: "", right: "" }],
    wordBank: [""],
  });

  // Cargar datos al editar
  useEffect(() => {
    if (question) {
      setForm({
        type: question.type || "multiple_choice",
        prompt: question.prompt || "",
        difficulty: question.difficulty || "easy",
        xpValue: question.xpValue || 2,
        explanation: question.explanation || "",
        hint: question.hint || "",
        conceptExplanation: question.conceptExplanation || "",
        tags: question.tags ? question.tags.join(", ") : "",
        isReviewed: question.isReviewed || false,
        isActive: question.isActive || false,
        options: question.options?.length ? question.options : [{ text: "", isCorrect: false, explanation: "" }],
        correctBoolean: question.correctBoolean ?? true,
        correctAnswers: question.correctAnswers?.length ? question.correctAnswers : [""],
        items: question.items?.length ? question.items : [""],
        pairs: question.pairs?.length ? question.pairs : [{ left: "", right: "" }],
        wordBank: question.wordBank?.length ? question.wordBank : [""],
      });
    } else {
      // Reset cuando se crea nueva
      setForm({
        type: "multiple_choice",
        prompt: "",
        difficulty: "easy",
        xpValue: 2,
        explanation: "",
        hint: "",
        conceptExplanation: "",
        tags: "",
        isReviewed: false,
        isActive: false,
        options: [{ text: "", isCorrect: false, explanation: "" }],
        correctBoolean: true,
        correctAnswers: [""],
        items: [""],
        pairs: [{ left: "", right: "" }],
        wordBank: [""],
      });
    }
  }, [question]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name) => {
    setForm(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Manejo de arrays simples (correctAnswers, items, wordBank)
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

    const payload = {
      ...form,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      xpValue: Number(form.xpValue),
      isReviewed: form.isReviewed,
      isActive: form.isActive,
    };

    // Limpiar campos no usados según tipo
    const type = form.type;
    if (type !== "multiple_choice") delete payload.options;
    if (type !== "true_false") delete payload.correctBoolean;
    if (type !== "fill_blank") delete payload.correctAnswers;
    if (type !== "order_items") delete payload.items;
    if (type !== "match_pairs") delete payload.pairs;
    if (type !== "sentence_builder") delete payload.wordBank;

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
          <button onClick={onClose} className="text-gray-400 hover:text-white text-4xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[calc(95vh-80px)] space-y-8">

          {/* === NUEVO: Estado de Revisión === */}
          {question && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Estado de Revisión</h3>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isReviewed}
                    onChange={() => handleSwitchChange("isReviewed")}
                    className="w-5 h-5 accent-violet-500"
                  />
                  <span className="text-white">Revisada por admin</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={() => handleSwitchChange("isActive")}
                    className="w-5 h-5 accent-emerald-500"
                  />
                  <span className="text-white">Activa (visible para estudiantes)</span>
                </label>
              </div>
            </div>
          )}

          {/* Tipo y Dificultad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-gray-400 text-sm font-medium ml-1">Tipo de Pregunta</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all"
              >
                <option value="multiple_choice">Opción Múltiple</option>
                <option value="true_false">Verdadero / Falso</option>
                <option value="fill_blank">Completar el Espacio</option>
                <option value="order_items">Ordenar Elementos</option>
                <option value="match_pairs">Relacionar Columnas</option>
                <option value="sentence_builder">Construir Oración</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 text-sm font-medium ml-1">Dificultad</label>
              <select
                name="difficulty"
                value={form.difficulty}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all"
              >
                <option value="easy">Fácil</option>
                <option value="medium">Medio</option>
                <option value="hard">Difícil</option>
              </select>
            </div>
          </div>

          {/* Enunciado */}
          <div className="space-y-2">
            <label className="text-gray-400 text-sm font-medium ml-1">Enunciado de la Pregunta</label>
            <textarea
              name="prompt"
              value={form.prompt}
              onChange={handleChange}
              required
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all resize-none"
              placeholder="Ejemplo: ¿Cuál es el resultado de 14 + 25?"
            />
          </div>

          {/* Contenedor Dinámico */}
          <div className="bg-gray-950/50 border border-gray-800 rounded-3xl p-6 ring-1 ring-inset ring-white/5">
            {form.type === "multiple_choice" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  Opciones <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded-lg uppercase tracking-wider">Mínimo 4</span>
                </h3>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex flex-wrap md:flex-nowrap gap-3 mb-4 items-start">
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionChange(i, "text", e.target.value)}
                      placeholder="Texto de la opción"
                      className="flex-[2] min-w-[200px] bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-violet-400 outline-none"
                    />
                    <input
                      type="text"
                      value={opt.explanation}
                      onChange={(e) => handleOptionChange(i, "explanation", e.target.value)}
                      placeholder="Explicación (opcional)"
                      className="flex-[2] min-w-[200px] bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-violet-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleOptionChange(i, "isCorrect", !opt.isCorrect)}
                      className={`px-4 py-2.5 rounded-xl font-medium transition-colors min-w-[100px] ${
                        opt.isCorrect ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700"
                      }`}
                    >
                      {opt.isCorrect ? "Correcta" : "Incorrecta"}
                    </button>
                    <button type="button" onClick={() => removeOption(i)} className="text-gray-500 hover:text-red-400 p-2.5 transition-colors">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addOption} className="text-violet-400 hover:text-violet-300 flex items-center gap-2 text-sm font-medium mt-2">
                  <Plus size={18} /> Agregar opción
                </button>
              </div>
            )}

            {form.type === "true_false" && (
              <div className="space-y-4">
                <label className="text-white font-medium mb-3 block">Respuesta Correcta</label>
                <div className="flex gap-4">
                  { [true, false].map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setForm({ ...form, correctBoolean: val })}
                      className={`flex-1 py-4 rounded-2xl font-semibold border transition-all ${
                        form.correctBoolean === val 
                        ? "bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/20" 
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      {val ? "Verdadero" : "Falso"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {form.type === "fill_blank" && (
              <div className="space-y-3">
                <label className="text-white font-medium block">Respuestas Correctas</label>
                <p className="text-xs text-gray-500 italic">Separa las variantes aceptadas con comas</p>
                <input
                  type="text"
                  value={form.correctAnswers.join(", ")}
                  onChange={(e) => setForm({ ...form, correctAnswers: e.target.value.split(",").map(s => s.trim()) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white focus:border-violet-500 outline-none"
                  placeholder="Ej: 39, treinta y nueve"
                />
              </div>
            )}

            {form.type === "match_pairs" && (
              <div className="space-y-3">
                {form.pairs.map((pair, idx) => (
                  <div key={idx} className="flex gap-3 items-center animate-in fade-in duration-300">
                    <input 
                      type="text" 
                      placeholder="Lado A"
                      value={pair.left}
                      onChange={(e) => {
                        const newPairs = [...form.pairs];
                        newPairs[idx].left = e.target.value;
                        setForm({...form, pairs: newPairs});
                      }}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-400"
                    />
                    <span className="text-gray-600">→</span>
                    <input 
                      type="text" 
                      placeholder="Lado B"
                      value={pair.right}
                      onChange={(e) => {
                        const newPairs = [...form.pairs];
                        newPairs[idx].right = e.target.value;
                        setForm({...form, pairs: newPairs});
                      }}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-400"
                    />
                    <button type="button" onClick={() => removeArrayItem("pairs", idx)} className="text-gray-500 hover:text-red-500 transition-colors">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setForm({...form, pairs: [...form.pairs, {left: "", right: ""}]})} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium">
                  <Plus size={14}/> Añadir par
                </button>
              </div>
            )}
          </div>

          {/* Información Adicional */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-gray-400 text-sm font-medium ml-1">Pista (Hint)</label>
              <input
                type="text"
                name="hint"
                value={form.hint}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white focus:border-violet-500 outline-none"
                placeholder="Ej: Revisa las unidades..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 text-sm font-medium ml-1">Explicación post-respuesta</label>
              <textarea
                name="explanation"
                value={form.explanation}
                onChange={handleChange}
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white focus:border-violet-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-gray-400 text-sm font-medium ml-1">Tags</label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white focus:border-violet-500 outline-none"
              placeholder="matemáticas, primaria, lógica"
            />
          </div>

          {/* Botones finales */}
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
              className="flex-[2] py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold transition-all active:scale-[0.98]"
            >
              {question ? "Guardar Cambios" : "Crear Pregunta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}