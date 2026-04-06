import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

// ─── Sistema de niveles ───────────────────────────────────────────────────────
const LEVELS = [
  { min: 1,   max: 4,   name: "Aprendiz",    emoji: "🌱" },
  { min: 5,   max: 9,   name: "Explorador",  emoji: "🔍" },
  { min: 10,  max: 19,  name: "Practicante", emoji: "⚡" },
  { min: 20,  max: 34,  name: "Competente",  emoji: "🎯" },
  { min: 35,  max: 49,  name: "Avanzado",    emoji: "🚀" },
  { min: 50,  max: 69,  name: "Experto",     emoji: "🏆" },
  { min: 70,  max: 89,  name: "Maestro",     emoji: "💎" },
  { min: 90,  max: 999, name: "Leyenda",     emoji: "👑" },
];

function getLevelInfo(levelInput) {
  const level = typeof levelInput === "object" ? (levelInput?.current ?? 1) : (levelInput ?? 1);
  let current = LEVELS[0];
  let next    = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (level >= LEVELS[i].min) {
      current = LEVELS[i];
      next    = LEVELS[i + 1] || LEVELS[LEVELS.length - 1];
    }
  }
  const range    = next.min - current.min;
  const progress = Math.min(Math.round(((level - current.min) / range) * 100), 100);
  return { ...current, progress, nextMin: next.min, nextName: next.name, numericLevel: level };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

