import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Link2, Trash2, AlertTriangle, ChevronRight, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

// ─── Estilos Globales SEA ──────────────────────────────────────────────────
const SETTINGS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-settings { font-family: 'Nunito', sans-serif; }
  
  .sea-glass-card {
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 20px 50pxvar(--glass-shadow);
  }

  .sea-input {
    background: var(--sidebar-bg);
    border: 2px solid white;
    transition: all 0.3s ease;
  }
  .sea-input:focus {
    background: white;
    border-color: #2B7FE8;
    box-shadow: 0 0 15pxvar(--glass-shadow);
  }

  .danger-zone {
    background: rgba(254, 226, 226, 0.4);
    border: 1.5px solid rgba(248, 113, 113, 0.4);
  }
`;

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleDeleteAccount = async () => {
    if (deleteInput !== user?.username) return;
    setDeleting(true);
    try {
      await api.delete("/auth/delete-account");
      logout();
      navigate("/login");
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Error al eliminar la cuenta" });
      setTimeout(() => setMsg(null), 3000);
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="sea-settings min-h-screen pb-20 relative overflow-hidden"
         style={{ background: "var(--bg-gradient)" }}>
      <style>{SETTINGS_CSS}</style>

      {/* Decoración de fondo */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] rounded-full bg-white/20 blur-[100px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full bg-blue-400/10 blur-[100px]" />
      </div>

      <Navbar />

      <main className="max-w-3xl mx-auto px-6 pt-12 relative z-10">
        
        <div className="flex items-center gap-4 mb-10">
          <div className="w-2 h-10 bg-[#2B7FE8] rounded-full shadow-[0_0_15px_rgba(43,127,232,0.5)]"></div>
          <h1 className="text-4xl font-black text-[--text-primary] uppercase italic tracking-tighter">Panel de Control</h1>
        </div>

        {msg && (
          <div className={`mb-6 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center animate-bounce shadow-lg ${
            msg.type === "ok" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
          }`}>
            {msg.text}
          </div>
        )}

        {/* Sección de Cuentas */}
        <section className="sea-glass-card rounded-[2.5rem] p-8 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link2 size={20} className="text-[#2B7FE8]" />
            <h2 className="text-[--text-primary] font-black italic uppercase text-xl">Identidades Vinculadas</h2>
          </div>
          <p className="text-[#7A9CC5] text-[10px] font-black uppercase tracking-[0.2em] mb-8 ml-8">
            Sincronización de protocolos de acceso externo
          </p>

          <div className="grid gap-4">
            <SocialItem 
              name="Google" 
              active={!!user.googleId} 
              icon="https://www.google.com/favicon.ico" 
            />
            <SocialItem 
              name="Discord" 
              active={!!user.discordId} 
              icon="https://assets-global.website-files.com/6257adef93867e37d8a9a452/636e0a6cae3b5398a21361b2_icon_clyde_blurple_RGB.png" 
            />
          </div>
        </section>

        {/* Privacidad */}
        <section className="sea-glass-card rounded-[2.5rem] p-8 mb-12 border-dashed border-white/50">
          <div className="flex items-center justify-between opacity-60">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-[#2B7FE8]" />
              <h2 className="text-[--text-primary] font-black italic uppercase text-xl">Seguridad de Nodo</h2>
            </div>
            <span className="bg-white/50 px-3 py-1 rounded-lg text-[9px] font-black text-[#7A9CC5] uppercase">Próximamente</span>
          </div>
        </section>

        {/* Zona de Peligro */}
        <section className="danger-zone rounded-[2.5rem] p-8 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle size={24} className="text-rose-500" />
            <h2 className="text-rose-600 font-black italic uppercase text-xl tracking-tighter">Protocolo de Eliminación</h2>
          </div>
          
          <p className="text-rose-700/60 text-[10px] font-bold uppercase tracking-widest mb-8 leading-relaxed max-w-md">
            Esta acción desmantelará tu perfil permanentemente. Todos los créditos, XP y condecoraciones serán purgados del sistema.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-3 bg-white/60 hover:bg-rose-500 hover:text-white border border-rose-200 text-rose-500 font-black text-[10px] uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-sm active:scale-95"
            >
              <Trash2 size={16} /> Iniciar Secuencia de Borrado
            </button>
          ) : (
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border-2 border-rose-500/20 animate-in slide-in-from-top-4 duration-300">
              <p className="text-rose-600 text-xs font-black uppercase mb-4">
                Confirma tu identidad escribiendo: <span className="text-[--text-primary] italic underline">@{user.username}</span>
              </p>
              
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder={user.username}
                className="w-full sea-input rounded-2xl px-6 py-4 text-[--text-primary] font-bold outline-none mb-4 transition-all"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteInput !== user.username}
                  className="flex-[2] bg-rose-600 hover:bg-rose-700 disabled:opacity-30 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-rose-200"
                >
                  {deleting ? "Purgando Datos..." : "Confirmar Purga"}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-500 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl transition-all"
                >
                  Abortar
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function SocialItem({ name, active, icon }) {
  return (
    <div className="flex items-center justify-between p-5 bg-white/40 border border-white/60 rounded-[1.8rem] hover:bg-white/80 transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-2xl p-2.5 shadow-sm border border-slate-100 group-hover:rotate-6 transition-transform">
          <img src={icon} alt={name} className="w-full h-full object-contain" />
        </div>
        <div>
          <p className="text-[--text-primary] font-black italic uppercase text-sm tracking-tight">{name}</p>
          <p className="text-[9px] font-black text-[#7A9CC5] uppercase tracking-widest mt-0.5">
            {active ? "Conexión Establecida" : "Pendiente de Sincronía"}
          </p>
        </div>
      </div>
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
        active 
          ? "bg-emerald-50 border-emerald-100 text-emerald-500" 
          : "bg-slate-50 border-slate-100 text-slate-300"
      }`}>
        {active ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 border-2 border-slate-200 rounded-full" />}
        <span className="text-[9px] font-black uppercase tracking-widest">
          {active ? "Activo" : "Locked"}
        </span>
      </div>
    </div>
  );
}