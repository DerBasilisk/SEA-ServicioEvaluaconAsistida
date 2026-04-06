import { useState } from "react";

const OPTIONS = [
  { 
    label: "¡SÍ, ES CIERTO!", 
    icon: "🔥", 
    value: true, 
    color: "from-emerald-400 to-emerald-600", 
    glow: "shadow-[0_25px_50px_-10px_rgba(16,185,129,0.5)]",
    ring: "ring-emerald-400/30"
  },
  { 
    label: "¡MIRA, ESO ES FALSO!", 
    icon: "🧊", 
    value: false, 
    color: "from-rose-500 to-rose-700", 
    glow: "shadow-[0_25px_50px_-10px_rgba(244,63,94,0.5)]",
    ring: "ring-rose-400/30"
  },
];

export default function TrueFalse({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);

  const handleConfirm = () => {
    if (selected === null) return;
    onAnswer(selected);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 select-none">
      
      {/* Contenedor de Opciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          
          return (
            <button
              key={String(opt.value)}
              onClick={() => setSelected(opt.value)}
              className={`
                relative h-56 rounded-[4rem] border-2 transition-all duration-500 overflow-hidden
                flex flex-col items-center justify-center gap-4
                ${isSelected 
                  ? `bg-gradient-to-br ${opt.color} ${opt.glow} scale-105 -translate-y-2 border-white/40 ring-[12px] ${opt.ring}` 
                  : 'bg-white/10 backdrop-blur-3xl border-white/10 shadow-2xl hover:bg-white/15'
                }
                active:scale-95
              `}
            >
              {/* Reflejos Pro (Efecto burbuja) */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-3 bg-white/40 rounded-full blur-[2px] pointer-events-none" />
              <div className="absolute top-12 left-10 w-4 h-4 bg-white/60 rounded-full blur-[1px] pointer-events-none" />

              {/* Icono Animado */}
              <div className={`
                text-7xl transition-all duration-700 
                ${isSelected ? 'scale-125 rotate-[15deg] drop-shadow-2xl' : 'opacity-30 grayscale rotate-0'}
              `}>
                {opt.icon}
              </div>

              {/* Texto Melo */}
              <span className={`
                font-black italic tracking-tighter text-lg uppercase
                ${isSelected ? 'text-white' : 'text-slate-500'}
              `}>
                {opt.label}
              </span>

              {/* Partículas internas solo si está seleccionado */}
              {isSelected && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full animate-pulse opacity-20 bg-[radial-gradient(circle,_#fff_1px,_transparent_1px)] bg-[length:15px_15px]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Botón de Confirmar: El "Boss Final" */}
      <div className="relative group">
        <button
          onClick={handleConfirm}
          disabled={selected === null}
          className={`
            w-full py-7 rounded-[2.5rem] font-black uppercase italic tracking-[0.4em] text-xs transition-all duration-500
            border-t border-white/30 overflow-hidden relative
            ${selected !== null 
              ? 'bg-[#0078d4] text-white shadow-[0_30px_60px_-15px_rgba(0,120,212,0.6)] hover:scale-[1.03] active:scale-90' 
              : 'bg-slate-800/40 text-slate-600 border border-white/5 cursor-not-allowed'}
          `}
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
             {selected !== null ? "¡LÁNZALO! 🚀" : "ESPERANDO RESPUESTA..."}
          </span>

          {/* Animación de Carga Premium si hay selección */}
          {selected !== null && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] pointer-events-none" />
          )}
        </button>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}