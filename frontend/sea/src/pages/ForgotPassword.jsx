import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";

const FORGOT_CSS = `
  .sea-glass {
    background: var(--glass-bg);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 24px 64px var(--glass-shadow);
  }

  .sea-input {
    background: var(--card-bg);
    border: 1.5px solid var(--glass-border);
    color: var(--text-primary);
    transition: all 0.3s ease;
  }

  .sea-input:focus {
    background: var(--glass-bg);
    border-color: var(--text-accent);
    box-shadow: 0 0 0 4px var(--glass-shadow);
    outline: none;
  }

  .sea-btn-primary {
    background: var(--text-accent);
    color: var(--btn-text);
    box-shadow: 0 10px 20px var(--glass-shadow);
    transition: all 0.3s ease;
  }

  .sea-btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.1);
  }

  @keyframes sea-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
  .animate-shake { animation: sea-shake 0.3s ease-in-out; }
`;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Ajuste de ruta a tu API
      await api.post("/password/forgot", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "No pudimos procesar tu solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
         style={{ background: "var(--bg-gradient)" }}>
      <style>{FORGOT_CSS}</style>

      {/* Orbes dinámicos */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-30 pointer-events-none"
           style={{ background: "var(--deco-blob)", filter: "blur(100px)" }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-20 pointer-events-none"
           style={{ background: "var(--deco-blob2)", filter: "blur(100px)" }} />

      <div className="w-full max-w-md relative z-10">
        <div className="sea-glass rounded-[3rem] p-10 md:p-12">
          
          {sent ? (
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter text-[var(--text-primary)] uppercase mb-4">
                Misión enviada
              </h2>
              <p className="text-[var(--text-secondary)] font-bold text-sm leading-relaxed mb-8">
                Si <span className="text-[var(--text-accent)]">{email}</span> está registrado, recibirás un enlace de recuperación en breve.
              </p>
              <Link to="/login" 
                className="inline-flex items-center gap-2 text-[var(--text-accent)] font-black text-[11px] uppercase tracking-widest hover:gap-3 transition-all">
                <ArrowLeft size={16} /> Volver al Inicio
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-[var(--text-accent)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-[-3deg] border border-white/20">
                  <KeyRound size={32} className="text-white" />
                </div>
                <h1 className="text-3xl font-black italic tracking-tighter text-[var(--text-primary)] uppercase">
                  Recuperar
                </h1>
                <p className="text-[var(--text-secondary)] text-[10px] font-extrabold uppercase tracking-[0.2em] mt-2">
                  Protocolo de Seguridad SEA
                </p>
              </div>

              <div className="space-y-6">
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--text-accent)] transition-colors" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="TU EMAIL REGISTRADO"
                    autoFocus
                    className="sea-input w-full rounded-[1.5rem] pl-14 pr-6 py-5 font-bold text-sm placeholder:text-[var(--text-muted)] placeholder:font-black placeholder:text-[10px] placeholder:tracking-widest"
                  />
                </div>

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl animate-shake">
                    <p className="text-rose-500 text-[10px] font-black uppercase tracking-tight text-center">
                      ⚠ {error}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!email.trim() || loading}
                  className="sea-btn-primary w-full font-black py-5 rounded-[1.5rem] text-[11px] uppercase tracking-[0.2em] disabled:opacity-50 active:scale-95 transition-all"
                >
                  {loading ? "Sincronizando..." : "Solicitar Nueva Clave →"}
                </button>

                <div className="pt-4 text-center">
                  <Link to="/login" 
                    className="text-[var(--text-secondary)] hover:text-[var(--text-accent)] font-black text-[10px] uppercase tracking-widest transition-colors inline-flex items-center gap-2">
                    <ArrowLeft size={14} /> Recordé mis credenciales
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        <p className="text-center mt-8 text-[var(--text-secondary)] opacity-50 font-black text-[10px] uppercase tracking-[0.3em]">
          Simulador de Examen Asistido • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}