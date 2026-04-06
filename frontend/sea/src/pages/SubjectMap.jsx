import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

const STATUS_CONFIG = {
  completed: { 
    base: "#10b981",
    gradient: "from-emerald-300 via-emerald-500 to-teal-600",
    shadow: "shadow-[0_20px_50px_rgba(16,185,129,0.3)]",
    icon: "💎" 
  },
  available: { 
    base: "#3b82f6",
    gradient: "from-blue-400 via-blue-600 to-indigo-700",
    shadow: "shadow-[0_20px_50px_rgba(59,130,246,0.3)]",
    icon: "✨" 
  },
  in_progress: { 
    base: "#f59e0b",
    gradient: "from-amber-300 via-orange-500 to-red-500",
    shadow: "shadow-[0_20px_50px_rgba(245,158,11,0.3)]",
    icon: "🔥" 
  },
  locked: { 
    base: "#475569",
    gradient: "from-slate-600 to-slate-800",
    shadow: "shadow-none",
    icon: "🔒" 
  },
};

export default function SubjectMap() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { fetchMe } = useAuthStore();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/subjects/${slug}`)
      .then(({ data }) => {
        setSubject(data.data);
        fetchMe();
      })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [slug, navigate, fetchMe]);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center font-black text-blue-500 animate-pulse tracking-widest uppercase text-xs">
      Cargando Nexo...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white font-['Nunito'] overflow-x-hidden selection:bg-blue-500/30">
      <Navbar />
      
      {/* Background FX - Luces de Neón difusas */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-20%] w-[100vw] h-[600px] bg-blue-900/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[800px] h-[800px] bg-indigo-900/10 blur-[150px] rounded-full" />
      </div>

      <main className="relative z-10 w-full px-6 md:px-20 pt-32 pb-64">
        
        {/* Header Estilo "Aura de Cristal" */}
        <header className="w-full flex flex-col md:flex-row items-center justify-between mb-40 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[5rem] p-14 shadow-2xl relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-[5rem] pointer-events-none" />
          <div className="flex items-center gap-12 relative z-10">
            <div className="w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-[3rem] border border-white/20 flex items-center justify-center text-8xl shadow-2xl transition-transform group-hover:scale-110 duration-700">
              {subject.icon}
            </div>
            <div>
              <h1 className="text-7xl font-black italic uppercase tracking-tighter leading-none mb-3 drop-shadow-2xl">{subject.name}</h1>
              <div className="flex items-center gap-3">
                <span className="h-1 w-12 bg-blue-500 rounded-full" />
                <p className="text-blue-400 font-black uppercase text-[10px] tracking-[0.6em]">Mapa de Maestría</p>
              </div>
            </div>
          </div>
          <button onClick={() => navigate("/")} className="mt-10 md:mt-0 px-12 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-black uppercase italic tracking-widest transition-all hover:tracking-[0.3em]">
            Escritorio
          </button>
        </header>

        {/* Mapa Expandido */}
        <div className="space-y-80">
          {subject.units?.map((unit, uIdx) => (
            <section key={unit._id} className="w-full">
              <div className="flex items-center gap-8 mb-32 opacity-50">
                <span className="text-xs font-black text-blue-500 tracking-[0.5em]">0{uIdx + 1}</span>
                <h2 className="text-3xl font-black italic uppercase tracking-widest">{unit.name}</h2>
                <div className="flex-grow h-px bg-gradient-to-r from-white/20 to-transparent" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-40 justify-items-center">
                {unit.lessons?.map((lesson, i) => (
                  <GlassNode 
                    key={lesson._id} 
                    lesson={lesson} 
                    index={i} 
                    onClick={() => navigate(`/lesson/${lesson._id}`)} 
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

function GlassNode({ lesson, index, onClick }) {
  const config = STATUS_CONFIG[lesson.status] || STATUS_CONFIG.locked;
  const isLocked = lesson.status === "locked";
  
  // Alternar alturas para romper la simetría aburrida
  const yShift = index % 2 === 0 ? "translate-y-0" : "lg:translate-y-32";

  return (
    <div className={`relative group flex flex-col items-center ${yShift} transition-all duration-700`}>
      
      {/* Resplandor de fondo (Aura) */}
      {!isLocked && (
        <div className={`absolute -inset-10 bg-[${config.base}] blur-[100px] opacity-0 group-hover:opacity-20 transition-opacity duration-1000`} />
      )}

      {/* La Gema de Cristal */}
      <button
        onClick={() => !isLocked && onClick()}
        disabled={isLocked}
        className={`
          relative w-36 h-36 rounded-[3.5rem] border-2 transition-all duration-500
          flex items-center justify-center text-6xl z-10 overflow-hidden
          bg-gradient-to-br ${config.gradient} border-white/30 ${config.shadow}
          ${isLocked ? 'grayscale opacity-20 scale-90' : 'hover:scale-110 hover:-translate-y-6 active:scale-95 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]'}
        `}
      >
        {/* REFLEJOS DE CRISTAL REALISTAS */}
        {!isLocked && (
          <>
            {/* Brillo Superior (Glint) */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 via-transparent to-black/20 pointer-events-none" />
            <div className="absolute top-4 left-8 right-8 h-8 bg-white/30 rounded-full blur-[2px]" />
            {/* Destello de Punto */}
            <div className="absolute top-10 left-10 w-4 h-4 bg-white/60 rounded-full blur-[1px]" />
            {/* Reflejo de Lente Inferior */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-2 bg-black/20 rounded-full blur-[2px]" />
          </>
        )}
        
        <span className={`relative z-20 transition-transform duration-500 group-hover:scale-125 drop-shadow-2xl`}>
          {isLocked ? "🔒" : config.icon}
        </span>
      </button>

      {/* Etiqueta de la Lección Estilo "Glass-Card" */}
      <div className={`
        mt-12 p-8 rounded-[2.5rem] border backdrop-blur-3xl transition-all duration-500 text-center min-w-[240px]
        ${isLocked ? 'bg-white/5 border-white/5 opacity-40' : 'bg-white/10 border-white/20 group-hover:bg-blue-600 group-hover:border-blue-400 group-hover:shadow-[0_20px_40px_rgba(37,99,235,0.3)]'}
      `}>
        <span className="block text-[9px] font-black uppercase tracking-[0.4em] text-blue-400 mb-2 group-hover:text-white/70">
           {isLocked ? 'Bloqueado' : 'Lección'}
        </span>
        <h3 className="text-white font-black text-sm uppercase italic tracking-tight leading-tight">
          {lesson.name}
        </h3>
      </div>
    </div>
  );
}