import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";

// Estilos compartidos con el sistema SEA
const FORGOT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-font { font-family: 'Nunito', sans-serif; }
  
  .sea-glass {
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 20px 50pxvar(--glass-shadow);
  }

  .sea-input {
    background: var(--sidebar-bg);
    border: 2px solid transparent;
    transition: all 0.3s ease;
  }
  .sea-input:focus {
    background: white;
    border-color: #2B7FE8;
    box-shadow: 0 0 0 4pxvar(--glass-shadow);
  }

  .sea-btn-primary {
    background: linear-gradient(135deg, #2B7FE8 0%, #1A5BB0 100%);
    box-shadow: 0 10px 20px rgba(43, 127, 232, 0.3);
    transition: all 0.3s ease;
  }
  .sea-btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 15px 25px rgba(43, 127, 232, 0.4);
    filter: brightness(1.1);
  }
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
      await api.post("/password/forgot", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "No pudimos procesar tu solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sea-font min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
         style={{ background: "var(--bg-gradient)" }}>
      <style>{FORGOT_CSS}</style>

      {/* Orbes decorativos */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-white/30 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-400/10 blur-[100px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="sea-glass rounded-[3rem] p-10 md:p-12">
          
          {/* Lógica de Estado Enviado */}
          {sent ? (
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border-2 border-white">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter text-[--text-primary] uppercase mb-4">
                ¡Misión enviada!
              </h2>
              <p className="text-[#5B7CA3] font-bold text-sm leading-relaxed mb-8">
                Si <span className="text-[#2B7FE8]">{email}</span> está en nuestra base de datos, recibirás un enlace de recuperación en breve.
              </p>
              <Link to="/login" 
                className="inline-flex items-center gap-2 text-[#2B7FE8] font-black text-[11px] uppercase tracking-widest hover:gap-3 transition-all">
                <ArrowLeft size={16} /> Volver al Inicio
              </Link>
            </div>
          ) : (
            <>
              {/* Encabezado */}
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[#2B7FE8] to-[#5B9FFF] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-[-3deg] border-2 border-white/50">
                  <KeyRound size={32} className="text-white" />
                </div>
                <h1 className="text-3xl font-black italic tracking-tighter text-[--text-primary] uppercase">
                  Recuperar Acceso
                </h1>
                <p className="text-[#7A9CC5] text-[10px] font-extrabold uppercase tracking-[0.2em] mt-2">
                  Sistema de Seguridad SEA
                </p>
              </div>

              {/* Formulario */}
              <div className="space-y-6">
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#AAC0D8] group-focus-within:text-[#2B7FE8] transition-colors" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="TU EMAIL REGISTRADO"
                    autoFocus
                    className="sea-input w-full rounded-[1.5rem] pl-14 pr-6 py-5 outline-none font-bold text-sm text-[--text-primary] placeholder:text-[#AAC0D8] placeholder:font-black placeholder:text-[10px] placeholder:tracking-widest shadow-inner"
                  />
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl animate-in shake duration-300">
                    <p className="text-rose-500 text-[10px] font-black uppercase tracking-tight text-center">
                      ⚠ {error}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!email.trim() || loading}
                  className="sea-btn-primary w-full text-white font-black py-5 rounded-[1.5rem] text-[11px] uppercase tracking-[0.2em] disabled:opacity-50 active:scale-95 transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Procesando...
                    </span>
                  ) : "Solicitar Nueva Clave"}
                </button>

                <div className="pt-4 text-center">
                  <Link to="/login" 
                    className="text-[#7A9CC5] hover:text-[#2B7FE8] font-black text-[10px] uppercase tracking-widest transition-colors inline-flex items-center gap-2">
                    <ArrowLeft size={14} /> Recordé mis credenciales
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer sutil */}
        <p className="text-center mt-8 text-[#5B7CA3]/60 font-bold text-[10px] uppercase tracking-[0.3em]">
          Simulador de Examen Asistido • 2026
        </p>
      </div>
    </div>
  );
}