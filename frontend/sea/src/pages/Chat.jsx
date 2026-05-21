// src/pages/Chat.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Send, Image, Users, MessageSquare, Plus,
  X, Check, ChevronDown, Trash2, UserCircle, Search,
  Swords, Loader2, Trophy, Clock, Zap,
} from "lucide-react";
import { io } from "socket.io-client";
import Navbar from "../components/Navbar";
import Avatar from "../components/Avatar";
import useAuthStore from "../store/authStore";
import useChatStore from "../store/chatStore";
import api from "../api/axios";
import toast from "react-hot-toast";
import { getDuelSocket } from "../api/duelSocket";

/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
const CHAT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-chat { font-family: 'Nunito', sans-serif; }

  .chat-body {
  padding: 4px 12px 0;}

  @media (max-width: 1023px) {
  .chat-body {padding: 0px 0px 0px 0px;}
  }

  /* Layout */
  .chat-shell {
    display: flex;
    height: calc(100dvh - 80px);
    max-width: 1180px;
    margin: 0 auto;
    gap: 12px;
  }
  @media (max-width: 1023px) {
    .chat-shell { height: calc(100dvh - 72px); gap: 0; margin: 0;}
    
  }

  /* Sidebar */
  .chat-sidebar {
    width: 320px;
    margin-top: 12px;
    height: 97%;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: var(--card-bg);
    backdrop-filter: blur(20px);
    border: 2px solid var(--glass-border);
    border-radius: 20px;
    overflow: hidden;
  }
  @media (max-width: 1023px) {
    .chat-sidebar {
      margin-top: 0px;
      width: 100%;
      border-radius: 0;
      border: none;
      height: 100%;
    }
    .chat-sidebar.hidden-mobile { display: none; }
  }

  /* Main panel */
  .chat-main {
    margin-top: 12px;
    flex: 1;
    height: 97%;
    display: flex;
    flex-direction: column;
    background: var(--card-bg);
    backdrop-filter: blur(20px);
    border: 2px solid var(--glass-border);
    border-radius: 20px;
    overflow: hidden;
    min-width: 0;
  }
  @media (max-width: 1023px) {
    .chat-main {
      margin-top: 0px;
      border-radius: 0;
      border: none;
      height: 100%;
    }
    .chat-main.hidden-mobile { display: none; }
  }

  /* Conversation items */
  .conv-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 14px;
    cursor: pointer;
    transition: background 0.14s ease;
    position: relative;
  }
  .conv-item:hover { background: var(--progress-track); }
  .conv-item.active {
    background: color-mix(in srgb, var(--text-accent) 12%, transparent);
  }

  /* Messages container */
  .messages-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .messages-scroll::-webkit-scrollbar { width: 4px; }
  .messages-scroll::-webkit-scrollbar-thumb {
    background: var(--text-muted);
    border-radius: 99px;
  }

  /* Bubbles */
  .bubble-mine {
    background: var(--text-accent);
    color: var(--btn-text);
    border-radius: 18px 18px 4px 18px;
    max-width: 72%;
    align-self: flex-end;
  }
  .bubble-other {
    background: var(--card-bg);
    border: 2px solid var(--glass-border);
    color: var(--text-primary);
    border-radius: 18px 18px 18px 4px;
    max-width: 72%;
    align-self: flex-start;
  }
  .bubble-deleted {
    opacity: 0.45;
    font-style: italic;
  }

  /* Input bar */
  .chat-input-bar {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 10px 12px;
    border-top: 2px solid var(--glass-border);
    background: var(--progress-track);
  }
  .chat-textarea {
    flex: 1;
    background: var(--card-bg);
    border: 2px solid var(--glass-border);
    border-radius: 14px;
    padding: 10px 14px;
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    resize: none;
    outline: none;
    max-height: 120px;
    line-height: 1.4;
    transition: border-color 0.15s ease;
  }
  .chat-textarea:focus { border-color: var(--text-accent); }
  .chat-textarea::placeholder { color: var(--text-muted); }

  .chat-send-btn {
    width: 42px; height: 42px;
    border-radius: 13px;
    background: var(--text-accent);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.15s ease, transform 0.15s ease;
  }
  .chat-send-btn:hover:not(:disabled) { opacity: 0.85; transform: scale(1.05); }
  .chat-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .chat-icon-btn {
    width: 42px; height: 42px;
    border-radius: 13px;
    background: var(--card-bg);
    border: 2px solid var(--glass-border);
    cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s ease;
  }
  .chat-icon-btn:hover {
    border-color: var(--text-accent);
    color: var(--text-accent);
  }

  /* Typing indicator */
  .typing-dots span {
    display: inline-block;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--text-muted);
    margin: 0 2px;
    animation: typing-bounce 1.2s infinite;
  }
  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes typing-bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
  }

  /* Modal */
  .chat-modal-overlay {
    position: fixed; inset: 0;
    background: var(--bg-gradient);
    z-index: 500;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    backdrop-filter: blur(8px);
    animation: cf-fade 0.15s ease both;
  }
  @keyframes cf-fade { from { opacity: 0 } to { opacity: 1 } }
  .chat-modal {
    width: 100%; max-width: 440px;
    background: var(--card-bg);
    border: 2px solid var(--card-border);
    border-radius: 24px;
    padding: 24px;
    animation: cf-pop 0.2s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes cf-pop {
    from { opacity: 0; transform: scale(0.94) translateY(12px); }
    to   { opacity: 1; transform: none; }
  }

  /* Badge */
  .unread-badge {
    position: absolute; top: 8px; right: 8px;
    background: #ef4444;
    color: #fff;
    border-radius: 99px;
    font-size: 9px; font-weight: 900;
    min-width: 18px; height: 18px;
    display: flex; align-items: center; justify-content: center;
    padding: 0 5px;
    line-height: 1;
  }

  /* Load more button */
  .load-more-btn {
    align-self: center;
    padding: 5px 16px;
    border-radius: 99px;
    background: var(--progress-track);
    border: 2px solid var(--glass-border);
    font-size: 9px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.12em;
    color: var(--text-secondary);
    cursor: pointer; transition: all 0.15s ease;
  }
  .load-more-btn:hover { border-color: var(--text-accent); color: var(--text-accent); }

  /* Date separator */
  .date-sep {
    display: flex; align-items: center; gap: 8px;
    margin: 12px 0 6px;
  }
  .date-sep::before, .date-sep::after {
    content: ''; flex: 1;
    height: 1px; background: var(--glass-border);
  }

  /* Search input */
  .conv-search {
    background: var(--card-bg);
    border: 2px solid var(--glass-border);
    border-radius: 12px;
    padding: 8px 12px 8px 36px;
    font-family: 'Nunito', sans-serif;
    font-size: 11px; font-weight: 700;
    color: var(--text-primary);
    outline: none; width: 100%;
    transition: border-color 0.15s ease;
  }
  .conv-search:focus { border-color: var(--text-accent); }
  .conv-search::placeholder { color: var(--text-muted); }
`;

/* ─────────────────────────────────────────────
   Utils
───────────────────────────────────────────── */
function formatTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function formatDateSep(date) {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  return d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
}

function isSameDay(a, b) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

function getConvName(conv, myId) {
  if (conv.type === "group") return conv.name;
  const other = conv.participants?.find((p) => p._id !== myId);
  return other?.displayName || other?.username || "Usuario";
}

function getConvAvatar(conv, myId) {
  if (conv.type === "group") return conv.avatar || null;
  const other = conv.participants?.find((p) => p._id !== myId);
  return other?.avatar || null;
}

function DuelInviteModal({ conversation, myId, onClose, onInviteSent }) {
  const [step, setStep] = useState("selectPlayer"); // "selectPlayer" | "selectSubject" | "selectUnit" | "sending"
  const [targetUser, setTargetUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [sending, setSending] = useState(false);
  const { token } = useAuthStore();

  const participants = conversation.participants?.filter(p => p._id !== myId) || [];
  const isGroup = conversation.type === "group";

  // Paso 1 → 2: elegir jugador y cargar materias
  const handleSelectPlayer = async (user) => {
    setTargetUser(user);
    setLoadingSubjects(true);
    setStep("selectSubject");
    try {
      const { data } = await api.get("/subjects");
      setSubjects(data.data || []);
    } catch {
      toast.error("Error al cargar materias");
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Paso 2 → 3: elegir materia y cargar unidades
  const handleSelectSubject = async (subject) => {
    setSelectedSubject(subject);
    setLoadingSubjects(true);
    setStep("selectUnit");
    try {
      const { data } = await api.get(`/subjects/${subject.slug}`);
      const availableUnits = (data.data.units || []).filter(u =>
        u.lessons?.some(l => l.status !== "locked")
      );
      setUnits(availableUnits);
    } catch {
      toast.error("Error al cargar unidades");
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Paso 3: confirmar unidad → escoger lección aleatoria → enviar
  const handleSelectUnit = async (unit) => {
    setSelectedUnit(unit);
    setSending(true);
    setStep("sending");

    const availableLessons = unit.lessons?.filter(l => l.status !== "locked") || [];
    if (availableLessons.length === 0) {
      toast.error("Esta unidad no tiene lecciones disponibles");
      setStep("selectUnit");
      setSending(false);
      return;
    }

    const randomLesson = availableLessons[Math.floor(Math.random() * availableLessons.length)];
    const socket = getDuelSocket(token);

    const cleanup = () => {
      socket.off("duel:invite_sent", onSent);
      socket.off("duel:error", onError);
      clearTimeout(timeoutId);
    };

    const onSent = ({ inviteId }) => {
      console.log("[DuelInvite] invite_sent:", inviteId);
      cleanup();
      toast.success(`¡Desafío enviado a ${targetUser.displayName || targetUser.username}!`, { icon: "⚔️" });
      onInviteSent();
    };

    const onError = ({ message }) => {
      console.error("[DuelInvite] error:", message);
      cleanup();
      toast.error(message);
      setSending(false);
      setStep("selectUnit");
    };

    const timeoutId = setTimeout(() => {
      console.warn("[DuelInvite] Timeout — sin respuesta del servidor");
      cleanup();
      toast.error("Sin respuesta del servidor. Intenta de nuevo.");
      setSending(false);
      setStep("selectUnit");
    }, 8000);

    const emit = () => {
      console.log("[DuelInvite] Emitiendo duel:invite", {
        friendId: targetUser._id,
        lessonId: randomLesson._id,
        conversationId: conversation._id,
      });
      socket.on("duel:invite_sent", onSent);
      socket.on("duel:error", onError);
      socket.emit("duel:invite", {
        friendId: targetUser._id,
        lessonId: randomLesson._id,
        conversationId: conversation._id,
      });
    };

    if (socket.connected) {
      emit();
    } else {
      socket.once("connect", emit);
      socket.once("connect_error", (err) => {
        console.error("[DuelInvite] connect_error:", err.message);
        cleanup();
        toast.error("Error de conexión");
        setSending(false);
        setStep("selectUnit");
      });
    }
  };

  const handleBack = () => {
    if (step === "selectSubject") setStep("selectPlayer");
    else if (step === "selectUnit") { setStep("selectSubject"); setSelectedSubject(null); }
  };

  const stepLabel = {
    selectPlayer: "Elegir rival",
    selectSubject: "Elegir materia",
    selectUnit: `${selectedSubject?.name || "Unidad"}`,
    sending: "Enviando desafío...",
  };

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>

        {/* Header con breadcrumb */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {(step === "selectSubject" || step === "selectUnit") && (
              <button
                onClick={handleBack}
                className="chat-icon-btn"
                style={{ width: 28, height: 28, borderRadius: 8, marginRight: 4 }}
              >
                <ArrowLeft size={13} />
              </button>
            )}
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                          letterSpacing: "0.14em", color: "var(--text-muted)", marginBottom: 1 }}>
                {step === "sending" ? "Procesando" : `Paso ${
                  step === "selectPlayer" ? "1/3" :
                  step === "selectSubject" ? "2/3" : "3/3"
                }`}
              </p>
              <p style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase",
                          letterSpacing: "0.1em", color: "var(--text-primary)" }}>
                {stepLabel[step]}
              </p>
            </div>
          </div>
          <button className="chat-icon-btn" onClick={onClose} style={{ width: 28, height: 28 }}>
            <X size={14} />
          </button>
        </div>

        {/* Barra de progreso de pasos */}
        {step !== "sending" && (
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
            {["selectPlayer", "selectSubject", "selectUnit"].map((s, i) => (
              <div key={s} style={{
                flex: 1, height: 3, borderRadius: 99,
                background: ["selectPlayer", "selectSubject", "selectUnit"].indexOf(step) >= i
                  ? "var(--text-accent)" : "var(--glass-border)",
                transition: "background 0.3s ease",
              }} />
            ))}
          </div>
        )}

        {/* Step 1: Elegir jugador */}
        {step === "selectPlayer" && (
          <div>
            {isGroup ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {participants.length === 0 && (
                  <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 11 }}>
                    No hay otros miembros
                  </p>
                )}
                {participants.map(p => (
                  <button key={p._id} onClick={() => handleSelectPlayer(p)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                      background: "var(--progress-track)", border: "2px solid var(--glass-border)",
                      transition: "all 0.15s",
                    }}>
                    <Avatar src={p.avatar} name={p.displayName || p.username} size="sm" />
                    <span style={{ fontWeight: 800, fontSize: 12, color: "var(--text-primary)" }}>
                      {p.displayName || p.username}
                    </span>
                  </button>
                ))}
              </div>
            ) : (() => {
              const opponent = participants[0];
              return (
                <div>
                  <p style={{ textAlign: "center", fontSize: 10, color: "var(--text-muted)",
                               fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>
                    Retarás a:
                  </p>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 12, padding: 16, borderRadius: 14, marginBottom: 16,
                    background: "color-mix(in srgb, var(--text-accent) 8%, transparent)",
                    border: "2px solid color-mix(in srgb, var(--text-accent) 25%, transparent)",
                  }}>
                    <Avatar src={opponent?.avatar} name={opponent?.displayName || opponent?.username} size="md" />
                    <span style={{ fontWeight: 900, fontSize: 14, color: "var(--text-primary)" }}>
                      {opponent?.displayName || opponent?.username}
                    </span>
                  </div>
                  <button onClick={() => handleSelectPlayer(opponent)}
                    style={{
                      width: "100%", padding: "12px", borderRadius: 12, cursor: "pointer",
                      background: "var(--text-accent)", border: "none",
                      color: "var(--btn-text)", fontFamily: "Nunito, sans-serif",
                      fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em",
                    }}>
                    Continuar
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Step 2: Elegir materia */}
        {step === "selectSubject" && (
          <div>
            {loadingSubjects ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                <Loader2 size={28} className="animate-spin" style={{ color: "var(--text-accent)" }} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                {subjects.length === 0 && (
                  <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 11 }}>
                    Sin materias disponibles
                  </p>
                )}
                {subjects.map(s => (
                  <button key={s._id} onClick={() => handleSelectSubject(s)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "12px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                      background: "var(--progress-track)", border: "2px solid var(--glass-border)",
                      transition: "all 0.15s",
                    }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: "color-mix(in srgb, var(--text-accent) 15%, transparent)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18,
                    }}>
                      {s.icon || "📚"}
                    </div>
                    <div>
                      <p style={{ fontWeight: 900, fontSize: 12, color: "var(--text-primary)", margin: 0 }}>
                        {s.name}
                      </p>
                      {s.description && (
                        <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, margin: 0, marginTop: 1 }}>
                          {s.description.slice(0, 45)}{s.description.length > 45 ? "…" : ""}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Elegir unidad */}
        {step === "selectUnit" && (
          <div>
            {loadingSubjects ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                <Loader2 size={28} className="animate-spin" style={{ color: "var(--text-accent)" }} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                {units.length === 0 && (
                  <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 11, padding: "20px 0" }}>
                    No hay unidades desbloqueadas en esta materia
                  </p>
                )}
                {units.map((u, i) => {
                  const lessonCount = u.lessons?.filter(l => l.status !== "locked").length || 0;
                  return (
                    <button key={u._id} onClick={() => handleSelectUnit(u)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "12px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                        background: "var(--progress-track)", border: "2px solid var(--glass-border)",
                        transition: "all 0.15s",
                      }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: "color-mix(in srgb, var(--text-accent) 15%, transparent)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 900, fontSize: 11, color: "var(--text-accent)",
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 900, fontSize: 12, color: "var(--text-primary)", margin: 0 }}>
                          {u.name}
                        </p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, margin: 0, marginTop: 1 }}>
                          {lessonCount} lección{lessonCount !== 1 ? "es" : ""} disponible{lessonCount !== 1 ? "s" : ""} · lección aleatoria
                        </p>
                      </div>
                      <Zap size={14} style={{ color: "var(--text-accent)", flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step: Enviando */}
        {step === "sending" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                        padding: "32px 0", gap: 14 }}>
            <Loader2 size={36} className="animate-spin" style={{ color: "var(--text-accent)" }} />
            <p style={{ fontWeight: 900, fontSize: 11, textTransform: "uppercase",
                        letterSpacing: "0.14em", color: "var(--text-muted)" }}>
              Enviando desafío a {targetUser?.displayName || targetUser?.username}…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   GroupModal
───────────────────────────────────────────── */
function GroupModal({ onClose, onCreated, friends }) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const { createGroup } = useChatStore();

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleCreate = async () => {
    if (!name.trim() || selected.length === 0) return;
    setLoading(true);
    try {
      const conv = await createGroup({ name: name.trim(), participantIds: selected });
      toast.success("Grupo creado");
      onCreated(conv);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al crear grupo");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <p style={{ fontWeight: 900, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-primary)" }}>
            Nuevo Grupo
          </p>
          <button className="chat-icon-btn" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10 }}>
            <X size={14} />
          </button>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del grupo…"
          maxLength={50}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 12,
            background: "var(--progress-track)", border: "2px solid var(--glass-border)",
            fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: 13,
            color: "var(--text-primary)", outline: "none", marginBottom: 14,
          }}
        />

        <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-secondary)", marginBottom: 8 }}>
          Agregar amigos ({selected.length})
        </p>

        <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {friends.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 11, padding: "12px 0" }}>
              No tienes amigos agregados aún
            </p>
          )}
          {friends.map((f) => {
            const isSelected = selected.includes(f._id);
            return (
              <button
                key={f._id}
                onClick={() => toggle(f._id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: 12, cursor: "pointer",
                  background: isSelected
                    ? "color-mix(in srgb, var(--text-accent) 12%, transparent)"
                    : "var(--progress-track)",
                  border: `2px solid ${isSelected ? "var(--text-accent)" : "var(--glass-border)"}`,
                  transition: "all 0.15s ease",
                }}
              >
                <Avatar src={f.avatar} name={f.displayName || f.username} size="xs" />
                <span style={{ flex: 1, fontWeight: 800, fontSize: 12, color: "var(--text-primary)", textAlign: "left" }}>
                  {f.displayName || f.username}
                </span>
                {isSelected && <Check size={14} style={{ color: "var(--text-accent)", flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleCreate}
          disabled={!name.trim() || selected.length === 0 || loading}
          style={{
            marginTop: 16, width: "100%", padding: "11px",
            borderRadius: 14, background: "var(--text-accent)",
            border: "none", color: "var(--btn-text)",
            fontFamily: "Nunito, sans-serif", fontWeight: 900,
            fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em",
            cursor: "pointer", opacity: (!name.trim() || selected.length === 0 || loading) ? 0.4 : 1,
            transition: "opacity 0.15s ease",
          }}
        >
          {loading ? "Creando…" : "Crear Grupo"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TypingIndicator
───────────────────────────────────────────── */
function TypingIndicator({ names }) {
  if (!names?.length) return null;
  const label =
    names.length === 1
      ? `${names[0]} está escribiendo`
      : `${names.slice(0, 2).join(", ")} están escribiendo`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
      <div className="bubble-other" style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
        <div className="typing-dots">
          <span /><span /><span />
        </div>
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {label}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MessageBubble
───────────────────────────────────────────── */
function MessageBubble({ msg, isMe, showAvatar, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const deleted = !!msg.deletedAt;
  const isDuelResult = msg.type === "duel_result";

  if (isDuelResult) {
    // resultSummary está anidado dentro de duelData
    const result = msg.duelData?.resultSummary ?? msg.duelData ?? {};
    const { winnerName, loserName, winnerCorrect, loserCorrect, totalQuestions, duration } = result;

    return (
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, padding: "0 4px" }}>
        <div style={{
          width: "100%", maxWidth: 360,
          background: "color-mix(in srgb, var(--text-accent) 10%, var(--card-bg))",
          border: "2px solid color-mix(in srgb, var(--text-accent) 35%, transparent)",
          borderRadius: 18, padding: "12px 16px",
        }}>
          {/* Título */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Trophy size={16} style={{ color: "#facc15", flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase",
                           letterSpacing: "0.15em", color: "var(--text-primary)" }}>
              Duelo finalizado
            </span>
            <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700,
                           color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
              <Clock size={9} />
              {duration != null ? `${duration}s` : "—"}
            </span>
          </div>

          {/* Ganador vs Perdedor */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Ganador */}
            <div style={{ flex: 1, textAlign: "center",
                          background: "color-mix(in srgb, #10b981 15%, transparent)",
                          border: "1.5px solid color-mix(in srgb, #10b981 40%, transparent)",
                          borderRadius: 12, padding: "8px 6px" }}>
              <p style={{ fontSize: 9, fontWeight: 800, color: "#10b981",
                           textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
                🏆 Ganador
              </p>
              <p style={{ fontSize: 12, fontWeight: 900, color: "var(--text-primary)",
                           wordBreak: "break-word", margin: 0 }}>
                {winnerName ?? "—"}
              </p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#10b981", marginTop: 2 }}>
                {winnerCorrect ?? "?"}/{totalQuestions ?? "?"} ✓
              </p>
            </div>

            {/* VS */}
            <div style={{ fontSize: 9, fontWeight: 900, color: "var(--text-muted)",
                           textTransform: "uppercase", flexShrink: 0 }}>vs</div>

            {/* Perdedor */}
            <div style={{ flex: 1, textAlign: "center",
                          background: "color-mix(in srgb, #ef4444 12%, transparent)",
                          border: "1.5px solid color-mix(in srgb, #ef4444 30%, transparent)",
                          borderRadius: 12, padding: "8px 6px" }}>
              <p style={{ fontSize: 9, fontWeight: 800, color: "#ef4444",
                           textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
                Perdedor
              </p>
              <p style={{ fontSize: 12, fontWeight: 900, color: "var(--text-primary)",
                           wordBreak: "break-word", margin: 0 }}>
                {loserName ?? "—"}
              </p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginTop: 2 }}>
                {loserCorrect ?? "?"}/{totalQuestions ?? "?"} ✓
              </p>
            </div>
          </div>

          {/* Timestamp */}
          <p style={{ fontSize: 9, fontWeight: 700, marginTop: 8, textAlign: "center",
                       color: "var(--text-muted)" }}>
            {formatTime(msg.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMe ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 6,
        marginBottom: 2,
      }}
    >
      {/* Avatar (solo para mensajes del otro en grupos) */}
      {!isMe && showAvatar && (
        <div style={{ flexShrink: 0, marginBottom: 2 }}>
          <Avatar
            src={msg.sender?.avatar}
            name={msg.sender?.displayName || msg.sender?.username}
            size="xs"
          />
        </div>
      )}
      {!isMe && !showAvatar && <div style={{ width: 28, flexShrink: 0 }} />}

      {/* Burbuja */}
      <div
        className={`${isMe ? "bubble-mine" : "bubble-other"}${deleted ? " bubble-deleted" : ""}`}
        style={{ padding: deleted ? "8px 14px" : msg.type === "image" ? "6px" : "9px 14px", position: "relative" }}
        onMouseEnter={() => isMe && !deleted && setMenuOpen(true)}
        onMouseLeave={() => setMenuOpen(false)}
      >
        {/* Nombre en grupos */}
        {!isMe && showAvatar && (
          <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-accent)", marginBottom: 3 }}>
            {msg.sender?.displayName || msg.sender?.username}
          </p>
        )}

        {deleted ? (
          <span style={{ fontSize: 12 }}>Mensaje eliminado</span>
        ) : msg.type === "image" ? (
          <img
            src={msg.content}
            alt="imagen"
            style={{ maxWidth: 260, maxHeight: 300, borderRadius: 12, display: "block", cursor: "pointer" }}
            onClick={() => window.open(msg.content, "_blank")}
          />
        ) : (
          <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45, wordBreak: "break-word", margin: 0 }}>
            {msg.content}
          </p>
        )}

        {/* Hora */}
        {!deleted && (
          <p style={{
            fontSize: 9, fontWeight: 700, marginTop: 3, lineHeight: 1,
            textAlign: isMe ? "right" : "left",
            color: isMe ? "color-mix(in srgb, var(--btn-text) 60%, transparent)" : "var(--text-muted)",
          }}>
            {formatTime(msg.createdAt)}
          </p>
        )}

        {/* Menú borrar (solo propios) */}
        {isMe && menuOpen && !deleted && (
          <button
            onClick={() => { onDelete(msg._id); setMenuOpen(false); }}
            style={{
              position: "absolute", top: -10, left: -35,
              background: "var(--card-bg)", border: "2px solid var(--glass-border)",
              borderRadius: 10, padding: "4px 6px", cursor: "pointer",
              display: "flex", alignItems: "center",
            }}
          >
            <Trash2 size={12} style={{ color: "#ef4444" }} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ConversationList
───────────────────────────────────────────── */
function ConversationList({ myId, onSelect, activeId, onNewGroup, friends }) {
  const { conversations, unread } = useChatStore();
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    const name = getConvName(c, myId).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "14px 14px 10px", borderBottom: "2px solid var(--glass-border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <p style={{ fontWeight: 900, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-primary)" }}>
            Mensajes
          </p>
          <button className="chat-icon-btn" onClick={onNewGroup} title="Nuevo grupo" style={{ width: 34, height: 34, borderRadius: 10 }}>
            <Plus size={16} style={{ color: "var(--text-accent)" }} />
          </button>
        </div>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="conv-search"
            placeholder="Buscar conversación…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
        {filtered.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 40, opacity: 0.35 }}>
            <MessageSquare size={36} style={{ color: "var(--text-accent)", marginBottom: 10 }} />
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-primary)", textAlign: "center" }}>
              {search ? "Sin resultados" : "Sin conversaciones aún"}
            </p>
          </div>
        )}
        {filtered.map((conv) => {
          const name = getConvName(conv, myId);
          const avatarSrc = getConvAvatar(conv, myId);
          const badge = unread[conv._id] || 0;
          const lastMsg = conv.lastMessage;
          const preview = lastMsg
            ? lastMsg.type === "image"
              ? "📷 Imagen"
              : lastMsg.content?.slice(0, 40) || ""
            : "";

          return (
            <div
              key={conv._id}
              className={`conv-item${activeId === conv._id ? " active" : ""}`}
              onClick={() => onSelect(conv)}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Avatar src={avatarSrc} name={name} size="sm" />
                {conv.type === "group" && (
                  <div style={{
                    position: "absolute", bottom: -2, right: -2,
                    background: "var(--text-accent)", borderRadius: 6,
                    width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid var(--card-bg)",
                  }}>
                    <Users size={7} style={{ color: "var(--btn-text)" }} />
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 900, fontSize: 12, textTransform: "uppercase", color: "var(--text-primary)", truncate: true, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {name}
                </p>
                {preview && (
                  <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                    {preview}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                {lastMsg?.createdAt && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)" }}>
                    {formatTime(lastMsg.createdAt)}
                  </span>
                )}
                {badge > 0 && (
                  <span style={{
                    background: "#ef4444", color: "#fff",
                    borderRadius: 99, fontSize: 9, fontWeight: 900,
                    minWidth: 18, height: 18, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    padding: "0 5px",
                  }}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ChatWindow
───────────────────────────────────────────── */
function ChatWindow({ conv, myId, onBack }) {
  const {
    messages, hasMore, typing,
    openConversation, loadMoreMessages,
    sendMessage, sendImage, emitTyping, deleteMessage, refreshMessages,
  } = useChatStore();
  const [showDuelModal, setShowDuelModal] = useState(false);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const msgs = messages[conv._id] || [];
  const typingUsers = (typing[conv._id] || [])
    .filter((id) => id !== myId)
    .map((id) => {
      const p = conv.participants?.find((p) => p._id === id);
      return p?.displayName || p?.username || "Alguien";
    });

  // Cargar mensajes al abrir
  useEffect(() => {
    openConversation(conv._id);
  }, [conv._id]);

  // Scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

    useEffect(() => {
      const interval = setInterval(() => {
        refreshMessages(conv._id);
      }, 5000);
      return () => clearInterval(interval);
    }, [conv._id]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(conv._id, text);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    emitTyping(conv._id);
  };

  const handleImagePick = () => fileRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await sendImage(conv._id, file);
    } catch {
      toast.error("Error al enviar imagen");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (msgId) => {
    try {
      await deleteMessage(msgId, conv._id);
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const name = getConvName(conv, myId);
  const avatarSrc = getConvAvatar(conv, myId);
  const isGroup = conv.type === "group";

  // Agrupar por día para separadores
  let lastDate = null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header con botón de reto */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "2px solid var(--glass-border)", background: "var(--progress-track)", flexShrink: 0 }}>
        <button onClick={onBack} className="chat-icon-btn lg:hidden" style={{ width: 36, height: 36, borderRadius: 10 }}>
          <ArrowLeft size={16} />
        </button>
        <Avatar src={avatarSrc} name={name} size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 900, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {name}
          </p>
          {isGroup && <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)" }}>{conv.participants?.length} participantes</p>}
        </div>
        {/* Botón de reto */}
        <button
          className="chat-icon-btn"
          onClick={() => setShowDuelModal(true)}
          title="Retar a duelo"
          style={{ width: 36, height: 36, borderRadius: 10 }}
        >
          <Swords size={16} style={{ color: "var(--text-accent)" }} />
        </button>
      </div>

      {/* Modal de invitación a duelo */}
      {showDuelModal && (
        <DuelInviteModal
          conversation={conv}
          myId={myId}
          onClose={() => setShowDuelModal(false)}
          onInviteSent={() => setShowDuelModal(false)}
        />
      )}

      {/* Messages */}
      <div className="messages-scroll">
        {/* Load more */}
        {hasMore[conv._id] && (
          <button className="load-more-btn" onClick={() => loadMoreMessages(conv._id)}>
            Cargar anteriores
          </button>
        )}

        {msgs.map((msg, i) => {
          const isMe = msg.sender?._id === myId || msg.sender === myId;
          const prevMsg = msgs[i - 1];
          const showAvatar = isGroup && !isMe && (
            !prevMsg || prevMsg.sender?._id !== msg.sender?._id
          );

          // Separador de fecha
          let dateSep = null;
          const msgDate = msg.createdAt;
          if (!lastDate || !isSameDay(lastDate, msgDate)) {
            lastDate = msgDate;
            dateSep = (
              <div key={`sep-${msg._id}`} className="date-sep">
                <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {formatDateSep(msgDate)}
                </span>
              </div>
            );
          }

          return [
            dateSep,
            <MessageBubble
              key={msg._id}
              msg={msg}
              isMe={isMe}
              showAvatar={showAvatar}
              onDelete={handleDelete}
            />,
          ];
        })}

        <TypingIndicator names={typingUsers} />
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-bar">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          className="chat-icon-btn"
          onClick={handleImagePick}
          disabled={uploading}
          title="Enviar imagen"
        >
          {uploading
            ? <div style={{ width: 16, height: 16, border: "2px solid var(--text-accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            : <Image size={16} style={{ color: "var(--text-muted)" }} />
          }
        </button>

        <textarea
          className="chat-textarea"
          rows={1}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje…"
          style={{ height: "auto" }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
        />

        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!text.trim()}
          title="Enviar"
        >
          <Send size={16} style={{ color: "var(--btn-text)" }} />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Empty state
───────────────────────────────────────────── */
function NoConvSelected() {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "100%", opacity: 0.3,
    }}>
      <MessageSquare size={52} style={{ color: "var(--text-accent)", marginBottom: 14 }} />
      <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-primary)", textAlign: "center" }}>
        Selecciona una conversación
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function Chat() {
  const { user, token } = useAuthStore();
  const {
    connect, disconnect, loadConversations,
    conversations, activeConvId, getActiveConversation,
    openConversation, closeConversation,
  } = useChatStore();

  const [searchParams] = useSearchParams();
  const [groupModal, setGroupModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [mobileView, setMobileView] = useState("list"); // "list" | "chat"
  const [newConvModal, setNewConvModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Conectar socket
  useEffect(() => {
    if (token) connect(token);
    return () => disconnect();
  }, [token]);

  // Cargar conversaciones
  useEffect(() => {
    loadConversations();
  }, []);

  // Cargar amigos (para crear grupos)
  useEffect(() => {
    api.get("/friends").then(({ data }) => setFriends(data.data || [])).catch(() => {});
  }, []);

  // Abrir directo desde query param ?userId=xxx (desde perfil de otro usuario)
  useEffect(() => {
    const targetId = searchParams.get("userId");
    if (!targetId || !token) return;
    useChatStore.getState().openDirect(targetId).then((conv) => {
      openConversation(conv._id);
      setMobileView("chat");
    }).catch(() => {});
  }, [searchParams, token]);

  const activeConv = getActiveConversation();

  const handleSelectConv = (conv) => {
    openConversation(conv._id);
    setMobileView("chat");
  };

  const handleBack = () => {
    closeConversation();
    setMobileView("list");
  };

  const handleGroupCreated = (conv) => {
    setGroupModal(false);
    openConversation(conv._id);
    setMobileView("chat");
  };

  return (
    <div className="sea-chat" style={{ background: "var(--bg-gradient)" }}>
      <style>{CHAT_CSS}</style>
      <Navbar />

      <div className="chat-body">
        <div className="chat-shell">

          {/* Sidebar */}
          <div className={`chat-sidebar${mobileView === "chat" ? " hidden-mobile" : ""}`}>
            <ConversationList
              myId={user?._id}
              onSelect={handleSelectConv}
              activeId={activeConvId}
              onNewGroup={() => setNewConvModal("picker")}
              friends={friends}
            />
          </div>

          {/* Main */}
          <div className={`chat-main${mobileView === "list" ? " hidden-mobile" : ""}`}>
            {activeConv
              ? <ChatWindow conv={activeConv} myId={user?._id} onBack={handleBack} />
              : <NoConvSelected />
            }
          </div>

        </div>
      </div>

      {newConvModal === "picker" && (
        <NewConvPicker
            onDM={() => setNewConvModal("dm")}
            onGroup={() => { setNewConvModal(false); setGroupModal(true); }}
            onClose={() => setNewConvModal(false)}
        />
        )}
        {newConvModal === "dm" && (
        <DMModal
            friends={friends}
            onClose={() => setNewConvModal(false)}
            onSelect={async (friendId) => {
            const conv = await useChatStore.getState().openDirect(friendId);
            openConversation(conv._id);
            setMobileView("chat");
            setNewConvModal(false);
            }}
        />
        )}

      {groupModal && (
        <GroupModal
          friends={friends}
          onClose={() => setGroupModal(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}

function NewConvPicker({ onDM, onGroup, onClose }) {
  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={e => e.stopPropagation()}
           style={{ maxWidth: 320 }}>
        <p style={{ fontWeight: 900, fontSize: 13, textTransform: "uppercase",
                    letterSpacing: "0.12em", color: "var(--text-primary)", marginBottom: 16 }}>
          Nueva conversación
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={onDM} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px", borderRadius: 14, cursor: "pointer",
            background: "var(--progress-track)", border: "2px solid var(--glass-border)",
            transition: "all 0.15s",
          }}>
            <UserCircle size={20} style={{ color: "var(--text-accent)", flexShrink: 0 }} />
            <div style={{ textAlign: "left" }}>
              <p style={{ fontWeight: 900, fontSize: 12, color: "var(--text-primary)" }}>
                Mensaje directo
              </p>
              <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>
                Chatea con un amigo
              </p>
            </div>
          </button>
          <button onClick={onGroup} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px", borderRadius: 14, cursor: "pointer",
            background: "var(--progress-track)", border: "2px solid var(--glass-border)",
            transition: "all 0.15s",
          }}>
            <Users size={20} style={{ color: "var(--text-accent)", flexShrink: 0 }} />
            <div style={{ textAlign: "left" }}>
              <p style={{ fontWeight: 900, fontSize: 12, color: "var(--text-primary)" }}>
                Crear grupo
              </p>
              <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>
                Agrega varios amigos
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function DMModal({ friends, onClose, onSelect }) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(null);
  const filtered = friends.filter(f =>
    (f.displayName || f.username).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ fontWeight: 900, fontSize: 13, textTransform: "uppercase",
                      letterSpacing: "0.12em", color: "var(--text-primary)" }}>
            Mensaje directo
          </p>
          <button className="chat-icon-btn" onClick={onClose}
                  style={{ width: 32, height: 32, borderRadius: 10 }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ position: "relative", marginBottom: 12 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%",
                                     transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="conv-search" placeholder="Buscar amigo…"
                 value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 11, padding: "20px 0" }}>
              {friends.length === 0 ? "No tienes amigos agregados aún" : "Sin resultados"}
            </p>
          )}
          {filtered.map(f => (
            <button key={f._id}
              disabled={loading === f._id}
              onClick={async () => { setLoading(f._id); await onSelect(f._id); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 12, cursor: "pointer",
                background: "var(--progress-track)", border: "2px solid var(--glass-border)",
                opacity: loading === f._id ? 0.5 : 1, transition: "all 0.15s",
              }}>
              <Avatar src={f.avatar} name={f.displayName || f.username} size="xs" />
              <span style={{ flex: 1, fontWeight: 800, fontSize: 12,
                             color: "var(--text-primary)", textAlign: "left" }}>
                {f.displayName || f.username}
              </span>
              {loading === f._id && (
                <div style={{ width: 14, height: 14, border: "2px solid var(--text-accent)",
                              borderTopColor: "transparent", borderRadius: "50%",
                              animation: "spin 0.8s linear infinite" }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}