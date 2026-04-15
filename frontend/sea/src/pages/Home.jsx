import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Plus, Sparkles, ChevronRight, 
  GraduationCap, Layout, Zap, Rocket,
  Target, Flame, Star, Award
} from "lucide-react";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import api from "../api/axios";
import Avatar from "../components/Avatar";

const HOME_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-home { font-family: 'Nunito', sans-serif; }
  
  .sea-glass-main {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 20px 50px var(--glass-shadow);
    color: var(--text-primary);
  }

  .subject-card {
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .subject-card h3 { color: var(--text-primary); }
  .subject-card p { color: var(--text-secondary); }

  .subject-card:hover {
    transform: translateY(-8px) scale(1.02);
    border-color: var(--text-accent);
    box-shadow: 0 15px 30px var(--glass-shadow);
  }

  .progress-bar-inner {
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sea-sidebar-card {
    background: var(--sidebar-bg);
    border: 1.5px solid var(--sidebar-border);
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
          api.get("/friends/leaderboard")
        ]);
        
        // FILTRADO CLAVE: Solo mostramos las que el usuario tiene como favoritas
        const allSubjects = subRes.data.data || [];
        const myActiveMissions = allSubjects.filter(sub => 
          user?.favoriteSubjects?.some(fav => (fav._id || fav) === sub._id)
        );

        setSubjects(myActiveMissions);
        setLeaderboard(leadRes.data.data?.slice(0, 5) || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user?.favoriteSubjects]);

 const progress = user ? Math.min(100, (user.xp / 1000) * 100) : 0;

  return (
    <div className="sea-home min-h-screen pb-12 relative overflow-hidden"
         style={{ background: "var(--bg-gradient)", color: "var(--text-primary)" }}>
      <style>{HOME_CSS}</style>
      
      {/* Fondo decorativo: se reduce el tamaño en móvil para evitar lag de blur */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[-10%] w-[300px] md:w-[800px] h-[300px] md:h-[800px] rounded-full bg-[var(--deco-blob)] blur-[80px] md:blur-[150px]" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[250px] md:w-[700px] h-[250px] md:h-[700px] rounded-full bg-[var(--deco-blob2)] blur-[80px] md:blur-[150px]" />
      </div>

      <Navbar />

      {/* MAIN: El grid ahora es 1 columna en móvil, 12 en desktop */}
      <main className="w-full mx-auto px-4 sm:px-6 pt-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA 1: Perfil (En móvil va arriba, pero más compacto) */}
        <aside className="lg:col-span-3 xl:col-span-2 order-2 lg:order-1 space-y-5">
          <section className="sea-glass-main rounded-[2rem] p-5 text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3">
                <Avatar src={user?.avatar} name={user?.displayName} size="xl" className="rounded-2xl border-2 border-white/50 shadow-lg" />
              </div>
              <h2 className="text-base md:text-lg font-black italic uppercase tracking-tighter mb-3">
                Agente {user?.username}
              </h2>
              <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-white/20 border border-white/30 mb-3">
                 <Flame className="text-orange-500 fill-orange-500" size={14} />
                 <p className="text-[10px] font-black uppercase">{user?.streak?.current || 0} Días</p>
              </div>
              <Link to="/profile" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--text-accent)] text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-transform">
                Expediente <ChevronRight size={12} />
              </Link>
          </section>

          {/* Medallas: Ocultas en móvil pequeño o mostradas en grid simple */}
          <section className="sea-sidebar-card rounded-[2rem] p-5 hidden md:block">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                <Award size={14} className="text-[var(--text-accent)]" /> Medallas
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {user?.achievements?.slice(0, 3).map((ach, idx) => (
                   <div key={idx} className="aspect-square bg-white/10 rounded-xl flex items-center justify-center text-lg border border-white/20">
                      {ach.icon}
                   </div>
                ))}
              </div>
          </section>
        </aside>

        {/* COLUMNA 2: Centro de Misiones (Prioridad visual) */}
        <section className="lg:col-span-9 xl:col-span-8 order-1 lg:order-2 space-y-6">
          <section className="sea-glass-main rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 relative overflow-hidden">
            <div className="absolute top-[-10px] right-[-10px] opacity-[0.05] rotate-12 text-[var(--text-primary)] pointer-events-none">
              <GraduationCap size={180} />
            </div>
            
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 relative z-10 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--text-accent)]/20 text-[var(--text-accent)] mb-2">
                   <Zap size={12} fill="currentColor" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Estatus</span>
                </div>
                {/* Texto ajustado para móvil */}
                <h2 className="text-5xl md:text-8xl font-black italic leading-none tracking-tighter uppercase">
                  NIVEL {user?.level || 1}
                </h2>
              </div>
              <div className="md:text-right">
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Meta: Lvl {user?.level + 1 || 2}</p>
                <p className="text-3xl md:text-4xl font-black italic text-[var(--text-accent)]">{user?.xp || 0} <span className="text-sm md:text-xl not-italic opacity-60">/ 1000 XP</span></p>
              </div>
            </div>
            
            <div className="h-6 w-full bg-black/5 rounded-full p-1 border border-white/20">
              <div
                className="progress-bar-inner h-full bg-gradient-to-r from-[var(--text-accent)] to-[#10B981] rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          {/* Título de Secciones */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 px-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-[var(--text-accent)] rounded-full"></div>
                <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">Misiones</h2>
              </div>
              <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">
                {subjects.length} Materias
              </span>
          </div>

          {/* Grid de Materias: 1 col móvil, 2 tablet, 3 desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {subjects.map((subject) => (
              <SubjectCard key={subject._id} subject={subject} onClick={() => navigate(`/subject/${subject.slug}`)} />
            ))}
            
            {/* Card especial para añadir más */}
            <button 
              onClick={() => navigate("/subject-catalog")}
              className="border-4 border-dashed border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-3 group hover:border-[var(--text-accent)]/50 transition-all bg-white/5"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="text-[var(--text-secondary)]" />
              </div>
            </button>
          </div>
        </section>

        {/* COLUMNA 3: Ranking (Se va al final en móvil) */}
        <aside className="lg:col-span-12 xl:col-span-2 order-3 space-y-5">
           <section className="sea-sidebar-card rounded-[2rem] p-6 mb-12">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-4 flex items-center gap-2">
               <Star size={14} className="text-yellow-500 fill-yellow-500" /> TOP Rango
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-1 gap-4">
               {leaderboard.map((entry, i) => (
                 <div key={entry.user._id} className="flex items-center gap-3 bg-white/5 p-2 rounded-xl xl:bg-transparent xl:p-0">
                   <div className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-500"}`}>
                     {i + 1}
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-[10px] font-black truncate uppercase">{entry.user.displayName}</p>
                     <div className="h-1 w-full bg-black/10 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-[var(--text-accent)]" style={{ width: `${(entry.xpEarned/1000)*100}%` }}></div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
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
      className="subject-card rounded-[2rem] md:rounded-[2.5rem] p-3 md:p-8 text-left relative overflow-hidden group shadow-sm flex flex-col h-full"
    >
      {/* Indicador de color lateral */}
      <div 
        className="absolute top-0 left-0 bottom-0 w-1.5 md:w-2 opacity-80"
        style={{ backgroundColor: subject.color || "#2B7FE8" }}
      />
      
      {/* CONTENEDOR PRINCIPAL: Row en móvil, Column en Desktop */}
      <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0 h-full">
        
        {/* VISTA MÓVIL: Círculo de Progreso (Visible solo en < 768px) */}
        <div className="md:hidden relative shrink-0">
          <ProgressCircle 
            progress={progress} 
            color={subject.color} 
            size={64}
          >
            {/* Fondo sólido para que no se pierda con el fondo de la app */}
            <div className="w-12 h-12 bg-[--glass-bg] rounded-full flex items-center justify-center shadow-inner">
              <span className="text-xl">{subject.icon || "📚"}</span>
            </div>
          </ProgressCircle>
        </div>

        {/* VISTA DESKTOP: Icono Tradicional (Oculto en móvil) */}
        <div className="hidden md:block p-4 bg-[--glass-bg] rounded-[1.8rem] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 mb-6">
          <span className="text-4xl">{subject.icon || "📚"}</span>
        </div>

        {/* TEXTOS (Nombre y Lecciones) */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[#0F2547] font-black text-base md:text-2xl italic uppercase tracking-tighter leading-tight truncate md:whitespace-normal md:mb-2">
            {subject.name}
          </h3>
          <p className="hidden md:block text-[#7A9CC5] text-sm font-bold mb-6 line-clamp-2">
            {subject.description}
          </p>
          
          {/* Badge de lecciones: más pequeño en móvil */}
          <span
            className="inline-block text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full border mt-1 md:mt-0"
            style={{ backgroundColor: subject.color + "15", borderColor: subject.color + "30", color: subject.color }}
          >
            {subject.completedLessons}/{subject.totalLessons} <span className="hidden md:inline">Lecciones</span>
          </span>
        </div>

        {/* VISTA DESKTOP: Barra de progreso lineal (Oculta en móvil) */}
        <div className="hidden md:block w-full mt-auto pt-4">
           <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-[--text-primary] uppercase tracking-widest">{progress}%</span>
              <ChevronRight className="text-[#AAC0D8] group-hover:translate-x-1 transition-transform" size={16} />
           </div>
           <div className="w-full bg-slate-100 rounded-full h-2.5 p-0.5 border border-slate-50 shadow-inner">
              <div
                className="h-full rounded-full progress-bar-inner"
                style={{ width: `${progress}%`, backgroundColor: subject.color || "#2B7FE8" }}
              />
           </div>
        </div>
      </div>
    </button>
  );
}

function ProgressCircle({ progress, color, size, children }) {
  const stroke = 5;
  const radius = (size / 2) - (stroke / 2);
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Círculo de base: Ahora con un color sólido suave para contraste */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(0,0,0,0.05)" // Fondo muy tenue del "riel"
          strokeWidth={stroke}
          fill="rgba(255,255,255,0.4)" // Fondo interno para separar del blur
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color || "#2B7FE8"}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
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