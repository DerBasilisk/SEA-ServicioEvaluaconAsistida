import { useState } from "react";
import useAuthStore from "../../store/authStore";
import api from "../../api/axios";
import { Heart, Zap, AlertCircle, Loader2 } from "lucide-react";

const REFILL_CSS = `
  .refill-active {
    background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
  }
  .refill-active:hover {
    box-shadow: 0 0 30px rgba(6, 182, 212, 0.5);
    transform: translateY(-2px);
  }
  .refill-disabled {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(4px);
  }
`;

export default function RefillHeartsButton({ onRefilled }) {
  const { user, fetchMe } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const COST = 50;
  const currentGems = user?.gems || 0;
  const canAfford = currentGems >= COST;
  const isFull = (user?.hearts?.current ?? 5) >= 5;

  if (isFull) return null;

  const handleRefill = async () => {
    if (!canAfford || loading) return;
    setLoading(true);
    setError(null);
    try {
      await api.post("/progress/refill-hearts");
      await fetchMe();
      onRefilled?.();
    } catch (err) {
      setError(err.response?.data?.message || "Fallo en la sincronización de núcleos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full animate-in fade-in slide-in-from-top-2">
      <style>{REFILL_CSS}</style>
      
      <button
        onClick={handleRefill}
        disabled={!canAfford || loading}
        className={`
          relative w-full overflow-hidden flex items-center justify-between px-6 py-4 rounded-2xl font-black italic transition-all active:scale-95
          ${canAfford ? "refill-active text-white" : "refill-disabled text-slate-500 cursor-not-allowed"}
        `}
      >
        {/* Efecto de brillo interior */}
        {canAfford && !loading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        )}

        <div className="flex items-center gap-3">
          {loading ? (
            <Loader2 size={22} className="animate-spin text-cyan-200" />
          ) : (
            <div className={`p-2 rounded-lg ${canAfford ? "bg-white/20" : "bg-slate-800"}`}>
              <Heart size={20} className={canAfford ? "fill-white text-white animate-pulse" : ""} />
            </div>
          )}
          <span className="uppercase tracking-widest text-sm">
            {loading ? "Sincronizando..." : "Restaurar Núcleos"}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
          <Zap size={14} className={canAfford ? "text-cyan-200 fill-cyan-200" : "text-slate-600"} />
          <span className="text-xs">{COST}</span>
        </div>
      </button>

      {/* Mensajes de Estado */}
      <div className="h-4 flex items-center justify-center">
        {!canAfford && !error && (
          <div className="flex items-center gap-1.5 text-[var(--incorrect)] animate-in fade-in">
            <AlertCircle size={12} />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Gemas insuficientes ({currentGems}/{COST})
            </p>
          </div>
        )}
        {error && (
          <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest animate-shake">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}