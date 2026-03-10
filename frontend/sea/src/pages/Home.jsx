import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/subjects")
      .then(({ data }) => setSubjects(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-indigo-950">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Saludo */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">
            ¡Hola, {user?.username}! 👋
          </h1>
          <p className="text-indigo-300 mt-1">¿Qué querés aprender hoy?</p>
        </div>

        {/* Barra de XP / nivel */}
        {user && (
          <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-5 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold">Nivel {user.level}</span>
              <span className="text-indigo-400 text-sm">{user.xp} XP</span>
            </div>
            <div className="w-full bg-indigo-800 rounded-full h-3">
              <div
                className="bg-violet-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(100, (user.xp % 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Grid de materias */}
        {loading ? (
          <div className="text-center text-indigo-400 py-20">Cargando materias...</div>
        ) : subjects.length === 0 ? (
          <EmptySubjects />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject._id}
                subject={subject}
                onClick={() => navigate(`/subject/${subject.slug}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SubjectCard({ subject, onClick }) {
  const progress = subject.progressPercent || 0;

  return (
    <button
      onClick={onClick}
      className="bg-indigo-900 border border-indigo-700 hover:border-violet-500 rounded-2xl p-6 text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-4xl">{subject.icon || "📚"}</span>
        <span
          className="text-xs font-bold px-2 py-1 rounded-full"
          style={{ backgroundColor: subject.color + "30", color: subject.color }}
        >
          {subject.completedLessons || 0}/{subject.totalLessons || 0} lecciones
        </span>
      </div>

      <h3 className="text-white font-black text-xl mb-1 group-hover:text-violet-300 transition">
        {subject.name}
      </h3>
      <p className="text-indigo-400 text-sm mb-4 line-clamp-2">{subject.description}</p>

      {/* Barra de progreso */}
      <div className="w-full bg-indigo-800 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${progress}%`, backgroundColor: subject.color || "#8B5CF6" }}
        />
      </div>
      <p className="text-indigo-400 text-xs mt-1">{progress}% completado</p>
    </button>
  );
}

function EmptySubjects() {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">📭</div>
      <h3 className="text-white font-bold text-xl mb-2">No hay materias todavía</h3>
      <p className="text-indigo-400">Un administrador debe cargar las materias primero.</p>
    </div>
  );
}
