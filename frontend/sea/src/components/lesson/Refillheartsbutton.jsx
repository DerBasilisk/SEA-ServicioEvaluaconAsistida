import { useState } from "react";
import useAuthStore from "../../store/authStore";
import api from "../../api/axios";

export default function RefillHeartsButton({ onRefilled }) {
  const { user, fetchMe } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const COST = 50;
  const canAfford = (user?.gems || 0) >= COST;
  const isFull = (user?.hearts?.current ?? 5) >= 5;

  if (isFull) return null;

  const handleRefill = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/progress/refill-hearts");
      await fetchMe();
      onRefilled?.();
    } catch (err) {
      setError(err.response?.data?.message || "Error al recargar vidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleRefill}
        disabled={!canAfford || loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition active:scale-95
          ${canAfford
            ? "bg-cyan-500 hover:bg-cyan-400 text-white"
            : "bg-indigo-800 border border-indigo-600 text-indigo-500 cursor-not-allowed"
          }
        `}
      >
        <span>❤️</span>
        <span>{loading ? "Recargando..." : `Recargar vidas — 50 💎`}</span>
      </button>
      {!canAfford && (
        <p className="text-indigo-500 text-xs">Necesitás 50 💎 (tenés {user?.gems || 0})</p>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}