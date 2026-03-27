import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

const MC_CSS = `
  .option-card {
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
    border: 2px solid white;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .option-card:hover:not(.selected) {
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

  const handleConfirm = () => {
    if (!selected) return;
    onAnswer(selected);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <style>{MC_CSS}</style>
      
      <div className="space-y-3">
        {question.options?.map((option) => {
          const isSelected = selected === option._id;
          
          return (
            <button
              key={option._id}
              onClick={() => setSelected(option._id)}
              className={`
                option-card w-full flex items-center justify-between px-6 py-5 rounded-[1.5rem] 
                text-left transition-all active:scale-[0.98] group
                ${isSelected ? "selected" : ""}
              `}
            >
              <span className={`text-lg font-black italic tracking-tight transition-colors ${
                isSelected ? "text-[#2B7FE8]" : "text-[#0F2547]"
              }`}>
                {option.text}
              </span>

              <div className="flex-shrink-0 ml-4">
                {isSelected ? (
                  <CheckCircle2 size={24} className="text-[#2B7FE8] fill-blue-50" />
                ) : (
                  <Circle size={24} className="text-slate-300 group-hover:text-[#2B7FE8] transition-colors" />
                )}
              </div>
            </button>
          );
        })}
      </div>

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
    </div>
  );
}