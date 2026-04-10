import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../api/axios";
import { ShieldAlert, ShieldCheck, KeyRound, Loader2, ArrowRight, RefreshCcw } from "lucide-react";

const RESET_CSS = `
  .auth-card {
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 24px 64px var(--glass-shadow);
  }
  .input-field {
    background: var(--card-bg);
    border: 1.5px solid var(--glass-border);
    color: var(--text-primary);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .input-field:focus {
    border-color: var(--text-accent);
    background: var(--glass-bg);
    box-shadow: 0 0 20px var(--glass-shadow);
  }
  .sea-gradient-bg {
    background: var(--bg-gradient);
    background-attachment: fixed;
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  .animate-shake { animation: shake 0.3s ease-in-out; }
`;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // ── ESTADO: LINK INVÁLIDO ──
  if (!token) {
    return (
      <div className="sea-gradient-bg min-h-screen flex items-center justify-center px-6">
        <style>{RESET_CSS}</style>
        <div className="auth-card max-w-sm w-full p-8 rounded-[2.5rem] text-center space-y-6">
          <div className="bg-rose-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
            <ShieldAlert className="text-rose-500" size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-[var(--text-primary)] font-black italic uppercase text-xl tracking-tighter">Acceso Denegado</h2>
            <p className="text-[var(--text-secondary)] text-sm font-bold italic">Token de recuperación inexistente o expirado.</p>
          </div>
          <Link 
            to="/login" 
            className="flex items-center justify-center gap-2 w-full bg-[var(--card-bg)] hover:bg-white/20 text-[var(--text-primary)] py-4 rounded-2xl transition-all font-black italic uppercase tracking-widest text-[10px] border border-[var(--glass-border)]"
          >
            <RefreshCcw size={14} /> Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (password !== confirm) { setError("Las claves no coinciden"); return; }
    if (password.length < 6) { setError("Nivel de seguridad insuficiente (mín. 6)"); return; }

    setLoading(true);
    setError(null);
    try {
      await api.post("/users/reset-password", { token, password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Fallo en la reescritura de credenciales");
    } finally {
      setLoading(false);
    }
  };

  // ── ESTADO: ÉXITO ──
  if (success) {
    return (
      <div className="sea-gradient-bg min-h-screen flex items-center justify-center px-6">
        <style>{RESET_CSS}</style>
        <div className="auth-card max-w-sm w-full p-10 rounded-[2.5rem] text-center space-y-6">
          <div className="bg-emerald-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 animate-pulse">
            <ShieldCheck className="text-emerald-500" size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-[var(--text-primary)] font-black italic uppercase text-2xl tracking-tighter">Sincronizado</h2>
            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">Bóveda de Seguridad Actualizada</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-[var(--text-secondary)]">
            <Loader2 size={16} className="animate-spin text-[var(--text-accent)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Redirigiendo a Terminal...</span>
          </div>
        </div>
      </div>
    );
  }

  // ── ESTADO: FORMULARIO ──
  return (
    <div className="sea-gradient-bg min-h-screen flex items-center justify-center px-6 py-12">
      <style>{RESET_CSS}</style>
      
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-[1.8rem] bg-[var(--text-accent)] shadow-xl rotate-[-3deg] mb-2">
            <KeyRound className="text-white" size={32} />
          </div>
          <h1 className="text-[var(--text-primary)] font-black italic text-4xl uppercase tracking-tighter">Restablecer</h1>
          <p className="text-[var(--text-secondary)] font-black text-[10px] uppercase tracking-[0.3em]">Módulo de Seguridad del SEA</p>
        </div>

        <div className="auth-card rounded-[2.5rem] p-8 space-y-5">
          <div className="space-y-4">
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="NUEVA CONTRASEÑA"
                autoFocus
                className="input-field w-full rounded-2xl px-6 py-4 outline-none placeholder:text-[var(--text-muted)] font-black italic text-sm tracking-widest uppercase"
              />
            </div>
            
            <div className="relative">
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="CONFIRMAR CLAVE"
                className="input-field w-full rounded-2xl px-6 py-4 outline-none placeholder:text-[var(--text-muted)] font-black italic text-sm tracking-widest uppercase"
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-3 animate-shake">
              <ShieldAlert size={16} className="text-rose-500" />
              <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!password || !confirm || loading}
            className="w-full bg-[var(--btn-primary)] hover:opacity-90 disabled:opacity-20 text-[var(--btn-text)] font-black italic uppercase tracking-[0.2em] py-5 rounded-2xl transition-all active:scale-95 shadow-xl shadow-blue-500/10 flex items-center justify-center gap-3 border border-white/10"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <span>Actualizar Vault</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        <p className="text-center text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
          Encriptación SEA AES-256 Activa
        </p>
      </div>
    </div>
  );
}