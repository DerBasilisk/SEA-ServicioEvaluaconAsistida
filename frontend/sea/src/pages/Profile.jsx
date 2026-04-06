import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Zap, Flame, Diamond, Heart, Trophy, 
  ChevronRight, Edit3, ShieldCheck, Star, 
  CheckCircle2, Info
} from "lucide-react";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

const rarityConfig = {
  common:    { bg: "bg-slate-50/50", text: "text-slate-500", label: "Común" },
  rare:      { bg: "bg-blue-50/50", text: "text-blue-500", label: "Raro" },
  epic:      { bg: "bg-violet-50/50", text: "text-violet-500", label: "Épico" },
  legendary: { bg: "bg-amber-50/50", text: "text-amber-600", label: "Legendario" },
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [leagueData, setLeagueData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      api.get("/leagues/me")
        .then(({ data }) => setLeagueData(data.data))
        .catch((err) => console.error("Error cargando liga", err));
    }
  }, [user]);

  if (!user) return null;

  const xpNextLevel = 1000;
  const progress = Math.min((user.xp / xpNextLevel) * 100, 100);

  const handleSave = async () => {
    setLoading(true);
    // Simulación de guardado
    setTimeout(() => { 
      setLoading(false); 
      setEditOpen(false); 
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF] flex flex-col font-['Nunito'] text-slate-900">
      <Navbar />

      {/* Fondo decorativo sutil */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-blue-200/50 to-transparent z-0" />

      <main className="flex-grow relative z-10 max-w-5xl mx-auto px-6 pt-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUMNA IZQUIERDA: Identidad */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white/70 backdrop-blur-xl border border-white rounded-[3rem] p-8 shadow-xl shadow-blue-900/5 text-center">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-tr from-blue-600 to-blue-400 p-1 shadow-lg">
                  <div className="w-full h-full rounded-[2.3rem] bg-white flex items-center justify-center text-blue-600 text-5xl font-black italic">
                    {user.username?.[0].toUpperCase()}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-2 rounded-2xl border-4 border-white shadow-md">
                  <ShieldCheck size={20} />
                </div>
              </div>

              <h1 className="text-2xl font-black tracking-tight italic uppercase">{user.displayName || user.username}</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">@{user.username}</p>

              <div className="space-y-3">
                <button 
                  onClick={() => setEditOpen(!editOpen)}
                  className="w-full py-3 rounded-2xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 size={14} /> {editOpen ? "Cancelar" : "Editar Perfil"}
                </button>
                <button 
                  onClick={() => { logout(); navigate("/login"); }}
                  className="w-full py-3 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-rose-500 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            </section>

            <section className="bg-white/70 backdrop-blur-xl border border-white rounded-[2.5rem] p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tu Liga</h3>
                <Trophy size={16} className="text-amber-500" />
              </div>
              <div className="flex items-center gap-4 bg-amber-50/50 p-4 rounded-3xl border border-amber-100">
                <span className="text-4xl">🥇</span>
                <div>
                  <p className="font-black text-slate-900 text-xl italic leading-none">Oro</p>
                  <p className="text-[10px] font-bold text-amber-600 uppercase mt-1">Puesto #{leagueData?.myRank || "4"}</p>
                </div>
              </div>
            </section>
          </div>

          {/* COLUMNA DERECHA: Progreso y Contenido */}
          <div className="lg:col-span-8 space-y-6">
            
            {editOpen && (
              <section className="bg-white rounded-[2.5rem] p-8 shadow-xl border-2 border-blue-100 animate-in slide-in-from-top-4 duration-300">
                <h2 className="text-lg font-black italic uppercase mb-6 flex items-center gap-2">
                  <Edit3 size={18} className="text-blue-500" /> Configuración
                </h2>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-blue-500 focus:bg-white outline-none transition-all"
                  />
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all"
                  >
                    {loading ? "Guardando..." : "Actualizar Información"}
                  </button>
                </div>
              </section>
            )}

            <section className="bg-white/40 backdrop-blur-md border border-white rounded-[3rem] p-8">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Nivel Actual</span>
                  <h2 className="text-4xl font-black italic text-slate-900 leading-none">Nivel {user.level}</h2>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black italic text-blue-600">{user.xp} / {xpNextLevel} XP</span>
                </div>
              </div>
              <div className="h-5 w-full bg-white rounded-full p-1 border border-slate-100 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </section>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={<Zap size={20} />} label="Total XP" value={user.xp} color="text-blue-500" />
              <StatCard icon={<Flame size={20} />} label="Racha" value={`${user.streak?.current || 0} d`} color="text-orange-500" />
              <StatCard icon={<Diamond size={20} />} label="Gemas" value={user.gems} color="text-cyan-500" />
              <StatCard icon={<Heart size={20} />} label="Vidas" value="5 / 5" color="text-rose-500" />
            </div>

            <section className="bg-white/70 backdrop-blur-xl border border-white rounded-[3rem] p-8 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest italic mb-8 flex items-center gap-2">
                <Star size={16} className="text-amber-500 fill-amber-500" /> Colección de Logros
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.achievements?.length > 0 ? (
                  user.achievements.map((ach) => {
                    const style = rarityConfig[ach.rarity] || rarityConfig.common;
                    return (
                      <div key={ach.key} className={`flex items-center gap-4 p-4 rounded-[2rem] border border-white transition-all hover:bg-white hover:shadow-md ${style.bg}`}>
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl">
                          {ach.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-black text-slate-800 text-xs uppercase italic">{ach.name}</h4>
                          <p className="text-slate-400 text-[10px] font-bold">{ach.description}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 text-xs font-bold uppercase">Sigue practicando para ganar insignias</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* FOOTER: Fuera del main pero dentro del div principal */}
      <footer className="w-full py-12 mt-10 border-t border-blue-100/50 relative z-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">S</div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0F2547]">
              SEA <span className="text-blue-500">Evaluación</span>
            </span>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">
            © 2026 • Hecho con <span className="text-rose-500 text-xs">♥</span> para estudiantes
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Privacidad</a>
            <a href="#" className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white/80 border border-white p-5 rounded-[2rem] flex flex-col items-center justify-center shadow-sm">
      <div className={`${color} mb-3 p-2.5 bg-slate-50 rounded-2xl`}>{icon}</div>
      <span className="text-xl font-black italic text-slate-900 leading-none">{value}</span>
      <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{label}</span>
    </div>
  );
}