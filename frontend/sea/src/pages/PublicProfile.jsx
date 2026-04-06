import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfile(); }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/friends/profile/${username}`);
      setProfile(data.data);
    } catch { navigate("/friends"); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F0F7FF] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (!profile) return null;

  const progress = (profile.xp % 1000) / 10;

  return (
    <div className="min-h-screen bg-[#F0F7FF] flex flex-col font-['Nunito'] text-slate-800 pb-20 relative overflow-hidden">
      <Navbar />
      
      {/* Fondo de esferas 3D (Efecto profundidad de la imagen) */}
      <div className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] bg-indigo-300/20 rounded-full blur-[100px] pointer-events-none" />

      <main className="flex-grow relative z-10 max-w-xl mx-auto px-6 pt-12 w-full">

        {/* Botón Volver Estilo Pastilla */}
        <button onClick={() => navigate(-1)} 
          className="bg-white/80 backdrop-blur-md border border-white text-blue-600 mb-8 px-6 py-2.5 rounded-full font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-blue-900/5 hover:scale-105 transition-all active:scale-95">
          ← Volver atrás
        </button>

        {/* Card Principal: Glassmorphism Puro */}
        <div className="relative bg-white/70 backdrop-blur-3xl border border-white rounded-[4rem] p-10 text-center shadow-[0_40px_80px_-20px_rgba(0,120,212,0.15)] ring-1 ring-white/50 mb-8 overflow-hidden">
          
          {/* Brillo de Cristal Superior */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />

          {/* Avatar 3D con Sombra Azul */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 bg-blue-600 rounded-[3rem] blur-2xl opacity-20 scale-110" />
            <div className="relative w-full h-full bg-gradient-to-br from-[#00b4db] to-[#0083b0] rounded-[3rem] border-4 border-white flex items-center justify-center text-white text-5xl font-black shadow-2xl">
              {(profile.displayName || profile.username)?.[0]?.toUpperCase()}
            </div>
          </div>
          
          <h1 className="text-slate-900 font-black text-4xl italic tracking-tighter uppercase mb-1 drop-shadow-sm">
            {profile.displayName || profile.username}
          </h1>
          <p className="text-blue-500/50 font-black text-[10px] uppercase tracking-[0.3em] mb-10">
            COMPETIDOR @{profile.username}
          </p>

          {/* Barra de Progreso "Fluida" */}
          <div className="max-w-xs mx-auto mb-12">
             <div className="flex justify-between text-[9px] font-black uppercase text-blue-400 mb-2 px-3 tracking-widest">
                <span>Nivel {profile.level}</span>
                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">⚡ {profile.xp} XP</span>
             </div>
             <div className="h-6 w-full bg-slate-200/40 rounded-full border border-white shadow-inner p-1.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] rounded-full shadow-[0_0_15px_rgba(0,180,219,0.5)] transition-all duration-1000 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute top-0 left-0 w-full h-[40%] bg-white/30 rounded-full" />
                </div>
             </div>
          </div>

          {/* Botón de Acción Estilo 3D */}
          <button className="group relative bg-[#0078d4] text-white px-10 py-4 rounded-[2rem] shadow-2xl shadow-blue-600/40 border-t border-white/30 font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:scale-105 active:scale-95 overflow-hidden">
            <span className="relative z-10 flex items-center gap-2">
              ➕ Agregar a mi equipo
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>
        </div>

        {/* Stats Grid Estilo "Cápsulas" */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: "💎", label: "Gemas", value: profile.gems },
            { icon: "🔥", label: "Racha", value: profile.streak?.current || 0 },
            { icon: "👑", label: "Liga", value: "Oro" },
          ].map((s) => (
            <div key={s.label} className="bg-white/80 border border-white rounded-[2.5rem] p-5 shadow-xl shadow-blue-900/5 hover:-translate-y-2 transition-transform duration-300">
              <div className="text-3xl mb-1 drop-shadow-md">{s.icon}</div>
              <div className="text-slate-900 font-black text-xl italic leading-none mb-1">{s.value}</div>
              <div className="text-slate-400 font-black text-[8px] uppercase tracking-tighter">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Logros: Estilo Papel Apilado */}
        <div className="bg-white/50 backdrop-blur-xl border border-white rounded-[3.5rem] p-8 shadow-2xl shadow-blue-900/5">
          <h2 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-6 text-center">Insignias Obtenidas</h2>
          <div className="space-y-3">
            {profile.achievements?.map((a, i) => (
              <div key={i} className="bg-white/90 border border-white rounded-[2rem] p-5 flex items-center gap-5 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all cursor-default">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white">
                  {a.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-slate-800 font-black text-xs uppercase italic leading-none mb-1">{a.name}</p>
                  <p className="text-slate-500 text-[9px] font-bold leading-tight">{a.description}</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Footer Minimalista 3D */}
      <footer className="mt-10 py-10 opacity-40 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-900/50">SEA • Evaluation System 2026</p>
      </footer>
    </div>
  );
}