// src/components/ConfirmModal.jsx
import { useEffect } from "react";
import { AlertTriangle, HelpCircle, X } from "lucide-react";

const MODAL_CSS = `
  @keyframes confirmBackdropIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes confirmCardIn {
    from { opacity: 0; transform: scale(0.92) translateY(8px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  .confirm-backdrop {
    animation: confirmBackdropIn 0.2s ease-out;
  }
  .confirm-card {
    animation: confirmCardIn 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .confirm-btn {
    transition: all 0.2s ease;
  }
  .confirm-btn:active {
    transform: scale(0.96);
  }
  .confirm-btn:hover {
    filter: brightness(1.05);
  }
`;

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger = false,
  onConfirm,
  onCancel,
}) {
  // Cerrar con Escape, confirmar con Enter
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Enter") onConfirm?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  const accent = danger ? "var(--incorrect)" : "var(--text-accent)";
  const accentBg = danger ? "var(--incorrect-bg)" : "var(--glass-bg-small)";

  return (
    <div
      className="confirm-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "#0F254799", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <div
        className="confirm-card w-full max-w-sm rounded-2xl sm:rounded-3xl p-5 sm:p-7 relative"
        style={{
          background: "var(--card-bg)",
          border: "1.5px solid var(--card-border)",
          boxShadow: "0 20px 50px var(--glass-shadow)",
          fontFamily: "'Nunito', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <button
          onClick={onCancel}
          className="confirm-btn absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "var(--glass-bg-small)", color: "var(--text-muted)" }}
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>

        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: accentBg, color: accent }}
        >
          {danger ? <AlertTriangle size={24} /> : <HelpCircle size={24} />}
        </div>

        <h2
          id="confirm-modal-title"
          className="text-lg sm:text-xl font-black italic uppercase tracking-tight leading-tight mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          {title || (danger ? "Confirmar acción" : "¿Estás seguro?")}
        </h2>

        <p
          className="text-sm font-semibold leading-relaxed mb-6 whitespace-pre-line"
          style={{ color: "var(--text-secondary)" }}
        >
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="confirm-btn flex-1 py-3 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-widest"
            style={{
              background: "var(--glass-bg-small)",
              border: "1.5px solid var(--glass-border)",
              color: "var(--text-secondary)",
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="confirm-btn flex-1 py-3 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-widest"
            style={{ background: accent, color: "var(--btn-text)" }}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style>{MODAL_CSS}</style>
    </div>
  );
}