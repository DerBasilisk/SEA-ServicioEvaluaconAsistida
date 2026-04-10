import { useState, useMemo } from "react";
import { ChevronRight, Layers, CheckCircle } from "lucide-react";

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
    background: white;
    color: #065F46;
    border-style: solid;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
  }
  .word-chip {
    background: white;
    border: 2px solid #E2E8F0;
    transition: all 0.2s;
  }
  .word-chip:hover {
    border-color: #2B7FE8;
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(43, 127, 232, 0.15);
  }
`;

export default function SentenceBuilder({ question, onAnswer, onReport }) {
  const parts = question.prompt.split("___");
  const blanksCount = parts.length - 1;
  const [selected, setSelected] = useState(Array(blanksCount).fill(null));
  const [activeBlank, setActiveBlank] = useState(0);

  const usedWords = selected.filter(Boolean);
  const availableWords = useMemo(() => {
    let used = [...usedWords];
    return (question.wordBank || []).filter((w) => {
      const idx = used.indexOf(w);
      if (idx !== -1) {
        used.splice(idx, 1);
        return false;
      }
      return true;
    });
  }, [selected, question.wordBank]);

  const handleSelectWord = (word) => {
    const newSelected = [...selected];
    newSelected[activeBlank] = word;
    setSelected(newSelected);
    
    const nextEmpty = newSelected.findIndex((v, i) => i > activeBlank && !v);
    if (nextEmpty !== -1) setActiveBlank(nextEmpty);
    else {
      const firstEmpty = newSelected.findIndex(v => !v);
      if (firstEmpty !== -1) setActiveBlank(firstEmpty);
    }
  };

  const handleRemoveWord = (idx) => {
    const newSelected = [...selected];
    newSelected[idx] = null;
    setSelected(newSelected);
    setActiveBlank(idx);
  };

  const allFilled = selected.every(Boolean);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <style>{SB_CSS}</style>

      {/* Área de Construcción */}
      <div className="sentence-container rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-5 leading-[3rem]">
          {parts.map((part, i) => (
            <div key={i} className="flex items-center gap-3 flex-wrap">
              <span className="text-[--text-primary] font-black italic text-xl md:text-2xl tracking-tight">
                {part}
              </span>
              {i < blanksCount && (
                <button
                  onClick={() => handleRemoveWord(i)}
                  className={`
                    blank-slot px-4 py-2 rounded-2xl font-black italic text-lg transition-all
                    ${selected[i] ? "blank-filled" : activeBlank === i ? "blank-active text-[#2B7FE8]" : "border-slate-300 text-slate-400"}
                  `}
                >
                  {selected[i] || <span className="text-[10px] uppercase tracking-widest opacity-50">Insertar</span>}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Banco de Palabras (Chips) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-[#7A9CC5]">
            <Layers size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Banco de Datos</span>
          </div>
          <span className="text-[10px] font-black text-[#2B7FE8] uppercase bg-blue-50 px-3 py-1 rounded-full">
            {allFilled ? "Listo para validar" : `Hueco activo: ${activeBlank + 1}`}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 justify-center min-h-[100px] p-6 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
          {availableWords.map((word, i) => (
            <button
              key={i}
              onClick={() => handleSelectWord(word)}
              className="word-chip px-6 py-3 rounded-2xl text-[--text-primary] font-black italic text-md active:scale-90"
            >
              {word}
            </button>
          ))}
          {availableWords.length === 0 && (
            <div className="flex flex-col items-center justify-center opacity-40 py-4">
              <CheckCircle size={24} className="text-emerald-500 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secuencia Completa</p>
            </div>
          )}
        </div>
      </div>

      {/* Botón de Confirmación */}
      <div className="pt-2">
        <button
          onClick={() => allFilled && onAnswer(selected)}
          disabled={!allFilled}
          className="w-full group bg-[#2B7FE8] disabled:bg-slate-200 disabled:opacity-50 text-white font-black italic uppercase tracking-[0.2em] py-6 rounded-[1.8rem] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20"
        >
          <span>{allFilled ? "Sincronizar Oración" : "Construyendo..."}</span>
          <ChevronRight size={20} className={allFilled ? "animate-pulse" : ""} />
        </button>
      </div>
    </div>
  );
}