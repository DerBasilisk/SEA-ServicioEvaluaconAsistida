import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Fingerprint } from "lucide-react";

const USERNAME_CSS = `
  .input-container {
    background: rgba(15, 37, 71, 0.4);
    border: 2px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .input-container:focus-within {
    border-color: #2B7FE8;
    background: rgba(15, 37, 71, 0.8);
    box-shadow: 0 0 20px rgba(43, 127, 232, 0.15);
  }
  .status-checking { border-color: #6366f1; animation: pulse-border 1.5s infinite; }
  .status-available { border-color: #10B981; }
  .status-taken { border-color: #EF4444; }

  @keyframes pulse-border {
    0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
    100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
  }
`;

export default function UsernameInput({ value, onChange, disabled }) {
  const [status, setStatus] = useState(null); 
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!value || value.length < 3) { setStatus(null); return; }

    if (!/^[a-z0-9_]+$/.test(value)) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/users/check-username/${value}`);
        setStatus(data.available ? "available" : "taken");
      } catch {
        setStatus(null);
      }
    }, 600);

    return () => clearTimeout(debounceRef.current);
  }, [value]);

  const statusConfig = {
    checking:  { icon: <Loader2 size={14} className="animate-spin" />, text: "Sincronizando...", color: "text-indigo-400" },
    available: { icon: <CheckCircle2 size={14} />, text: "Identidad Disponible", color: "text-emerald-400" },
    taken:     { icon: <XCircle size={14} />, text: "Firma en uso", color: "text-rose-400" },
    invalid:   { icon: <AlertCircle size={14} />, text: "Formato no válido (a-z, 0-9, _)", color: "text-amber-400" },
  };

  const s = statusConfig[status];

  return (
    <div className="space-y-2 w-full animate-in fade-in duration-500">
      <style>{USERNAME_CSS}</style>
      
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
          <Fingerprint size={12} /> Identificador Único
        </label>
        <span className={`text-[9px] font-black tracking-widest ${value.length > 15 ? 'text-amber-500' : 'text-slate-600'}`}>
          {value.length}/20
        </span>
      </div>

      <div className={`
        input-container relative flex items-center rounded-2xl overflow-hidden
        ${status === "checking" ? "status-checking" : ""}
        ${status === "available" ? "status-available" : ""}
        ${status === "taken" ? "status-taken" : ""}
      `}>
        <span className="pl-5 pr-2 text-[--text-primary] font-black italic text-lg select-none">@</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
          disabled={disabled}
          maxLength={20}
          placeholder="tu_usuario"
          className="w-full bg-transparent text-white font-black italic text-md py-4 pr-4 outline-none placeholder:text-slate-700 disabled:opacity-30 tracking-tight"
        />
        
        {/* Icono de estado a la derecha para limpieza visual */}
        {status && (
          <div className={`pr-5 ${s.color} transition-all animate-in zoom-in`}>
            {s.icon}
          </div>
        )}
      </div>

      {/* Mensaje de estado inferior */}
      <div className="h-4 px-1">
        {s && (
          <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${s.color} animate-in slide-in-from-left-2`}>
            {s.text}
          </p>
        )}
      </div>
    </div>
  );
}