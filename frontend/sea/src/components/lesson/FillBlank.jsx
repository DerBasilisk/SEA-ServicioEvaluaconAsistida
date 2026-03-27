import { useState } from "react";
import { SendHorizonal } from "lucide-react";

const INPUT_CSS = `
  .sea-input {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    border: 2px solid white;
    box-shadow: 0 8px 32px rgba(43, 127, 232, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .sea-input:focus {
    background: white;
    border-color: #2B7FE8;
    box-shadow: 0 0 20px rgba(43, 127, 232, 0.2);
    transform: translateY(-2px);
  }
  .sea-btn-confirm {
    background: #2B7FE8;
    box-shadow: 0 10px 25px rgba(43, 127, 232, 0.3);
  }
  .sea-btn-confirm:hover:not(:disabled) {
    background: #1A6FD8;
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(43, 127, 232, 0.4);
  }
`;

export default function FillBlank({ question, onAnswer }) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!value.trim() || submitted) return;
    setSubmitted(true);
    onAnswer(value.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <style>{INPUT_CSS}</style>
      
      <div className="relative group">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={submitted}
          autoFocus
          placeholder="Escribe la respuesta aquí..."
          className="sea-input w-full text-[#0F2547] font-black italic text-xl rounded-[1.5rem] px-8 py-6 outline-none placeholder:text-slate-400 placeholder:font-bold placeholder:italic disabled:opacity-50 transition-all"
        />
        
        {/* Indicador visual de "Escribiendo" */}
        <div className={`absolute right-6 top-1/2 -translate-y-1/2 transition-opacity duration-300 ${value.length > 0 && !submitted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-[#2B7FE8] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-[#2B7FE8] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-[#2B7FE8] rounded-full animate-bounce"></span>
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!value.trim() || submitted}
        className="sea-btn-confirm w-full group flex items-center justify-center gap-3 text-white font-black italic uppercase tracking-widest py-5 rounded-[1.5rem] transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
      >
        <span>Confirmar Entrada</span>
        <SendHorizonal size={20} className="group-hover:translate-x-1 transition-transform" />
      </button>

      <p className="text-center text-[#7A9CC5] text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
        Presiona ENTER para enviar
      </p>
    </div>
  );
}