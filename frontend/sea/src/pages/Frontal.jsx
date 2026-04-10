import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Rocket, BrainCircuit, Target, Sparkles, ArrowRight } from "lucide-react";

const FRONTAL_CSS = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(2deg); }
  }
  .sea-glass-nav {
    background: var(--nav-bg);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border-bottom: 1.5px solid var(--glass-border);
  }
  .animate-float { animation: float 6s ease-in-out infinite; }
  
  /* Ajuste para que el Splash Screen respete el tema */
  .splash-container {
    background: var(--bg-gradient);
    background-attachment: fixed;
  }
`;

export default function Frontal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 overflow-hidden splash-container text-[var(--text-primary)]">
        <style>{FRONTAL_CSS}</style>
        <div className="absolute inset-0 opacity-20 pointer-events-none">
           <span className="absolute top-[15%] left-[15%] text-5xl animate-bounce duration-1000">📐</span>
           <span className="absolute top-[70%] left-[20%] text-4xl animate-pulse">🧪</span>
           <span className="absolute top-[40%] right-[15%] text-5xl animate-bounce">♾️</span>
           <span className="absolute bottom-[20%] right-[20%] text-4xl animate-pulse">🧬</span>
        </div>

        <div className="relative flex flex-col items-center">
          <div className="bg-[var(--text-accent)] text-[var(--btn-text)] w-20 h-20 flex items-center justify-center rounded-[2rem] font-black text-4xl shadow-2xl rotate-[-5deg] animate-float">S</div>
          <h2 className="mt-6 text-2xl font-black tracking-[0.3em] uppercase italic text-[var(--text-primary)]">Sistema SEA</h2>
        </div>
        <div className="flex flex-col items-center gap-2">
           <div className="h-1.5 w-48 bg-[var(--progress-track)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--text-accent)] animate-pulse w-full"></div>
           </div>
           <p className="text-[var(--text-accent)] font-black text-[10px] tracking-[0.4em] uppercase">Sincronizando Conocimientos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen sea-profile relative flex flex-col overflow-x-hidden transition-colors duration-300" 
         style={{ background: "var(--bg-gradient)" }}>
      <style>{FRONTAL_CSS}</style>

      {/* NAVBAR SUPERIOR */}
      <nav className="fixed top-0 left-0 right-0 z-[100] sea-glass-nav px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-[var(--text-accent)] p-1.5 rounded-lg shadow-lg">
             <img src="/sealogo.png" className="w-8 brightness-0 invert" alt="SEA" />
          </div>
          <span className="font-black text-xl tracking-tighter text-[var(--landing-hero-text)]">SEA</span>
        </div>
        
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors">Ingresar</Link>
          <button 
            onClick={() => navigate("/register")}
            className="bg-[var(--btn-primary)] text-[var(--btn-text)] px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all border border-[var(--glass-border)]"
          >
            Crear Cuenta
          </button>
        </div>
      </nav>

      {/* LUCES DE FONDO (BLOBS) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[var(--deco-blob)] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[var(--deco-blob2)] blur-[120px] rounded-full" />
      </div>

      {/* HERO SECTION */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] mb-8 shadow-sm">
            <Sparkles size={16} className="text-[var(--text-accent)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)]">IA Generativa Adaptativa</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] mb-8 text-[var(--landing-hero-text)] uppercase italic">
            Tu mente es <span className="text-[var(--text-accent)]">única.</span> <br />
            Tu aprendizaje <span className="bg-gradient-to-r from-[var(--text-accent)] to-[#a855f7] bg-clip-text text-transparent">también.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-bold mb-12 leading-relaxed tracking-tight">
            SEA utiliza tecnología de vanguardia para adaptar cada examen a tu ritmo personal. Domina tus conocimientos con precisión quirúrgica.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate("/register")}
              className="group bg-[var(--btn-primary)] text-[var(--btn-text)] px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-3 border border-[var(--glass-border)]"
            >
              Comenzar ahora <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button 
              onClick={() => navigate("/login")}
              className="bg-[var(--glass-bg)] text-[var(--text-secondary)] px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-[var(--card-bg)] hover:text-[var(--text-primary)] transition-all border border-[var(--glass-border)]"
            >
              Ya tengo cuenta
            </button>
          </div>

          {/* FEATURES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
            <FeatureItem 
              icon={<BrainCircuit className="text-[var(--text-accent)]" />} 
              title="IA Adaptativa" 
              desc="Exámenes que evolucionan contigo." 
            />
            <FeatureItem 
              icon={<Target className="text-[var(--text-accent)]" />} 
              title="Enfoque Real" 
              desc="Simulacros de alta precisión." 
            />
            <FeatureItem 
              icon={<Rocket className="text-[var(--text-accent)]" />} 
              title="Progreso" 
              desc="Resultados visibles desde el primer día." 
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureItem({ icon, title, desc }) {
  return (
    <div className="flex flex-col items-center bg-[var(--glass-bg)] backdrop-blur-md p-8 rounded-[2.5rem] border border-[var(--glass-border)] shadow-sm hover:translate-y-[-5px] transition-all group">
      <div className="w-14 h-14 bg-[var(--card-bg)] rounded-2xl flex items-center justify-center shadow-lg mb-4 border border-[var(--glass-border)] group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-black text-xs uppercase tracking-widest text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase leading-tight">{desc}</p>
    </div>
  );
}