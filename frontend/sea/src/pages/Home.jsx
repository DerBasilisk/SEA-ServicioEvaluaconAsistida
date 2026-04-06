import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  BookOpen, Sparkles, ChevronRight, 
  GraduationCap, Layout, Zap, Rocket,
  Target, Flame, Star, Award
} from "lucide-react";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import api from "../api/axios";
import Avatar from "../components/Avatar";

// ─── Estilos Globales SEA (Actualizados para expansión) ─────────────────────
const HOME_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-home { font-family: 'Nunito', sans-serif; }
  
  .sea-glass-main {
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 20px 50px rgba(43, 127, 232, 0.1);
  }

  .subject-card {
    background: white;
    border: 1.5px solid #E2E8F0;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .subject-card:hover {
    transform: translateY(-8px) scale(1.02);
    border-color: #2B7FE8;
    box-shadow: 0 15px 30px rgba(43, 127, 232, 0.15);
  }

  .progress-bar-inner {
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sea-sidebar-card {
    background: rgba(255, 255, 255, 0.6);
    border: 1.5px solid rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
  }
`;

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, leadRes] = await Promise.all([
          api.get("/subjects"),
          api.get("/friends/leaderboard") // Reutilizamos lógica de ranking
        ]);
        setSubjects(subRes.data.data || []);
        setLeaderboard(leadRes.data.data?.slice(0, 5) || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const progress = user ? Math.min(100, (user.xp / 1000) * 100) : 0;

  return (
    <div className="sea-home min-h-screen pb-12 relative overflow-hidden"
         style={{ background: "linear-gradient(145deg, #C8E6FF 0%, #A8D4FF 45%, #B8CBFF 100%)" }}>
      <style>{HOME_CSS}</style>
      
      {/* Fondo decorativo */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-white/30 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-blue-400/10 blur-[150px]" />
      </div>

      <Navbar />

      {/* CONTENEDOR FLUIDO: max-w-[98%] para casi total ocupación */}
      <main className="max-w-[98%] mx-auto px-4 sm:px-6 pt-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA 1: Perfil Compacto (Ocupa 2 de 12) */}
        <aside className="lg:col-span-2 space-y-5">
          <section className="sea-glass-main rounded-[2.5rem] p-6 text-center border-white/80 shadow-xl">
             <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white font-black italic text-3xl shadow-lg rotate-[-3deg]">
               <Avatar src={user?.avatar} name={user?.displayName || user?.username} size="xl" className="rounded-[2rem] border-4 border-white shadow-xl" />
             </div>
             <h2 className="text-lg font-black italic text-[#0F2547] uppercase tracking-tighter leading-none mb-4">
               Agente {user?.username}
             </h2>
             <div className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white/50 border border-white mb-4">
                <Flame className="text-orange-500 fill-orange-500" size={14} />
                <p className="text-[9px] font-black text-[#0F2547] uppercase tracking-[0.2em]">{user?.streak?.current || 0} Días</p>
             </div>
             <Link to="/profile" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0F2547] text-white font-black text-[9px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
                Expediente <ChevronRight size={12} />
             </Link>
          </section>

          <section className="sea-sidebar-card rounded-[2rem] p-5">
             <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#7A9CC5] mb-4 flex items-center gap-2">
               <Award size={14} className="text-[#2B7FE8]" /> Medallas
             </h3>
             <div className="grid grid-cols-3 gap-2">
                {user?.achievements?.slice(0, 3).map(ach => (
                   <div key={ach.key} className="aspect-square bg-white rounded-xl flex items-center justify-center text-xl border border-white shadow-sm">
                      {ach.icon}
                   </div>
                ))}
             </div>
          </section>
        </aside>

        {/* COLUMNA 2: Centro de Misiones (Ocupa 8 de 12 - El Corazón) */}
        <section className="lg:col-span-8 space-y-6">
          
          {/* Dashboard de Progreso Expansivo */}
          <section className="sea-glass-main rounded-[3rem] p-8 md:p-12 relative overflow-hidden border-white">
            <div className="absolute top-[-20px] right-[-20px] p-8 opacity-[0.03] rotate-12">
              <GraduationCap size={250} className="text-[#0F2547]" />
            </div>
            
            <div className="flex flex-col xl:flex-row justify-between xl:items-center mb-10 relative z-10 gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2B7FE8]/10 text-[#2B7FE8] mb-3">
                   <Zap size={14} fill="#2B7FE8" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Estatus de Combate</span>
                </div>
                <h2 className="text-7xl md:text-8xl font-black italic text-[#0F2547] leading-none tracking-tighter uppercase">NIVEL {user?.level || 1}</h2>
              </div>
              <div className="xl:text-right">
                <p className="text-[11px] font-black text-[#7A9CC5] uppercase tracking-[0.3em] mb-2">Siguiente Objetivo: Lvl {user?.level + 1 || 2}</p>
                <p className="text-4xl font-black italic text-[#2B7FE8] tracking-tighter">{user?.xp || 0} <span className="text-[#AAC0D8] text-xl not-italic font-bold">/ 1000 XP</span></p>
              </div>
            </div>
            
            <div className="h-8 w-full bg-white/40 rounded-3xl p-1.5 border border-white shadow-inner relative">
              <div
                className="progress-bar-inner h-full bg-gradient-to-r from-[#2B7FE8] via-[#5B9FFF] to-[#10B981] rounded-2xl shadow-[0_0_20px_rgba(43,127,232,0.4)]"
                style={{ width: `${progress}%` }}
              >
                 <div className="absolute inset-0 bg-white/20 animate-pulse rounded-2xl"></div>
              </div>
            </div>
          </section>

          {/* Grid de Materias Optimizado para espacio */}
          <div className="flex items-center justify-between mb-4 px-2">
             <div className="flex items-center gap-3">
                <div className="w-2 h-10 bg-[#2B7FE8] rounded-full shadow-lg shadow-blue-200"></div>
                <h2 className="text-4xl font-black text-[#0F2547] uppercase italic tracking-tighter">Misiones de Aprendizaje</h2>
             </div>
             <div className="hidden md:block text-[10px] font-black text-[#7A9CC5] uppercase tracking-widest">
                {subjects.length} Materias Disponibles
             </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white/30 rounded-[2.5rem] animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <SubjectCard key={subject._id} subject={subject} onClick={() => navigate(`/subject/${subject.slug}`)} />
              ))}
            </div>
          )}
        </section>

        {/* COLUMNA 3: Inteligencia y Social (Ocupa 2 de 12) */}
        <aside className="lg:col-span-2 space-y-6">
          <section className="sea-sidebar-card rounded-[2.5rem] p-6 border-white/60">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A9CC5] mb-6 flex items-center gap-2">
              <Star size={14} className="text-yellow-500 fill-yellow-500" /> TOP Rango
            </h3>
            <div className="space-y-5">
              {leaderboard.map((entry, i) => (
                <div key={entry.user._id} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? "bg-yellow-100 text-yellow-600" : "bg-slate-100 text-slate-400"}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black truncate text-[#0F2547] uppercase">{entry.user.displayName}</p>
                    <div className="h-1 w-full bg-slate-100 rounded-full mt-1 overflow-hidden">
                       <div className="h-full bg-[#2B7FE8]" style={{ width: `${(entry.xpEarned/1000)*100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/friends")} className="w-full mt-8 py-3 bg-[#2B7FE8] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md hover:brightness-110 transition-all">
              Ranking
            </button>
          </section>

          <section className="p-6 rounded-[2rem] bg-[#0F2547] text-white relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                <Target size={100} />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-blue-300">Objetivo Semanal</h4>
              <p className="text-xs font-bold leading-tight relative z-10">Consigue <span className="text-yellow-400 text-sm italic">500 XP</span> para mantener tu rango.</p>
          </section>
        </aside>

      </main>
    </div>
  );
}

// ─── Subcomponentes (Mantenidos y adaptados) ───────────────────────────────

function SubjectCard({ subject, onClick }) {
  const progress = subject.progressPercent || 0;

  return (
    <button
      onClick={onClick}
      className="subject-card rounded-[2.5rem] p-8 text-left relative overflow-hidden group shadow-sm"
    >
      {/* Indicador de color lateral */}
      <div 
        className="absolute top-0 left-0 bottom-0 w-2 opacity-80"
        style={{ backgroundColor: subject.color || "#2B7FE8" }}
      />
      
      <div className="flex items-start justify-between mb-6">
        <div className="p-4 bg-slate-50 rounded-[1.8rem] group-hover:scale-110 group-hover:bg-white transition-all duration-500 shadow-sm border border-slate-100 group-hover:rotate-3">
          <span className="text-4xl filter drop-shadow-sm">{subject.icon || "📚"}</span>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-[#7A9CC5] uppercase tracking-widest mb-1">Progreso</span>
          <span
            className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border whitespace-nowrap"
            style={{ backgroundColor: subject.color + "15", borderColor: subject.color + "30", color: subject.color }}
          >
            {subject.completedLessons || 0} / {subject.totalLessons || 0} Lecciones
          </span>
        </div>
      </div>

      <h3 className="text-[#0F2547] font-black text-2xl mb-2 group-hover:text-[#2B7FE8] transition-colors italic uppercase tracking-tighter leading-tight">
        {subject.name}
      </h3>
      <p className="text-[#7A9CC5] text-sm font-bold mb-6 line-clamp-2 leading-relaxed">
        {subject.description}
      </p>

      {/* Barra de progreso interna */}
      <div className="space-y-2 mt-auto">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-[#0F2547] uppercase tracking-widest">{progress}% Completado</span>
          <ChevronRight className="text-[#AAC0D8] group-hover:translate-x-1 transition-transform" size={16} />
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 p-0.5 border border-slate-50 shadow-inner">
          <div
            className="h-full rounded-full progress-bar-inner shadow-sm"
            style={{ 
              width: `${progress}%`, 
              backgroundColor: subject.color || "#2B7FE8",
              boxShadow: `0 0 10px ${subject.color}40`
            }}
          />
        </div>
      </div>
    </button>
  );
}

function EmptySubjects() {
  return (
    <div className="sea-glass-main rounded-[3rem] p-20 text-center col-span-2">
      <div className="inline-flex p-6 bg-blue-50 rounded-[2.5rem] mb-6 border border-white">
        <Rocket size={48} className="text-[#2B7FE8] animate-bounce" />
      </div>
      <h3 className="text-[#0F2547] font-black text-2xl mb-2 uppercase italic tracking-tighter">Hangar de Misiones Vacío</h3>
      <p className="text-[#7A9CC5] font-bold">El comando central está preparando nuevas materias para tu entrenamiento académico.</p>
    </div>
  );
}