function getDateLabel() {
  const raw = new Date().toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "long",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const SUBJECT_META = {
  tecnologia:  { color: "#2B7FE8", light: "rgba(43,127,232,0.12)",  icon: "💻" },
  matematicas: { color: "#7C6FE8", light: "rgba(124,111,232,0.12)", icon: "📐" },
  ciencias:    { color: "#2BA87E", light: "rgba(43,168,126,0.12)",  icon: "🔬" },
  humanidades: { color: "#E87C2B", light: "rgba(232,124,43,0.12)",  icon: "🌍" },
};

function getSubjectMeta(slug = "") {
  const key = slug?.toLowerCase().replace(/[^a-z]/g, "") || "";
  return SUBJECT_META[key] || SUBJECT_META.tecnologia;
}

// ─── CSS Global ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800;900&display=swap');
  .sea-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .sea-root { font-family: 'Nunito', sans-serif; }

  @keyframes sea-fadeUp  { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes sea-scaleIn { from { opacity: 0; transform: scale(.94); }       to { opacity: 1; transform: scale(1); } }
  @keyframes sea-shimmer { 0%,100% { opacity:.6; } 50% { opacity:1; } }
  @keyframes sea-barIn   { from { width: 0 !important; } }
  @keyframes sea-float   { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }

  .sea-subject-card {
    transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease;
  }
  .sea-subject-card:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 16px 40px rgba(43,127,232,.18) !important;
  }
  .sea-stat-card {
    transition: transform .2s cubic-bezier(.34,1.56,.64,1);
  }
  .sea-stat-card:hover {
    transform: translateY(-3px) scale(1.02);
  }
  .sea-cta-btn {
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .sea-cta-btn:hover {
    transform: scale(1.04);
    box-shadow: 0 8px 24px rgba(43,127,232,.45) !important;
  }
`;

// ─── Componente StatCard ──────────────────────────────────────────────────────
function StatCard({ emoji, value, label, color, delay = 0 }) {
  return (
    <div
      className="sea-stat-card"
      style={{
        background: "rgba(255,255,255,0.58)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1.5px solid rgba(255,255,255,0.75)",
        boxShadow: "0 6px 20px rgba(43,127,232,.09), inset 0 1px 0 rgba(255,255,255,.9)",
        borderRadius: 18,
        padding: "16px 14px",
        textAlign: "center",
        animation: `sea-fadeUp .45s ease both ${delay}s`,
        cursor: "default",
      }}
    >
      <div style={{ fontSize: 26, marginBottom: 6, animation: "sea-float 3s ease-in-out infinite" }}>{emoji}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: color || "#0F2547", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#7A9CC5", marginTop: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</div>
    </div>
  );
}

// ─── Componente SubjectCard ───────────────────────────────────────────────────
function SubjectCard({ subject, onClick, delay = 0 }) {
  const meta    = getSubjectMeta(subject.slug);
  const progress = subject.progress ?? Math.floor(Math.random() * 70 + 10); // fallback demo
  const total    = subject.topics?.length || subject.topicCount || 0;
  const done     = subject.completedTopics ?? 0;

  return (
    <div
      className="sea-subject-card"
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.58)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1.5px solid rgba(255,255,255,0.75)",
        boxShadow: "0 8px 24px rgba(43,127,232,.09), inset 0 1px 0 rgba(255,255,255,.9)",
        borderRadius: 22,
        padding: "18px 20px",
        cursor: "pointer",
        animation: `sea-fadeUp .45s ease both ${delay}s`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Icono */}
        <div style={{
          width: 50, height: 50, borderRadius: 15, flexShrink: 0,
          background: meta.light,
          border: `1.5px solid ${meta.color}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24,
        }}>
          {subject.icon || meta.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0F2547" }}>{subject.name}</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: meta.color }}>{progress}%</div>
          </div>

          {/* Barra de progreso */}
          <div style={{ height: 5, background: meta.light, borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              background: `linear-gradient(90deg, ${meta.color}, ${meta.color}CC)`,
              width: `${progress}%`,
              animation: "sea-barIn .8s ease both",
            }} />
          </div>

          <div style={{ fontSize: 10, fontWeight: 600, color: "#7A9CC5", marginTop: 5 }}>
            {total > 0 ? `${done}/${total} temas` : "Toca para explorar"}
          </div>
        </div>

        <div style={{ fontSize: 18, color: meta.color, fontWeight: 900, flexShrink: 0 }}>›</div>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function Home() {
  const navigate  = useNavigate();
  const { user, token, fetchMe } = useAuthStore();
  const [subjects, setSubjects]  = useState([]);
  const [loading,  setLoading]   = useState(true);

  const streakValue  = typeof user?.streak === "object" ? (user.streak.current ?? 0) : (user?.streak ?? 0);
  const xpValue      = user?.xp ?? user?.totalXp ?? 0;
  const examsValue   = user?.examsCompleted ?? user?.totalExams ?? 0;
  const bestStreak   = user?.bestStreak ?? streakValue;
  const lvl          = getLevelInfo(user?.level);
  const greeting     = getGreeting();
  const dateStr      = getDateLabel();

  useEffect(() => { if (token) fetchMe(); }, [token, fetchMe]);

  useEffect(() => {
    api.get("/subjects")
      .then(({ data }) => setSubjects(data.data || []))
      .catch((e) => console.error("Error cargando materias:", e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div
        className="sea-root"
        style={{
          minHeight: "100vh",
          background: "linear-gradient(145deg, #C8E6FF 0%, #A8D4FF 45%, #B8CBFF 100%)",
          paddingTop: 80,
        }}
      >
        <Navbar />

        <div style={{ maxWidth: 660, margin: "0 auto", padding: "28px 20px 80px" }}>

          {/* ── HERO ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: 22, animation: "sea-fadeUp .4s ease both .06s" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#7A9CC5", marginBottom: 6, letterSpacing: ".8px" }}>
              {dateStr}
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#0F2547", lineHeight: 1.2 }}>
              <span style={{ color: "#7A9CC5", fontWeight: 600 }}>{greeting}, </span>
              {user?.username || "Estudiante"}.<br />
              ¿Listo para el reto?
            </div>
          </div>

          {/* ── CARD DE NIVEL ────────────────────────────────────── */}
          <div style={{
            background: "linear-gradient(135deg, #2B7FE8 0%, #5B9BFF 60%, #7BB8FF 100%)",
            borderRadius: 22, padding: "20px 24px", marginBottom: 20,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 14px 36px rgba(43,127,232,.35)",
            animation: "sea-scaleIn .45s ease both .12s",
            position: "relative", overflow: "hidden",
          }}>
            {/* Decoración fondo */}
            <div style={{
              position: "absolute", right: -20, top: -20,
              width: 120, height: 120, borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
            }} />
            <div style={{
              position: "absolute", right: 40, bottom: -30,
              width: 80, height: 80, borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
            }} />

            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,.65)", marginBottom: 4, letterSpacing: ".8px" }}>
                Rango actual
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>
                {lvl.emoji} {lvl.name}
              </div>
              <div style={{ marginTop: 10, width: 190, height: 6, background: "rgba(255,255,255,.2)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: "linear-gradient(90deg, #fff, rgba(255,255,255,.7))",
                  width: `${lvl.progress}%`,
                  animation: "sea-barIn .9s ease both .3s",
                  boxShadow: "0 0 8px rgba(255,255,255,.6)",
                }} />
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.55)", marginTop: 5, fontWeight: 600 }}>
                Siguiente: {lvl.nextName} · Nv. {lvl.nextMin}
              </div>
            </div>

            <div style={{ textAlign: "right", position: "relative" }}>
              <div style={{ fontSize: 46, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{lvl.numericLevel}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.55)" }}>NIVEL</div>
            </div>
          </div>

          {/* ── STATS ────────────────────────────────────────────── */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10,
            marginBottom: 24,
          }}>
            <StatCard emoji="⚡" value={xpValue.toLocaleString("es-CO")} label="XP Total"    color="#2B7FE8" delay={0.18} />
            <StatCard emoji="✅" value={examsValue}                        label="Exámenes"   color="#2BA87E" delay={0.22} />
            <StatCard emoji="🏅" value={bestStreak}                        label="Mejor racha" color="#E87C2B" delay={0.26} />
          </div>

          {/* ── SECCIÓN MATERIAS ─────────────────────────────────── */}
          <div style={{ marginBottom: 14, animation: "sea-fadeUp .4s ease both .28s" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0F2547", marginBottom: 12 }}>
              📚 Materias disponibles
            </div>

            {loading ? (
              /* Skeleton loader */
              [0, 1, 2].map((i) => (
                <div key={i} style={{
                  height: 78, borderRadius: 22, marginBottom: 10,
                  background: "rgba(255,255,255,0.4)",
                  animation: "sea-shimmer 1.4s ease infinite",
                  animationDelay: `${i * .15}s`,
                }} />
              ))
            ) : subjects.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "40px 20px",
                background: "rgba(255,255,255,0.45)",
                borderRadius: 22, color: "#7A9CC5", fontWeight: 600, fontSize: 14,
              }}>
                😕 No hay materias disponibles aún.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {subjects.map((s, idx) => (
                  <SubjectCard
                    key={s._id}
                    subject={s}
                    delay={0.3 + idx * 0.06}
                    onClick={() => navigate(`/subject/${s.slug}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── CTA BOTÓN ────────────────────────────────────────── */}
          <div style={{ marginTop: 28, animation: "sea-fadeUp .45s ease both .5s" }}>
            <button
              className="sea-cta-btn"
              onClick={() => subjects.length > 0 && navigate(`/subject/${subjects[0]?.slug}`)}
              style={{
                width: "100%", padding: "16px 0",
                background: "linear-gradient(135deg, #2B7FE8, #6BAAFF)",
                border: "none", borderRadius: 18,
                fontSize: 15, fontWeight: 800, color: "#fff",
                cursor: "pointer", letterSpacing: ".3px",
                boxShadow: "0 10px 28px rgba(43,127,232,.35)",
              }}
            >
              🚀 Comenzar examen ahora
            </button>
          </div>

        </div>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <footer style={{
          textAlign: "center", padding: "16px 20px",
          borderTop: "1px solid rgba(255,255,255,0.5)",
          background: "rgba(255,255,255,0.25)",
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#7A9CC5" }}>
            SEA · Sistema de Evaluación y Aprendizaje · SENA ADSO
          </div>
          <div style={{ fontSize: 10, color: "#A8C0DC", marginTop: 2 }}>
            v1.0.0 — {new Date().getFullYear()}
          </div>
        </footer>

      </div>
    </>
  );
}