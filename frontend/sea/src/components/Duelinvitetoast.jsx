import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Swords, X, ShieldAlert, Loader2 } from "lucide-react";
import useAuthStore from "../store/authStore";

const TOAST_CSS = `
  .duel-toast-container {
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(12px);
    border: 2px solid #6366f1;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.2);
  }
  .btn-accept {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  }
  .animate-slide-up {
    animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
  @keyframes slideUp {
    from { transform: translate(-50%, 100%); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
  }
`;

export default function DuelInviteToast() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [invite, setInvite] = useState(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) return;

    const socket = io(
      import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000",
      { auth: { token }, path: "/socket.io" }
    );
    socketRef.current = socket;

    socket.on("duel:invited", (data) => {
      // Opcional: Sonido de notificación aquí
      setInvite(data);
    });

    socket.on("duel:start", ({ duelId }) => {
      setInvite(null);
      setAccepting(false);
      navigate(`/duel/${duelId}`);
    });

    return () => socket.disconnect();
  }, [token, navigate]);

  const handleAccept = () => {
    if (accepting) return;
    setAccepting(true);
    socketRef.current?.emit("duel:accept", { inviteId: invite.inviteId });
  };

  const handleReject = () => {
    socketRef.current?.emit("duel:reject", { inviteId: invite.inviteId });
    setInvite(null);
  };

  if (!invite) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[360px] px-4 animate-slide-up">
      <style>{TOAST_CSS}</style>
      
      <div className="duel-toast-container rounded-[2rem] p-5 overflow-hidden relative">
        {/* Decoración de fondo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="flex items-center gap-4 mb-5">
          <div className="bg-indigo-500/20 p-3 rounded-2xl border border-indigo-500/30">
            <Swords className="text-indigo-400 animate-pulse" size={28} />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-black italic uppercase tracking-tighter text-lg leading-none">
              ¡Desafío Entrante!
            </h4>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.1em] mt-1">
              {invite.requesterName || "Un recluta"} te ha retado
            </p>
          </div>
          <button onClick={handleReject} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleAccept} 
            disabled={accepting}
            className="btn-accept flex-1 flex items-center justify-center gap-2 text-white font-black italic uppercase tracking-widest text-[10px] py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
          >
            {accepting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Swords size={14} />
                <span>Desplegar</span>
              </>
            )}
          </button>
          
          <button 
            onClick={handleReject}
            className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 font-black italic uppercase tracking-widest text-[10px] py-4 rounded-2xl transition-all border border-white/5"
          >
            Ignorar
          </button>
        </div>

        {/* Barra de progreso de tiempo (opcional para auto-close) */}
        <div className="absolute bottom-0 left-0 h-1 bg-indigo-500/30 w-full overflow-hidden">
           <div className="h-full bg-indigo-500 animate-[progress_15s_linear]" style={{ width: '0%' }} />
        </div>
      </div>
    </div>
  );
}