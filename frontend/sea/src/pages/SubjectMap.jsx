import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import useAuthStore from "../store/authStore"; // ← agregá este import

const REQUIRED_COMPLETIONS = 4;

const STATUS_STYLES = {
  completed:   { bg: "bg-emerald-500", border: "border-emerald-400", icon: "✓", text: "text-white" },
  available:   { bg: "bg-violet-500",  border: "border-violet-400",  icon: "▶", text: "text-white" },
  in_progress: { bg: "bg-amber-500",   border: "border-amber-400",   icon: "…", text: "text-white" },
  locked:      { bg: "bg-indigo-800",  border: "border-indigo-700",  icon: "🔒", text: "text-indigo-500" },
  no_hearts:   { bg: "bg-red-900",     border: "border-red-800",     icon: "💔", text: "text-red-600" },
};

export default function SubjectMap() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore(); // ← agregá esto
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasHearts = (user?.hearts?.current ?? 1) > 0; // ← agregá esto

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
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/")} className="text-indigo-400 hover:text-white transition text-2xl">←</button>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{subject.icon}</span>
              <h1 className="text-3xl font-black text-white">{subject.name}</h1>
            </div>
            <p className="text-indigo-300 mt-1">{subject.description}</p>
          </div>
        </div>

        {/* Banner sin corazones */}
        {!hasHearts && (
          <div className="bg-red-950 border border-red-800 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">💔</span>
            <div>
              <p className="text-red-300 font-bold text-sm">Sin corazones</p>
              <p className="text-red-400/70 text-xs">Esperá a que se recarguen o usá 50💎 desde el menú superior.</p>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {subject.units?.map((unit) => (
            <UnitSection
              key={unit._id}
              unit={unit}
              subjectColor={subject.color}
              hasHearts={hasHearts} // ← pasá esto
              onLessonClick={(id) => navigate(`/lesson/${id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function UnitSection({ unit, subjectColor, hasHearts, onLessonClick }) {
  const [collapsed, setCollapsed] = useState(false); // ← agregá esto

  return (
    <div>
      <div
        onClick={() => setCollapsed((c) => !c)} // ← hacerlo clickeable
        className="rounded-xl p-4 mb-4 cursor-pointer hover:opacity-90 transition-opacity select-none"
        style={{ backgroundColor: subjectColor + "20", borderColor: subjectColor + "40", border: "1px solid" }}
      >
        <div className="flex items-center justify-between"> {/* ← agregá justify-between */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{unit.icon || "📖"}</span>
            <div>
              <h2 className="text-white font-bold">{unit.name}</h2>
              <p className="text-sm" style={{ color: subjectColor }}>
                {unit.completedLessons}/{unit.totalLessons} completadas
              </p>
            </div>
          </div>
          {/* Indicador de colapso */}
          <span className="text-indigo-400 text-sm transition-transform duration-200"
            style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", display: "inline-block" }}>
            ▼
          </span>
        </div>
        <div className="w-full bg-indigo-900 rounded-full h-2 mt-3">
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${unit.progressPercent || 0}%`, backgroundColor: subjectColor }}
          />
        </div>
      </div>

      {/* Contenido colapsable */}
      {!collapsed && (
        <>
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="flex gap-1">
              {Array.from({ length: REQUIRED_COMPLETIONS }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-blue-500" />
              ))}
            </div>
            <p className="text-indigo-500 text-xs">Cada lección requiere {REQUIRED_COMPLETIONS} completaciones para desbloquear la siguiente</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            {unit.lessons?.map((lesson, i) => (
              <LessonNode
                key={lesson._id}
                lesson={lesson}
                index={i}
                hasHearts={hasHearts}
                onClick={() => onLessonClick(lesson._id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LessonNode({ lesson, index, hasHearts, onClick }) {
  const noHearts = !hasHearts && lesson.status !== "locked"; // bloqueado por corazones
  const style = noHearts
    ? STATUS_STYLES.no_hearts
    : STATUS_STYLES[lesson.status] || STATUS_STYLES.locked;
  const isLocked = (lesson.status === "locked" && index !== 0) || noHearts;
  const completions = lesson.completions || 0;
  const isFullyComplete = completions >= REQUIRED_COMPLETIONS;

  const offset = [0, 1, 2, 1][index % 4];
  const marginLeft = ["ml-0", "ml-16", "ml-32", "ml-16"][offset];

  return (
    <div className={`${marginLeft} transition-all flex flex-col items-center`}>
      {/* Botón principal */}
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

        {/* Estrella si puntaje perfecto */}
        {lesson.bestScore === 100 && completions > 0 && (
          <span className="absolute -top-2 -right-2 text-sm">⭐</span>
        )}
      </button>

      {/* Nombre */}
      <p className={`text-xs text-center mt-1 w-24 leading-tight ${isLocked ? "text-indigo-600" : "text-indigo-300"}`}>
        {lesson.name}
      </p>

      {/* Indicador de completaciones — solo si está disponible o en progreso */}
      {!isLocked && (
        <div className="mt-2 flex flex-col items-center gap-1">
          <div className="flex gap-1">
            {Array.from({ length: REQUIRED_COMPLETIONS }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i < completions
                    ? isFullyComplete ? "bg-emerald-400" : "bg-violet-400"
                    : "bg-indigo-700"
                }`}
              />
            ))}
          </div>
          {!isFullyComplete && completions > 0 && (
            <p className="text-indigo-500 text-xs">{completions}/{REQUIRED_COMPLETIONS}</p>
          )}
          {isFullyComplete && (
            <p className="text-emerald-400 text-xs font-bold">✓ Completa</p>
          )}
        </div>
      )}
    </div>
  );
}