import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

const STATUS_STYLES = {
  completed:   { bg: "bg-emerald-500", border: "border-emerald-400", icon: "✓", text: "text-white" },
  available:   { bg: "bg-violet-500",  border: "border-violet-400",  icon: "▶", text: "text-white" },
  in_progress: { bg: "bg-amber-500",   border: "border-amber-400",   icon: "…", text: "text-white" },
  locked:      { bg: "bg-indigo-800",  border: "border-indigo-700",  icon: "🔒", text: "text-indigo-500" },
};

export default function SubjectMap() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/subjects/${slug}`)
      .then(({ data }) => setSubject(data.data))
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-950">
        <Navbar />
        <div className="text-center text-indigo-400 py-20">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-950">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header de la materia */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/")} className="text-indigo-400 hover:text-white transition text-2xl">
            ←
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{subject.icon}</span>
              <h1 className="text-3xl font-black text-white">{subject.name}</h1>
            </div>
            <p className="text-indigo-300 mt-1">{subject.description}</p>
          </div>
        </div>

        {/* Unidades */}
        <div className="space-y-8">
          {subject.units?.map((unit) => (
            <UnitSection
              key={unit._id}
              unit={unit}
              subjectColor={subject.color}
              onLessonClick={(id) => navigate(`/lesson/${id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function UnitSection({ unit, subjectColor, onLessonClick }) {
  return (
    <div>
      {/* Header de unidad */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ backgroundColor: subjectColor + "20", borderColor: subjectColor + "40", border: "1px solid" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{unit.icon || "📖"}</span>
          <div>
            <h2 className="text-white font-bold">{unit.name}</h2>
            <p className="text-sm" style={{ color: subjectColor }}>
              {unit.completedLessons}/{unit.totalLessons} completadas
            </p>
          </div>
        </div>

        {/* Progreso de unidad */}
        <div className="w-full bg-indigo-900 rounded-full h-2 mt-3">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${unit.progressPercent || 0}%`,
              backgroundColor: subjectColor,
            }}
          />
        </div>
      </div>

      {/* Lecciones en zigzag */}
      <div className="flex flex-col items-center gap-3">
        {unit.lessons?.map((lesson, i) => (
          <LessonNode
            key={lesson._id}
            lesson={lesson}
            index={i}
            onClick={() => lesson.status !== "locked" && onLessonClick(lesson._id)}
          />
        ))}
      </div>
    </div>
  );
}

function LessonNode({ lesson, index, onClick }) {
  const style = STATUS_STYLES[lesson.status] || STATUS_STYLES.locked;
  const isLocked = lesson.status === "locked";

  // Zigzag: posiciones alternadas
  const offset = [0, 1, 2, 1][index % 4];
  const marginLeft = ["ml-0", "ml-16", "ml-32", "ml-16"][offset];

  return (
    <div className={`${marginLeft} transition-all`}>
      <button
        onClick={onClick}
        disabled={isLocked}
        className={`
          relative w-16 h-16 rounded-2xl border-2 ${style.bg} ${style.border}
          flex items-center justify-center text-xl font-bold
          transition-all hover:scale-110 active:scale-95
          disabled:cursor-not-allowed disabled:hover:scale-100
          shadow-lg
        `}
      >
        <span className={style.text}>{style.icon}</span>

        {/* Badge de score si completada */}
        {lesson.status === "completed" && lesson.bestScore === 100 && (
          <span className="absolute -top-2 -right-2 text-sm">⭐</span>
        )}
      </button>

      {/* Nombre de la lección */}
      <p className={`text-xs text-center mt-1 w-16 ${isLocked ? "text-indigo-600" : "text-indigo-300"}`}>
        {lesson.name}
      </p>
    </div>
  );
}
