import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../api/axios";
import { ShieldAlert, ShieldCheck, KeyRound, Loader2, ArrowRight, RefreshCcw } from "lucide-react";

const RESET_CSS = `
  .auth-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .input-field {
    background: rgba(15, 37, 71, 0.5);
    border: 2px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .input-field:focus {
    border-color: #2B7FE8;
    background: rgba(15, 37, 71, 0.8);
    box-shadow: 0 0 20px rgba(43, 127, 232, 0.15);
  }
  .sea-gradient-bg {
    background: radial-gradient(circle at top, #1E3A8A 0%, #0F172A 100%);
  }
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
        <div className="auth-card max-w-sm w-full p-8 rounded-[2.5rem] text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="bg-rose-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-rose-500/30">
            <ShieldAlert className="text-rose-500" size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-white font-black italic uppercase text-xl tracking-tighter">Acceso Denegado</h2>
            <p className="text-slate-400 text-sm font-medium italic">El enlace de recuperación ha expirado o es corrupto.</p>
          </div>
          <Link 
            to="/forgot-password" 
            className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-slate-300 py-4 rounded-2xl transition-all font-black italic uppercase tracking-widest text-[10px]"
          >
            <RefreshCcw size={14} /> Solicitar Nuevo Token
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
      await api.post("/password/reset", { token, password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
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
        <div className="auth-card max-w-sm w-full p-10 rounded-[2.5rem] text-center space-y-6 animate-in fade-in duration-500">
          <div className="bg-emerald-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 animate-pulse">
            <ShieldCheck className="text-emerald-500" size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-white font-black italic uppercase text-2xl tracking-tighter">Sincronizado</h2>
            <p className="text-emerald-400/80 text-[10px] font-black uppercase tracking-[0.2em]">Contraseña Actualizada</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <Loader2 size={16} className="animate-spin" />
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
      
      <div className="w-full max-w-md space-y-8 animate-in slide-in-from-bottom-6 duration-700">
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-[1.5rem] bg-blue-500/10 border border-blue-500/20 mb-2">
            <KeyRound className="text-[#2B7FE8]" size={32} />
          </div>
          <h1 className="text-white font-black italic text-4xl uppercase tracking-tighter">Restablecer</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Módulo de Seguridad del SEA</p>
        </div>

        <div className="auth-card rounded-[2.5rem] p-8 space-y-5 shadow-2xl shadow-black/50">
          <div className="space-y-4">
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="NUEVA CONTRASEÑA"
                autoFocus
                className="input-field w-full text-white rounded-2xl px-5 py-4 outline-none placeholder:text-slate-600 font-black italic text-sm tracking-widest uppercase"
              />
            </div>
            
            <div className="relative">
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="CONFIRMAR CLAVE"
                className="input-field w-full text-white rounded-2xl px-5 py-4 outline-none placeholder:text-slate-600 font-black italic text-sm tracking-widest uppercase"
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-3 animate-shake">
              <ShieldAlert size={16} className="text-rose-500" />
              <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!password || !confirm || loading}
            className="w-full group bg-[#2B7FE8] hover:bg-[#1A6FD8] disabled:opacity-20 text-white font-black italic uppercase tracking-[0.2em] py-5 rounded-2xl transition-all active:scale-95 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <span>Actualizar Vault</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        <p className="text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
          Conexión Encriptada de Punto a Punto
        </p>
      </div>
    </div>
  );
}