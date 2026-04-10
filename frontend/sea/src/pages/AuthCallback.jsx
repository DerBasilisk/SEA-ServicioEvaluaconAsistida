import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, Zap } from "lucide-react";
import useAuthStore from "../store/authStore";

const CALLBACK_CSS = `
  @keyframes pulse-ring {
    0% { transform: scale(0.8); opacity: 0.5; }
    50% { transform: scale(1.2); opacity: 0.2; }
    100% { transform: scale(0.8); opacity: 0.5; }
  }
  .loading-ring {
    animation: pulse-ring 2s infinite ease-in-out;
  }
`;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      navigate("/login?error=google", { replace: true });
      return;
    }

    if (token) {
      loginWithToken(token).then((result) => {
        if (result?.ok) {
          // Redirección inteligente según rol
          if (result.isAdmin) {
            navigate("/admin", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        } else {
          navigate("/login?error=token", { replace: true });
        }
      });
    } else {
      navigate("/login?error=google", { replace: true });
    }
  }, [loginWithToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{ background: "var(--bg-gradient)" }}>
      <style>{CALLBACK_CSS}</style>

      {/* Decoración de fondo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Spinner Tecnológico */}
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl loading-ring" />
          <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl border border-white flex items-center justify-center">
            <Loader2 size={48} className="text-[#2B7FE8] animate-spin" />
            <Zap size={20} className="absolute text-yellow-400 fill-yellow-400 bottom-6 right-6" />
          </div>
        </div>

        {/* Textos de Estado */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck size={18} className="text-[#2B7FE8]" />
            <h2 className="text-[--text-primary] font-black italic uppercase tracking-tighter text-2xl">
              Sincronizando Nodo
            </h2>
          </div>
          
          <div className="flex flex-col items-center">
            <p className="text-[#7A9CC5] text-[10px] font-black uppercase tracking-[0.3em]">
              Verificando credenciales de Agente
            </p>
            <div className="w-48 h-1 bg-white/40 rounded-full mt-4 overflow-hidden border border-white/50 p-[1px]">
               <div className="h-full bg-[#2B7FE8] rounded-full animate-progress-loading" 
                    style={{ width: '60%', animation: 'loading-bar 2s infinite ease-in-out' }} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}