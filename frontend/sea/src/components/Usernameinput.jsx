import { useState, useEffect, useRef } from "react";
import api from "../api/axios";

export default function UsernameInput({ value, onChange, disabled }) {
  const [status, setStatus] = useState(null); // null | "checking" | "available" | "taken" | "invalid"
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!value || value.length < 3) { setStatus(null); return; }

    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
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
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [value]);

  const statusConfig = {
    checking:  { icon: "⏳", text: "Verificando...",     color: "text-indigo-400" },
    available: { icon: "✅", text: "Disponible",         color: "text-emerald-400" },
    taken:     { icon: "❌", text: "Ya está en uso",     color: "text-red-400"     },
    invalid:   { icon: "⚠️", text: "Solo letras, números y _", color: "text-amber-400" },
  };

  const s = statusConfig[status];

  return (
    <div className="space-y-1">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 font-bold">@</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
          disabled={disabled}
          maxLength={20}
          placeholder="tu_usuario"
          className="w-full bg-indigo-800 border-2 border-indigo-600 focus:border-violet-400 text-white rounded-xl pl-8 pr-4 py-3 outline-none transition placeholder-indigo-500 disabled:opacity-50"
        />
      </div>
      {s && (
        <p className={`text-xs flex items-center gap-1 ${s.color}`}>
          <span>{s.icon}</span> {s.text}
        </p>
      )}
      <p className="text-indigo-600 text-xs">{value.length}/20 caracteres</p>
    </div>
  );
}