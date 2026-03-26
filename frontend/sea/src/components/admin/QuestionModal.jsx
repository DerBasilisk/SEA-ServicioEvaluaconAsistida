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
        type: question.type,
        prompt: question.prompt || "",
        difficulty: question.difficulty || "easy",
        xpValue: question.xpValue || 2,
        explanation: question.explanation || "",
        hint: question.hint || "",
        conceptExplanation: question.conceptExplanation || "",
        tags: question.tags ? question.tags.join(", ") : "",
        options: question.options?.length ? question.options : [{ text: "", isCorrect: false, explanation: "" }],
        correctBoolean: question.correctBoolean ?? true,
        correctAnswers: question.correctAnswers?.length ? question.correctAnswers : [""],
        items: question.items?.length ? question.items : [""],
        pairs: question.pairs?.length ? question.pairs : [{ left: "", right: "" }],
        wordBank: question.wordBank?.length ? question.wordBank : [""],
      });
    }
  }, [question]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {question ? "Editar Pregunta" : "Crear Nueva Pregunta"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-4xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[calc(95vh-80px)] space-y-8">
          
          {/* Tipo y Dificultad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Tipo de Pregunta</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white focus:border-violet-500"
              >
                <option value="multiple_choice">Opción Múltiple</option>
                <option value="true_false">Verdadero / Falso</option>
                <option value="fill_blank">Completar el Espacio</option>
                <option value="order_items">Ordenar Elementos</option>
                <option value="match_pairs">Relacionar Columnas</option>
                <option value="sentence_builder">Construir Oración</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Dificultad</label>
              <select
                name="difficulty"
                value={form.difficulty}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white"
              >
                <option value="easy">Fácil</option>
                <option value="medium">Medio</option>
                <option value="hard">Difícil</option>
              </select>
            </div>
          </div>

          {/* Enunciado */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Enunciado de la Pregunta</label>
            <textarea
              name="prompt"
              value={form.prompt}
              onChange={handleChange}
              required
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-3xl px-5 py-4 text-white resize-y min-h-[100px]"
              placeholder="Ejemplo: ¿Cuál es el resultado de 14 + 25?"
            />
          </div>

          {/* Campos dinámicos según tipo */}
          <div className="bg-gray-950 border border-gray-800 rounded-3xl p-6">
            {form.type === "multiple_choice" && (
              <div>
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  Opciones <span className="text-xs bg-gray-800 px-2 py-1 rounded">Mínimo 4</span>
                </h3>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex gap-3 mb-4 items-start">
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionChange(i, "text", e.target.value)}
                      placeholder="Texto de la opción"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3"
                    />
                    <input
                      type="text"
                      value={opt.explanation}
                      onChange={(e) => handleOptionChange(i, "explanation", e.target.value)}
                      placeholder="Explicación (opcional)"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3"
                    />
                    <button
                      type="button"
                      onClick={() => handleOptionChange(i, "isCorrect", !opt.isCorrect)}
                      className={`px-6 py-3 rounded-2xl font-medium ${opt.isCorrect ? "bg-emerald-600 text-white" : "bg-gray-700"}`}
                    >
                      {opt.isCorrect ? "Correcta" : "Incorrecta"}
                    </button>
                    <button type="button" onClick={() => removeOption(i)} className="text-red-400 p-3">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addOption} className="text-violet-400 flex items-center gap-2">
                  <Plus size={18} /> Agregar opción
                </button>
              </div>
            )}

            {form.type === "true_false" && (
              <div>
                <label className="text-white font-medium mb-3 block">Respuesta Correcta</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, correctBoolean: true })}
                    className={`flex-1 py-4 rounded-2xl font-medium ${form.correctBoolean ? "bg-emerald-600 text-white" : "bg-gray-800"}`}
                  >
                    Verdadero
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, correctBoolean: false })}
                    className={`flex-1 py-4 rounded-2xl font-medium ${!form.correctBoolean ? "bg-emerald-600 text-white" : "bg-gray-800"}`}
                  >
                    Falso
                  </button>
                </div>
              </div>
            )}

            {form.type === "fill_blank" && (
              <div>
                <label className="text-white font-medium mb-2 block">Respuestas Correctas (separadas por coma)</label>
                <input
                  type="text"
                  value={form.correctAnswers.join(", ")}
                  onChange={(e) => setForm({ ...form, correctAnswers: e.target.value.split(",").map(s => s.trim()) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4"
                  placeholder="39, treinta y nueve, 39."
                />
              </div>
            )}

            {/* Relacionar Columnas */}
            {form.type === "match_pairs" && (
              <div className="space-y-3">
                {form.pairs.map((pair, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      placeholder="Lado A"
                      value={pair.left}
                      onChange={(e) => {
                        const newPairs = [...form.pairs];
                        newPairs[idx].left = e.target.value;
                        setForm({...form, pairs: newPairs});
                      }}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white"
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
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white"
                    />
                    <button type="button" onClick={() => removeArrayItem("pairs", idx)} className="text-red-500">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setForm({...form, pairs: [...form.pairs, {left: "", right: ""}]})} className="text-xs text-violet-400 flex items-center gap-1">
                  <Plus size={14}/> Añadir par
                </button>
              </div>
            )}

            {/* Ordenar Elementos */}
            {form.type === "order_items" && (
              <div className="space-y-3">
                <p className="text-[10px] text-gray-500 mb-2 italic uppercase">Orden correcto de arriba hacia abajo</p>
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="text-gray-600 font-mono text-xs w-4">{idx + 1}.</span>
                    <input 
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange("items", idx, e.target.value)}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white"
                    />
                    <button type="button" onClick={() => removeArrayItem("items", idx)} className="text-red-500">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem("items")} className="text-xs text-violet-400 flex items-center gap-1">
                  <Plus size={14}/> Añadir elemento
                </button>
              </div>
            )}

            {/* Puedes seguir agregando los otros tipos más adelante */}
          </div>

          {/* Hint, Explicación y Concepto */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Hint / Pista (máx 15 palabras)</label>
              <input
                type="text"
                name="hint"
                value={form.hint}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3"
                placeholder="Alinea las unidades y suma de derecha a izquierda"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Explicación (después de responder)</label>
              <textarea
                name="explanation"
                value={form.explanation}
                onChange={handleChange}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-3xl px-5 py-4"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Concept Explanation (concepto general)</label>
              <textarea
                name="conceptExplanation"
                value={form.conceptExplanation}
                onChange={handleChange}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-3xl px-5 py-4"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Tags (separados por coma)</label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3"
              placeholder="suma, dos cifras, básicas"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-6 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-2xl text-white font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-violet-600 hover:bg-violet-500 rounded-2xl text-white font-medium transition"
            >
              {question ? "Guardar Cambios" : "Crear Pregunta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}