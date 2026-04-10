import RefillHeartsButton from "./Refillheartsbutton";
import { AlertTriangle, Ghost, LogOut } from "lucide-react";

const EMERGENCY_CSS = `
  .emergency-panel {
    background: var(--incorrect-bg);
    backdrop-filter: blur(15px);
    border: 2px solid var(--incorrect);
    box-shadow: 0 0 40px rgba(239, 68, 68, 0.2);
  }
  .sea-btn-secondary {
    background: var(--incorrect-bg);
    border: 1px solid var(--incorrect);
  }
  .sea-btn-secondary:hover {
    background: var(--incorrect);
    color: white;
  }
`;

export default function NoHeartsPanel({ onRefilled, onContinue }) {
  return (
    <div className="w-full max-w-md mx-auto emergency-panel rounded-[2.5rem] p-8 text-center animate-in zoom-in-95 duration-300">
      <style>{EMERGENCY_CSS}</style>
      
      {/* Icono de Alerta Animado */}
      <div className="relative inline-block mb-6">
        <div className="absolute inset-0 bg-[var(--incorrect)] rounded-full blur-2xl opacity-20 animate-pulse" />
        <div className="relative text-7xl drop-shadow-lg">
          <Ghost className="text-[var(--incorrect)] w-16 h-16 mx-auto animate-bounce-slow" />
        </div>
      </div>

      {/* Mensaje de Error Crítico */}
      <div className="space-y-2 mb-8">
        <div className="flex items-center justify-center gap-2 text-[var(--incorrect)]">
          <AlertTriangle size={18} />
          <h3 className="font-black italic uppercase tracking-tighter text-2xl">
            Sistemas Críticos
          </h3>
        </div>
        <p className="text-[var(--text-primary)] text-sm font-medium leading-relaxed italic">
          Has agotado todos los núcleos de vida disponibles. El protocolo de aprendizaje se ha detenido.
        </p>
      </div>

      {/* Opciones de Recuperación */}
      <div className="space-y-4">
        <div className="p-1 rounded-2xl bg-white/5">
          <RefillHeartsButton onRefilled={onRefilled} />
        </div>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">O BIEN</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        <button
          onClick={onContinue}
          className="sea-btn-secondary w-full group flex items-center justify-center gap-3 text-[var(--text-primary)] font-black italic uppercase tracking-[0.2em] py-4 rounded-2xl transition-all active:scale-95"
        >
          <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
          <span>Abandonar Misión</span>
        </button>
      </div>

      {/* Nota de pie */}
      <p className="mt-6 text-[9px] font-black text-[var(--text-primary)] uppercase tracking-widest opacity-40">
        ID de Sesión: SEA-ERR-001
      </p>
    </div>
  );
}