import { useState } from "react";
import { Check, X, ShieldCheck, ShieldAlert } from "lucide-react";

const TF_CSS = `
  .tf-card {
    background: var(--glass-bg);
    backdrop-filter: blur(10px);
    border: 2px solid white;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .tf-card.selected-true {
    background: var(--true-bg);
    border-color: #10B981;
    box-shadow: 0 15px 30px rgba(16, 185, 129, 0.2);
    transform: translateY(-8px) scale(1.05);
  }
  .tf-card.selected-false {
    background: var(--false-bg);
    border-color: #EF4444;
    box-shadow: 0 15px 30px rgba(239, 68, 68, 0.2);
    transform: translateY(-8px) scale(1.05);
  }
  .tf-card:hover:not(.selected) {
    background: var(--glass-bg-small);
    transform: translateY(-4px);
  }
  .sea-btn-confirm {
    background: #2B7FE8;
    box-shadow: 0 10px 25px rgba(43, 127, 232, 0.3);
  }
`;

export default function TrueFalse({ question, onAnswer, onReport, }) {
  const [selected, setSelected] = useState(null);

  const handleConfirm = () => {
    if (selected === null) return;
    onAnswer(selected);
  };

  const options = [
    { 
      label: "Verdadero", 
      value: true, 
      icon: <ShieldCheck size={32} />, 
      activeClass: "selected-true",
      activeText: "text-emerald-600"
    },
    { 
      label: "Falso", 
      value: false, 
      icon: <ShieldAlert size={32} />, 
      activeClass: "selected-false",
      activeText: "text-rose-600"
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
      <style>{TF_CSS}</style>
      
      <div className="grid grid-cols-2 gap-6">
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          
          return (
            <button
              key={String(opt.value)}
              onClick={() => setSelected(opt.value)}
              className={`
                tf-card group relative flex flex-col items-center justify-center py-10 rounded-[2.5rem] 
                transition-all active:scale-95
                ${isSelected ? opt.activeClass + " selected" : "opacity-60"}
              `}
            >
              <div className={`mb-4 transition-transform duration-500 ${isSelected ? "scale-125 rotate-[360deg]" : "group-hover:scale-110"}`}>
                <span className={isSelected ? opt.activeText : "text-slate-400"}>
                  {opt.icon}
                </span>
              </div>
              
              <span className={`font-black italic uppercase tracking-tighter text-lg transition-colors ${
                isSelected ? opt.activeText : "text-[--text-primary]"
              }`}>
                {opt.label}
              </span>

              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border-2 border-inherit">
                  <Check size={16} className={opt.activeText} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-4">
        <button
          onClick={handleConfirm}
          disabled={selected === null}
          className="sea-btn-confirm w-full group flex items-center justify-center gap-3 text-white font-black italic uppercase tracking-[0.2em] py-5 rounded-[1.5rem] transition-all active:scale-95 disabled:opacity-20 disabled:grayscale"
        >
          <span>Validar Declaración</span>
          <Check size={20} className="group-hover:scale-125 transition-transform" />
        </button>
        
        <p className={`text-center mt-4 text-[#7A9CC5] text-[10px] font-black uppercase tracking-[0.3em] transition-opacity duration-500 ${selected !== null ? 'opacity-100' : 'opacity-0'}`}>
          Análisis de datos completo
        </p>
      </div>
    </div>
  );
}