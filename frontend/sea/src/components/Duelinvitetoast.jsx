// components/DuelInviteToast.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Swords, X, Loader2, BookOpen, Layers } from "lucide-react";
import useAuthStore from "../store/authStore";
import { getSocket } from "../api/socket";
import { getDuelSocket, disconnectDuelSocket } from "../api/duelSocket";

const TOAST_CSS = `
  .duel-toast-container {
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(16px);
    border: 2px solid rgba(99, 102, 241, 0.5);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15);
  }
  .btn-accept {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
  }
  .btn-accept:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
    transform: translateY(-1px);
  }
  .animate-slide-up {
    animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
  @keyframes slideUp {
    from { transform: translate(-50%, 110%); opacity: 0; }
    to   { transform: translate(-50%, 0);    opacity: 1; }
  }
  @keyframes timer-shrink {
    from { width: 100%; }
    to   { width: 0%;   }
  }
  .timer-bar {
    animation: timer-shrink 15s linear forwards;
  }
`;

export default function DuelInviteToast() {
  const { token } = useAuthStore();
  const navigate   = useNavigate();
  const socketRef  = useRef(null);
  const timerRef   = useRef(null);

  const [invite,    setInvite]    = useState(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) return;
    const socket = getDuelSocket(token);
    socketRef.current = socket;

    socket.on("duel:invited", (data) => {
      console.log("[Toast] duel:invited recibido:", data);
      setInvite(data);
      setAccepting(false);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        socketRef.current?.emit("duel:reject", { inviteId: data.inviteId });
        setInvite(null);
      }, 15000);
    });

    socket.on("duel:start", ({ duelId }) => {
      console.log("[Toast] duel:start recibido, navegando a:", duelId);
      clearTimeout(timerRef.current);
      setInvite(null);
      setAccepting(false);
      navigate(`/duel/${duelId}`);
    });

    // NO desconectar en cleanup — el singleton debe vivir toda la sesión
    return () => {
      socket.off("duel:invited");
      socket.off("duel:start");
      clearTimeout(timerRef.current);
    };
  }, [token, navigate]);

  const handleAccept = () => {
    if (accepting) return;
    setAccepting(true);
    clearTimeout(timerRef.current);
    
    console.log("[Toast] Emitiendo duel:accept, inviteId:", invite.inviteId);
    console.log("[Toast] Socket conectado:", socketRef.current?.connected);
    console.log("[Toast] Socket id:", socketRef.current?.id);
    
    socketRef.current?.emit("duel:accept", { inviteId: invite.inviteId });
  };

  const handleReject = () => {
    clearTimeout(timerRef.current);
    socketRef.current?.emit("duel:reject", { inviteId: invite.inviteId });
    setInvite(null);
  };

  if (!invite) return null;

  // Datos de contexto que llegan en el evento (opcionales, se muestran si existen)
  const subjectName = invite.subjectName || invite.lessonSubject || null;
  const unitName    = invite.unitName    || null;
  const lessonName  = invite.lessonName  || null;

  return (
    <div className="fixed bottom-10 left-1/2 z-[200] w-full max-w-[380px] px-4 animate-slide-up"
         style={{ transform: "translateX(-50%)" }}>
      <style>{TOAST_CSS}</style>

      <div className="duel-toast-container rounded-[2rem] overflow-hidden relative">

        {/* Glow decorativo */}
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 120, height: 120,
          background: "rgba(99,102,241,0.12)",
          borderRadius: "50%", filter: "blur(30px)",
          pointerEvents: "none",
        }} />

        <div style={{ padding: "20px 20px 16px" }}>

          {/* Encabezado */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
            <div style={{
              background: "rgba(99,102,241,0.2)",
              border: "1px solid rgba(99,102,241,0.35)",
              borderRadius: 16, padding: 10, flexShrink: 0,
            }}>
              <Swords size={26} style={{ color: "#818cf8" }} className="animate-pulse" />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{
                color: "#fff", fontWeight: 900, fontStyle: "italic",
                textTransform: "uppercase", letterSpacing: "-0.02em",
                fontSize: 18, lineHeight: 1, margin: 0,
              }}>
                ¡Desafío Entrante!
              </h4>
              <p style={{
                color: "#94a3b8", fontSize: 10, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.1em",
                marginTop: 4, marginBottom: 0,
              }}>
                {invite.requesterName || "Un recluta"} te ha retado
              </p>
            </div>

            <button
              onClick={handleReject}
              style={{
                color: "#475569", background: "none", border: "none",
                cursor: "pointer", padding: 4, flexShrink: 0,
                transition: "color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
              onMouseLeave={e => e.currentTarget.style.color = "#475569"}
            >
              <X size={18} />
            </button>
          </div>

          {/* Tarjeta de contexto: materia / unidad / lección aleatoria */}
          {(subjectName || unitName || lessonName) && (
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, padding: "10px 14px",
              marginBottom: 14, display: "flex", flexDirection: "column", gap: 7,
            }}>
              {subjectName && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <BookOpen size={12} style={{ color: "#6366f1", flexShrink: 0 }} />
                  <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                                 letterSpacing: "0.12em", color: "#64748b", marginRight: 4 }}>
                    Materia
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0",
                                 overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {subjectName}
                  </span>
                </div>
              )}
              {unitName && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Layers size={12} style={{ color: "#6366f1", flexShrink: 0 }} />
                  <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                                 letterSpacing: "0.12em", color: "#64748b", marginRight: 4 }}>
                    Unidad
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0",
                                 overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {unitName}
                  </span>
                </div>
              )}
              {/* Lección siempre como "aleatoria" — no se revela cuál es */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Swords size={12} style={{ color: "#6366f1", flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                               letterSpacing: "0.12em", color: "#64748b", marginRight: 4 }}>
                  Lección
                </span>
                <span style={{ fontSize: 11, fontWeight: 700,
                               color: "#818cf8", fontStyle: "italic" }}>
                  Aleatoria ·&nbsp;sin progreso
                </span>
              </div>
            </div>
          )}

          {/* Botones */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="btn-accept"
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, color: "#fff", fontWeight: 900, fontStyle: "italic",
                textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 10,
                padding: "14px 0", borderRadius: 14, border: "none", cursor: "pointer",
                transition: "all 0.15s", opacity: accepting ? 0.55 : 1,
              }}
            >
              {accepting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <><Swords size={13} /><span>Aceptar</span></>
              )}
            </button>

            <button
              onClick={handleReject}
              style={{
                flex: 1, background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#64748b", fontWeight: 900, fontStyle: "italic",
                textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 10,
                padding: "14px 0", borderRadius: 14, cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#94a3b8"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#64748b"; }}
            >
              Ignorar
            </button>
          </div>
        </div>

        {/* Barra de tiempo — se vacía en 15s y auto-rechaza */}
        <div style={{ height: 3, background: "rgba(99,102,241,0.15)", overflow: "hidden" }}>
          <div
            className="timer-bar"
            style={{ height: "100%", background: "#6366f1", transformOrigin: "left" }}
          />
        </div>
      </div>
    </div>
  );
}