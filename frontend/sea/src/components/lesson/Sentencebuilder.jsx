import { useState, useMemo, useEffect } from "react";
import { ChevronRight, Layers, CheckCircle, RefreshCw } from "lucide-react";

const SB_CSS = `
  .sentence-container {
    background: rgba(15, 37, 71, 0.4);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.1);
  }
  .blank-slot {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 100px;
    border-style: dashed;
  }
  .blank-active {
    border-color: #2B7FE8;
    background: rgba(43, 127, 232, 0.1);
    box-shadow: 0 0 15px rgba(43, 127, 232, 0.2);
    border-style: solid;
    transform: translateY(-2px);
  }
  .blank-filled {
    border-color: #10B981;
    background: var(--glass-bg);
    color: var(--text-primary);
    border-style: solid;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
  }
  .word-chip {
    background: var(--glass-bg);
    border: 2px solid #E2E8F0;
    transition: all 0.2s;
  }
  .word-chip:hover {
    border-color: #2B7FE8;
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(43, 127, 232, 0.15);
  }
  .word-chip-disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none !important;
  }
`;

export default function SentenceBuilder({ question, onAnswer, onReport }) {
  // Normalizar el prompt para asegurar espacios correctos
  const normalizedPrompt = useMemo(() => {
    let prompt = question.prompt || "";
    
    // Si el prompt no tiene "___", intentar detectar espacios vacíos
    if (!prompt.includes("___")) {
      // Buscar patrones como "_____" o "______" (múltiples guiones bajos)
      prompt = prompt.replace(/_{3,}/g, "___");
    }
    
    // Asegurar que haya espacios alrededor de los placeholders
    prompt = prompt.replace(/([^\s])___/g, "$1 ___");
    prompt = prompt.replace(/___([^\s])/g, "___ $1");
    prompt = prompt.replace(/\s+/g, ' ').trim();
    
    return prompt;
  }, [question.prompt]);

  // Dividir el prompt normalizado
  const parts = useMemo(() => {
    const splitParts = normalizedPrompt.split("___");
    // Limpiar espacios en blanco al inicio/final de cada parte
    return splitParts.map(part => part.trim());
  }, [normalizedPrompt]);
  
  const blanksCount = parts.length - 1;
  
  const [selected, setSelected] = useState(Array(blanksCount).fill(null));
  const [activeBlank, setActiveBlank] = useState(0);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validar que el wordBank existe y tiene palabras
  useEffect(() => {
    if (!question.wordBank || question.wordBank.length === 0) {
      setError("No hay palabras disponibles para construir la oración.");
    } else if (blanksCount === 0) {
      setError("No se encontraron espacios para completar en la oración.");
    } else {
      setError(null);
    }
  }, [question.wordBank, blanksCount]);

  // Palabras usadas actualmente
  const usedWords = selected.filter(Boolean);
  
  // Palabras disponibles (excluyendo las ya usadas)
  const availableWords = useMemo(() => {
    if (!question.wordBank || question.wordBank.length === 0) return [];
    
    let used = [...usedWords];
    return question.wordBank.filter((w) => {
      const idx = used.indexOf(w);
      if (idx !== -1) {
        used.splice(idx, 1);
        return false;
      }
      return true;
    });
  }, [selected, question.wordBank]);

  const handleSelectWord = (word) => {
    if (activeBlank >= blanksCount) return;
    
    const newSelected = [...selected];
    newSelected[activeBlank] = word;
    setSelected(newSelected);
    
    // Mover al siguiente espacio vacío
    const nextEmpty = newSelected.findIndex((v, i) => i > activeBlank && !v);
    if (nextEmpty !== -1) {
      setActiveBlank(nextEmpty);
    } else {
      // Si no hay más vacíos después, buscar el primero vacío
      const firstEmpty = newSelected.findIndex(v => !v);
      if (firstEmpty !== -1) {
        setActiveBlank(firstEmpty);
      }
    }
  };

  const handleRemoveWord = (idx) => {
    const newSelected = [...selected];
    const removedWord = newSelected[idx];
    newSelected[idx] = null;
    setSelected(newSelected);
    setActiveBlank(idx);
  };

  const handleReset = () => {
    setSelected(Array(blanksCount).fill(null));
    setActiveBlank(0);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!allFilled) {
      setError("Completa todos los espacios antes de continuar.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // La respuesta debe ser el array de palabras en orden
      await onAnswer(selected);
    } catch (err) {
      setError("Error al enviar la respuesta. Intenta nuevamente.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allFilled = selected.every(Boolean);

  // Renderizar la oración con los espacios
  const renderSentence = () => {
    return parts.map((part, i) => (
      <div key={i} className="flex items-center gap-2 flex-wrap">
        {part && (
          <span className="text-[--text-primary] font-black italic text-xl md:text-2xl tracking-tight">
            {part}
          </span>
        )}
        {i < blanksCount && (
          <button
            onClick={() => handleRemoveWord(i)}
            className={`
              blank-slot px-4 py-2 rounded-2xl font-black italic text-lg transition-all min-w-[100px] text-left
              ${selected[i] 
                ? "blank-filled" 
                : activeBlank === i 
                  ? "blank-active text-[#2B7FE8]" 
                  : "border-slate-300 text-slate-400"
              }
            `}
          >
            {selected[i] || <span className="text-xs uppercase tracking-widest opacity-50">Seleccionar</span>}
          </button>
        )}
      </div>
    ));
  };

  if (error) {
    return (
      <div className="w-full max-w-3xl mx-auto p-8 bg-red-50 rounded-[2rem] border-2 border-red-200">
        <div className="text-center">
          <p className="text-red-600 font-bold mb-4">{error}</p>
          {onReport && (
            <button
              onClick={() => onReport("Pregunta con error de formato")}
              className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm"
            >
              Reportar Problema
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <style>{SB_CSS}</style>

      {/* Área de Construcción */}
      <div className="sentence-container rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-5 leading-[3rem]">
          {renderSentence()}
        </div>
      </div>

      {/* Banco de Palabras */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-[#7A9CC5]">
            <Layers size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Banco de Palabras
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="text-[10px] font-black text-slate-500 uppercase bg-slate-100 px-3 py-1 rounded-full hover:bg-slate-200 transition-colors flex items-center gap-1"
            >
              <RefreshCw size={10} />
              Reiniciar
            </button>
            <span className="text-[10px] font-black text-[#2B7FE8] uppercase bg-blue-50 px-3 py-1 rounded-full">
              {allFilled 
                ? "✓ Completado" 
                : `Espacio ${activeBlank + 1} de ${blanksCount}`
              }
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center min-h-[100px] p-6 bg-[--glass-bg] rounded-[2rem] border-2 border-dashed border-slate-200">
          {availableWords.length > 0 ? (
            availableWords.map((word, i) => (
              <button
                key={`${word}-${i}`}
                onClick={() => handleSelectWord(word)}
                className="word-chip px-6 py-3 rounded-2xl text-[--text-primary] font-black italic text-md active:scale-90 hover:shadow-lg transition-all"
              >
                {word}
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center opacity-40 py-4">
              <CheckCircle size={24} className="text-emerald-500 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {allFilled ? "¡Oración completa!" : "No hay más palabras disponibles"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Información de palabras restantes */}
      <div className="text-center text-xs text-slate-400">
        Palabras usadas: {usedWords.length} / {question.wordBank?.length || 0}
      </div>

      {/* Botón de Confirmación */}
      <div className="pt-2">
        <button
          onClick={handleSubmit}
          disabled={!allFilled || isSubmitting}
          className="w-full group bg-[#2B7FE8] disabled:bg-slate-200 disabled:opacity-50 text-white font-black italic uppercase tracking-[0.2em] py-6 rounded-[1.8rem] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20"
        >
          {isSubmitting ? (
            <>Procesando...</>
          ) : (
            <>
              <span>{allFilled ? "Validar Oración" : "Completa todos los espacios"}</span>
              <ChevronRight size={20} className={allFilled ? "animate-pulse" : ""} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}