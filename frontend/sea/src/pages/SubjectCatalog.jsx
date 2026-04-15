import { useEffect, useState } from "react";
import { Search, Plus, Check, ArrowLeft, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../store/authStore";
import Navbar from "../components/Navbar";

export default function Catalog() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore(); // Asumiendo que setUser actualiza el estado global
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get("/subjects");
        setSubjects(res.data.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchSubjects();
  }, []);

  const handleToggle = async (subjectId) => {
    try {
      const res = await api.post("/users/toggle-favorite", { subjectId });
      setUser(res.data.data); // Sincronizamos el store con el nuevo array de favoritos
    } catch (err) { console.error(err); }
  };

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg-gradient)" }}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-10">
        <header className="mb-12">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors mb-4 font-black uppercase text-[10px] tracking-widest">
            <ArrowLeft size={14} /> Volver al Centro de Mando
          </button>
          <h1 className="text-5xl text-[var(--text-primary)] md:text-7xl font-black italic uppercase tracking-tighter mb-6">Archivo de Materias</h1>
          
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <input 
              type="text" 
              placeholder="Buscar misión..." 
              className="w-full bg-[--glass-bg] border-2 border-[--glass-border] rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:border-[var(--text-accent)] outline-none transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-40 bg-white/5 rounded-[2.5rem] animate-pulse" />)
          ) : (
            filteredSubjects.map(subject => {
              const isFavorite = user?.favoriteSubjects?.some(id => (id._id || id) === subject._id);
              return (
                <div key={subject._id} className="bg-[--card-bg] border-2 p-6 rounded-[2.5rem] flex flex-col group border-b-4" style={{ borderColor: subject.color }}>
                   <div className="flex justify-between items-start mb-4">
                      <span className="text-4xl p-3 bg-white/5 rounded-2xl">{subject.icon}</span>
                      <button 
                        onClick={() => handleToggle(subject._id)}
                        className={`p-3 rounded-2xl transition-all ${isFavorite ? 'bg-green-500 text-white' : 'bg-[var(--text-accent)] text-white hover:scale-110'}`}
                      >
                        {isFavorite ? <Check size={20} /> : <Plus size={20} />}
                      </button>
                   </div>
                   <h3 className="text-xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter mb-2">{subject.name}</h3>
                   <p className="text-xs font-bold text-[var(--text-secondary)] line-clamp-2 mb-4">{subject.description}</p>
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  );
}