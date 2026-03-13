import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import useAuthStore from "../store/authStore";

export default function DuelInviteToast() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [invite, setInvite] = useState(null); // { inviteId, requesterId, lessonId }
  const [duelId, setDuelId] = useState(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(
      import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000",
      { auth: { token }, path: "/socket.io" }
    );
    socketRef.current = socket;

    socket.on("duel:invited", (data) => {
      console.log("[Toast] Invitación recibida:", data);
      setInvite(data);
    });

    socket.on("duel:start", ({ duelId }) => {
      console.log("[Toast] Duel start recibido:", data);
      setInvite(null);
      navigate(`/duel/${duelId}`);
    });

    socket.on("duel:invite_sent", () => {});

    return () => socket.disconnect();
  }, [token]);

  const handleAccept = () => {
    socketRef.current?.emit("duel:accept", { inviteId: invite.inviteId });
  };

  const handleReject = () => {
    socketRef.current?.emit("duel:reject", { inviteId: invite.inviteId });
    setInvite(null);
  };

  if (!invite) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="bg-indigo-900 border-2 border-violet-500 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">⚔️</span>
          <div>
            <p className="text-white font-black">¡Desafío recibido!</p>
            <p className="text-indigo-400 text-sm">Un amigo te retó a un duelo</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAccept} className="flex-1 bg-violet-500 hover:bg-violet-400 text-white font-bold py-2 rounded-xl transition active:scale-95">
            ⚔️ Aceptar
          </button>
          <button onClick={handleReject} className="flex-1 bg-indigo-800 hover:bg-indigo-700 text-indigo-300 font-bold py-2 rounded-xl transition">
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}