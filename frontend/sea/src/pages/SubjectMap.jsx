import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Lock, Star, Zap, Target, Layout } from "lucide-react";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

// ─── Configuración de Estados SEA Light ───────────────────────────────────
const STATUS_CONFIG = {
  completed: { 
    base: "#10b981",
    gradient: "from-emerald-400 to-teal-500",
    shadow: "shadow-[0_8px_20px_rgba(16,185,129,0.25)]",
    icon: <Star size={22} fill="white" className="text-white" /> 
  },
  available: { 
    base: "#2B7FE8",
    gradient: "from-[#2B7FE8] to-[#5B9FFF]",
    shadow: "shadow-[0_8px_20px_rgba(43,127,232,0.25)]",
    icon: <Zap size={22} fill="white" className="text-white" /> 
  },
  in_progress: { 
    base: "#f59e0b",
    gradient: "from-amber-400 to-orange-500",
    shadow: "shadow-[0_8px_20px_rgba(245,158,11,0.25)]",
    icon: <Target size={22} fill="white" className="text-white" /> 
  },
  locked: { 
    base: "#94a3b8",
    gradient: "from-slate-200 to-slate-300",
    shadow: "shadow-none",
    icon: <Lock size={18} className="text-slate-400" /> 
  },
};

const MAP_LIGHT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  .sea-map { font-family: 'Nunito', sans-serif; }

  .sea-glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 15px 35px var(--glass-shadow);
  }

  .node-label {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    transition: all 0.3s ease;
  }
`;

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
    <div className="min-h-screen bg-[var(--bg-gradient)] flex items-center justify-center">
      <div className="animate-pulse text-[var(--text-primary)] font-black italic tracking-widest uppercase text-[10px]">
        Generando Nexo de Aprendizaje...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen sea-map pb-40 relative overflow-hidden"
         style={{ background: "var(--bg-gradient)" }}>
      <style>{MAP_LIGHT_CSS}</style>
      <Navbar />
      
      {/* Decoración de Fondo Sutil */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[-5%] w-[500px] h-[500px] rounded-full bg-white/40 blur-[100px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-400/10 blur-[80px]" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-12">
        
        {/* Header Estilo Escritorio SEA */}
        <header className="sea-glass-card rounded-[2.5rem] p-8 mb-20 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-[var(--glass-bg)] rounded-3xl shadow-sm flex items-center justify-center text-5xl border border-[var(--glass-border)]">
              {subject.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#2B7FE8] font-black uppercase text-[9px] tracking-[0.4em]">Módulo de Operaciones</span>
              </div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[--text-primary] leading-none">{subject.name}</h1>
              <p className="text-[#7A9CC5] text-xs font-bold mt-1 uppercase tracking-wider">
                {subject.totalLessons || 0} Objetivos Detectados
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => navigate("/")} 
            className="mt-6 md:mt-0 px-6 py-3 bg-[--generic-btn] border-2 border-[--text-thirdary] hover:bg-[--glass-bg] hover:text-[--text-accent] text-[--text-thirdary] rounded-2xl font-black uppercase italic tracking-widest text-[9px] shadow-lg transition-all flex items-center gap-2 group"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
            Volver al Centro
          </button>
        </header>

        {/* Mapa de Unidades */}
        <div className="space-y-32">
          {subject.units?.map((unit, uIdx) => (
            <section key={unit._id} className="relative">
              {/* Título de Unidad */}
              <div className="flex items-center gap-4 mb-16">
                <div className="bg-[#2B7FE8] text-white px-4 py-1.5 rounded-xl text-[10px] font-black italic shadow-md">
                  FASE 0{uIdx + 1}
                </div>
                <h2 className="text-xl font-black italic uppercase tracking-widest text-[--text-primary]">{unit.name}</h2>
                <div className="flex-grow h-[2px] bg-gradient-to-r from-[#2B7FE8]/30 to-transparent" />
              </div>

              {/* Grid de Lecciones Compacto */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12">
                {unit.lessons?.map((lesson) => (
                  <GlassNode 
                    key={lesson._id} 
                    lesson={lesson} 
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

function GlassNode({ lesson, onClick }) {
  const config = STATUS_CONFIG[lesson.status] || STATUS_CONFIG.locked;
  const isLocked = lesson.status === "locked" && lesson.order !== 1;

  return (
    <div className="relative group flex flex-col items-center">
      
      {/* Glow de Selección */}
      {!isLocked && (
        <div 
          className="absolute -inset-6 opacity-0 group-hover:opacity-40 transition-all duration-500 blur-2xl rounded-full scale-75 group-hover:scale-100"
          style={{ backgroundColor: config.base }}
        />
      )}

      {/* La "Gema" (Nodo Circular) */}
      <button
        onClick={() => !isLocked && onClick()}
        disabled={isLocked}
        className={`
          relative w-24 h-24 rounded-[2rem] border-2 transition-all duration-500
          flex items-center justify-center z-10 overflow-hidden
          bg-gradient-to-br ${config.gradient} border-white shadow-xl
          ${isLocked ? 'grayscale opacity-40 scale-90' : 'hover:scale-110 hover:-translate-y-2 active:scale-95 shadow-2xl'}
        `}
      >
        {/* Efecto de Brillo de Cristal Light */}
        {!isLocked && (
          <>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-60" />
            <div className="absolute top-2 left-4 right-4 h-4 bg-white/20 rounded-full blur-[2px]" />
          </>
        )}
        
        <div className="relative z-20 drop-shadow-md">
          {config.icon}
        </div>
      </button>

      {/* Etiqueta de Texto */}
      <div className={`
        node-label mt-6 p-4 rounded-2xl transition-all duration-500 text-center w-full max-w-[160px] relative z-10
        ${isLocked ? 'bg-slate-50/50 border-slate-200 opacity-60' : 'group-hover:bg-[--glass-bg] group-hover:border-[--text-primary] group-hover:shadow-lg'}
      `}>
        <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1 ${isLocked ? 'text-slate-400' : 'text-[#2B7FE8] group-hover:text-blue-300'}`}>
           {isLocked ? 'En Espera' : 'Objetivo'}
        </p>
        <h3 className={`text-[11px] font-black tracking-tight uppercase italic leading-tight ${isLocked ? 'text-slate-400' : 'text-[--text-primary] group-hover:text-[--text-primary]'}`}>
          {lesson.name}
        </h3>
      </div>
    </div>
  );
}