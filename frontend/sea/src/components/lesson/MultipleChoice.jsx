// frontend/sea/src/components/lesson/MultipleChoice.jsx
import { useState } from "react";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

const MC_CSS = `
  .option-card {
    background: var(--glass-bg);
    backdrop-filter: blur(10px);
    border: 2px solid white;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  /* Solo aplicamos hover si no se ha enviado y no está seleccionado */
  .option-card:hover:not(.selected):not(.submitted) {
    background: rgba(255, 255, 255, 0.8);
    transform: translateX(8px);
    border-color: #2B7FE8;
  }
  .option-card.selected {
    background: white;
    border-color: #2B7FE8;
    box-shadow: 0 10px 25px rgba(43, 127, 232, 0.15);
    transform: scale(1.02);
  }
  .sea-btn-main {
    background: #2B7FE8;
    box-shadow: 0 10px 25px rgba(43, 127, 232, 0.3);
  }
`;

export default function MultipleChoice({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  const handleSelect = (optionId) => {
    if (submitted) return; // Bloquea selección tras confirmar
    setSelected(optionId);
  };

  const handleConfirm = async () => {
    if (!selected || submitted) return;

    setSubmitted(true);
    try {
      const result = await onAnswer(selected);
      setIsCorrect(result.isCorrect);
    } catch (err) {
      console.error("Error al validar respuesta:", err);
      setIsCorrect(false); 
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <style>{MC_CSS}</style>

      <div className="space-y-3">
        {question.options?.map((option) => {
          const isSelected = selected === option._id;
          // Mostramos verde si es la correcta (asumiendo que el objeto option trae isCorrect tras validar)
          // O si el servidor nos dice qué ID era el correcto.
          const isTheCorrectOne = submitted && option.isCorrect;
          const isWrongSelected = submitted && isSelected && !option.isCorrect;

          return (
            <button
              key={option._id}
              onClick={() => handleSelect(option._id)}
              disabled={submitted}
              className={`
                option-card w-full flex items-center justify-between px-6 py-5 rounded-[1.5rem] 
                text-left transition-all active:scale-[0.98] group submitted
                ${isSelected ? "selected" : ""}
                ${isTheCorrectOne ? "border-emerald-500 bg-emerald-50/50" : ""}
                ${isWrongSelected ? "border-red-500 bg-red-50/50" : ""}
                ${submitted ? "cursor-default" : "cursor-pointer"}
              `}
            >
              <span className={`text-lg font-black italic tracking-tight transition-colors ${
                isTheCorrectOne ? "text-emerald-600" : 
                isWrongSelected ? "text-red-600" : 
                isSelected ? "text-[#2B7FE8]" : "text-[--text-primary]"
              }`}>
                {option.text}
              </span>

              <div className="flex-shrink-0 ml-4">
                {submitted ? (
                  isTheCorrectOne ? (
                    <CheckCircle2 size={24} className="text-emerald-600" />
                  ) : isWrongSelected ? (
                    <AlertCircle size={24} className="text-red-600" />
                  ) : (
                    <Circle size={24} className="text-slate-200" />
                  )
                ) : (
                  isSelected ? (
                    <CheckCircle2 size={24} className="text-[#2B7FE8] fill-blue-50" />
                  ) : (
                    <Circle size={24} className="text-slate-300 group-hover:text-[#2B7FE8] transition-colors" />
                  )
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <div className="pt-4">
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="sea-btn-main w-full py-5 rounded-[1.5rem] text-white font-black italic uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
          >
            Confirmar Protocolo
          </button>
          
          <p className={`text-center mt-4 text-[#7A9CC5] text-[10px] font-black uppercase tracking-[0.2em] transition-opacity duration-300 ${selected ? 'opacity-100' : 'opacity-0'}`}>
            Confirmación de sistema disponible
          </p>
        </div>
      ) : (
        // Espaciador opcional para cuando el botón desaparece
        <div className="py-2" />
      )}
    </div>
  );
}