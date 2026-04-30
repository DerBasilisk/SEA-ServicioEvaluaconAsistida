import { useState } from "react";
import useAuthStore from "../../store/authStore";
import api from "../../api/axios";
import { Heart, Zap, AlertCircle, Loader2 } from "lucide-react";

export default function RefillHeartsButton({ onRefilled, forceShow = false }) {
  const { user, fetchMe } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const COST = 50;
  const currentGems = user?.gems || 0;
  const currentHearts = user?.hearts?.current ?? 5;

  // ← Cambiamos la lógica aquí
  const isFull = !forceShow && currentHearts >= 5;
  
  const canAfford = currentGems >= COST;

  // Si está lleno Y no nos están forzando a mostrarlo → no renderizar
  if (isFull) {
    return null;
  }

  const handleRefill = async () => {
    if (!canAfford || loading) return;

    setLoading(true);
    setError(null);

    try {
      await api.post("/progress/refill-hearts");
      await fetchMe();
      onRefilled?.();
    } catch (err) {
      setError(err.response?.data?.message || "Error al restaurar los núcleos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <button
        onClick={handleRefill}
        disabled={!canAfford || loading}
        className={`
          relative w-full overflow-hidden flex items-center justify-between px-6 py-4 rounded-2xl 
          font-black italic transition-all active:scale-95
          ${canAfford 
            ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60" 
            : "bg-slate-800/80 border border-slate-700 text-slate-500 cursor-not-allowed"
          }
        `}
      >
        {canAfford && !loading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-shimmer" />
        )}

        <div className="flex items-center gap-3 relative z-10">
          {loading ? (
            <Loader2 size={22} className="animate-spin text-cyan-200" />
          ) : (
            <div className={`p-2.5 rounded-xl ${canAfford ? "bg-white/20" : "bg-slate-700"}`}>
              <Heart 
                size={22} 
                className={canAfford ? "fill-white text-white" : "text-slate-400"} 
              />
            </div>
          )}
          <span className="uppercase tracking-widest text-sm">
            {loading ? "Restaurando núcleos..." : "Restaurar Núcleos"}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-black/30 px-4 py-1.5 rounded-xl border border-white/10 relative z-10">
          <Zap size={16} className={canAfford ? "text-amber-300" : "text-slate-500"} />
          <span className="font-semibold">{COST}</span>
        </div>
      </button>

      <div className="h-5 flex items-center">
        {!canAfford && !error && (
          <div className="flex items-center gap-1.5 text-orange-400 text-xs">
            <AlertCircle size={14} />
            Gemas insuficientes ({currentGems}/{COST})
          </div>
        )}
        {error && <p className="text-rose-500 text-xs">{error}</p>}
      </div>
    </div>
  );
}