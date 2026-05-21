// frontend/sea/src/pages/VerificationPending.jsx
import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Mail, RefreshCw, CheckCircle } from "lucide-react";
import useAuthStore from "../store/authStore";

const VERIFICATION_PENDING_CSS = `
  @keyframes pending-fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .pending-card {
    background: var(--glass-bg);
    backdrop-filter: blur(24px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 24px 64px var(--glass-shadow);
    animation: pending-fadeUp 0.5s ease both 0.1s;
  }
  .pending-icon {
    background: var(--text-accent);
    box-shadow: 0 8px 24px var(--glass-shadow);
  }
`;

export default function VerificationPending() {
  const location = useLocation();
  const email = location.state?.email || "";
  const { resendVerification, loading } = useAuthStore();
  const [resendStatus, setResendStatus] = useState({ sent: false, error: "" });

  const handleResend = async () => {
    if (!email) {
      setResendStatus({ sent: false, error: "No se pudo identificar tu correo. Intenta registrarte nuevamente." });
      return;
    }
    const result = await resendVerification(email);
    if (result.ok) {
      setResendStatus({ sent: true, error: "" });
      setTimeout(() => setResendStatus({ sent: false, error: "" }), 5000);
    } else {
      setResendStatus({ sent: false, error: result.message });
    }
  };

  return (
    <>
      <style>{VERIFICATION_PENDING_CSS}</style>
      <div
        className="min-h-screen flex items-center justify-center p-6 overflow-hidden relative"
        style={{ background: "var(--bg-gradient)" }}
      >
        {/* Orbes decorativos */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-30"
               style={{ background: "var(--deco-blob)", filter: "blur(80px)" }} />
          <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-20"
               style={{ background: "var(--deco-blob2)", filter: "blur(80px)" }} />
        </div>

        <div className="relative z-10 w-full max-w-[480px] text-center">
          <div className="pending-card rounded-[2.5rem] p-8 md:p-10">
            {/* Ícono animado */}
            <div className="pending-icon inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 mx-auto">
              <Mail size={48} className="text-white" />
            </div>

            <h1 className="text-3xl font-black tracking-tighter italic uppercase text-[var(--text-primary)] mb-2">
              ¡Casi listo!
            </h1>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-6">
              Verifica tu correo electrónico
            </p>

            <div className="space-y-4 text-left bg-[var(--card-bg)]/30 rounded-2xl p-5 border border-[var(--glass-border)]">
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                Hemos enviado un enlace de verificación a:
              </p>
              <p className="font-mono font-bold text-base break-all text-[var(--text-accent)] bg-[var(--glass-bg)] p-2 rounded-xl text-center">
                {email || "tu correo electrónico"}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Haz clic en el enlace que recibiste para activar tu cuenta. El enlace expirará en <strong>24 horas</strong>.
              </p>
            </div>

            {/* Mensaje de reenvío */}
            {resendStatus.sent && (
              <div className="mt-5 px-4 py-3 rounded-2xl text-xs font-bold text-green-600 text-center bg-green-500/10 border border-green-500/20 flex items-center justify-center gap-2">
                <CheckCircle size={16} />
                {resendStatus.sent === true && "¡Correo reenviado! Revisa tu bandeja de entrada."}
              </div>
            )}
            {resendStatus.error && (
              <div className="mt-5 px-4 py-3 rounded-2xl text-xs font-bold text-rose-500 text-center bg-rose-500/10 border border-rose-500/20">
                {resendStatus.error}
              </div>
            )}

            <button
              onClick={handleResend}
              disabled={loading}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-transparent border border-[var(--text-accent)] text-[var(--text-accent)] font-extrabold py-3 rounded-2xl uppercase italic tracking-wider text-sm hover:bg-[var(--text-accent)] hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              {loading ? "Enviando..." : "Reenviar correo de verificación"}
            </button>

            <div className="mt-8 pt-6 border-t border-[var(--glass-border)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                ¿Ya verificaste?{" "}
                <Link to="/login" className="text-[var(--text-accent)] hover:underline">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}