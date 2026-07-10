// frontend/sea/src/pages/admin/LessonsManagement.jsx
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, ChevronDown, ChevronUp, Filter } from "lucide-react";
import api from "../../api/axios";
import CustomSelect from "../../components/ui/CustomSelect";
import { validarNombre, NOMBRE_ERROR, NOMBRE_REGEX } from "../../utils/validators";
import toast from 'react-hot-toast';
import { useConfirm } from "../../context/ConfirmContext"; // Importa el hook useConfirm

const LESSONS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  .lm-page { font-family: 'Nunito', sans-serif; }

  .lm-card {
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 1.5rem;
    overflow: hidden;
  }

  .lm-filter-bar {
    background: var(--glass-bg);
    border: 1.5px solid var(--glass-border);
    border-radius: 1.5rem;
    padding: 1rem;
    backdrop-filter: blur(10px);
  }

  /* Lesson Card - Mobile */
  .lm-lesson-card {
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 1.25rem;
    transition: all 0.2s ease;
  }
  .lm-lesson-card:active {
    transform: scale(0.99);
  }

  .lm-expand-icon {
    transition: transform 0.2s ease;
  }
  .lm-expand-icon.expanded {
    transform: rotate(180deg);
  }

  /* Difficulty badges */
  .lm-diff-easy   { background: var(--correct-bg);   color: var(--correct);    border: 1px solid color-mix(in srgb, var(--correct) 25%, transparent); }
  .lm-diff-medium { background: color-mix(in srgb, var(--text-alternative-a) 12%, transparent); color: var(--text-alternative-a); border: 1px solid color-mix(in srgb, var(--text-alternative-a) 25%, transparent); }
  .lm-diff-hard   { background: var(--incorrect-bg); color: var(--incorrect);  border: 1px solid color-mix(in srgb, var(--incorrect) 25%, transparent); }
  .lm-diff-badge  { font-size: 0.65rem; font-weight: 800; padding: 0.2rem 0.65rem; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.06em; }

  /* Modal - Bottom sheet */
  .lm-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 1rem;
  }
  @media (min-width: 640px) {
    .lm-modal-overlay {
      align-items: center;
    }
  }
  .lm-modal {
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 1.5rem;
    width: 100%;
    max-width: 32rem;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 24px 60px var(--glass-shadow);
    position: relative;
  }
  @media (min-width: 640px) {
    .lm-modal {
      border-radius: 2rem;
    }
  }

  .lm-input {
    width: 100%;
    background: var(--glass-bg-small);
    border: 1.5px solid var(--card-border);
    border-radius: 1rem;
    padding: 0.75rem 1rem;
    color: var(--text-primary);
    font-family: 'Nunito', sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    transition: border-color 0.2s;
    outline: none;
  }
  .lm-input:focus {
    border-color: var(--text-accent);
    background: color-mix(in srgb, var(--text-accent) 4%, var(--card-bg));
  }
  .lm-input::placeholder {
    color: var(--text-muted);
  }
  .lm-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .lm-label {
    font-size: 0.7rem;
    font-weight: 800;
    color: var(--text-secondary);
    display: block;
    margin-bottom: 0.4rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .lm-btn-primary {
    flex: 1;
    background: var(--btn-primary);
    color: var(--btn-text);
    border: none;
    border-radius: 1rem;
    padding: 0.9rem;
    font-weight: 800;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .lm-btn-primary:active {
    transform: scale(0.98);
    opacity: 0.9;
  }

  .lm-btn-ghost {
    flex: 1;
    background: var(--glass-bg);
    color: var(--text-secondary);
    border: 1.5px solid var(--card-border);
    border-radius: 1rem;
    padding: 0.9rem;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .lm-btn-ghost:active {
    transform: scale(0.98);
  }

  .lm-btn-icon {
    background: transparent;
    border: 1.5px solid transparent;
    border-radius: 0.75rem;
    padding: 0.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all 0.18s;
    display: inline-flex;
    align-items: center;
  }
  .lm-btn-icon:active {
    transform: scale(0.92);
  }
  .lm-btn-icon.danger:active {
    background: var(--incorrect-bg);
    color: var(--incorrect);
  }

  .lm-new-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--text-alternative-b);
    color: white;
    border: none;
    border-radius: 1rem;
    padding: 0.7rem 1.2rem;
    font-weight: 800;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .lm-new-btn:active {
    transform: scale(0.96);
  }

  .lm-close-btn {
    position: sticky;
    top: 0.75rem;
    right: 0.75rem;
    float: right;
    background: var(--glass-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 0.75rem;
    padding: 0.4rem;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all 0.18s;
    display: flex;
    z-index: 10;
  }
  .lm-close-btn:active {
    transform: scale(0.92);
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* Paginación */
  .lm-page-nav {
    display: flex; align-items: center; justify-content: center;
    gap: 0.35rem; flex-wrap: wrap;
  }
  .lm-page-btn {
    background: var(--card-bg); color: var(--text-secondary);
    border: 1.5px solid var(--card-border); border-radius: 0.85rem;
    padding: 0.55rem 1rem; font-weight: 700; font-size: 0.8rem; cursor: pointer;
    transition: all 0.2s; font-family: 'Nunito', sans-serif;
  }
  .lm-page-btn:active:not(:disabled) { transform: scale(0.96); }
  .lm-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .lm-page-num {
    min-width: 2.35rem; height: 2.35rem; padding: 0 0.4rem;
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--card-bg); color: var(--text-secondary);
    border: 1.5px solid var(--card-border); border-radius: 0.75rem;
    font-weight: 700; font-size: 0.8rem; cursor: pointer;
    transition: all 0.2s; font-family: 'Nunito', sans-serif;
  }
  .lm-page-num:active:not(:disabled):not(.active) { transform: scale(0.94); }
  .lm-page-num.active {
    background: var(--text-alternative-b); color: white; border-color: var(--text-alternative-b); cursor: default;
  }
  .lm-page-num:disabled { opacity: 0.3; cursor: not-allowed; }
  .lm-page-ellipsis {
    min-width: 1.2rem; text-align: center; color: var(--text-muted);
    font-weight: 700; font-size: 0.8rem; user-select: none;
  }
  .lm-page-jump {
    display: flex; align-items: center; justify-content: center; gap: 0.4rem;
    font-size: 0.75rem; font-weight: 700; color: var(--text-secondary);
  }
  .lm-page-jump input {
    width: 3.25rem; text-align: center;
    background: var(--card-bg); border: 1.5px solid var(--card-border);
    border-radius: 0.65rem; padding: 0.4rem 0.25rem;
    color: var(--text-primary); font-family: 'Nunito', sans-serif;
    font-weight: 700; font-size: 0.8rem; outline: none; transition: border-color 0.2s;
  }
  .lm-page-jump input:focus { border-color: var(--text-accent); }
  .lm-page-jump input::-webkit-outer-spin-button,
  .lm-page-jump input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
`;

const getDiffClass = (diff) => {
  if (diff === "easy" || diff === "beginner") return "lm-diff-easy";
  if (diff === "medium" || diff === "intermediate") return "lm-diff-medium";
  return "lm-diff-hard";
};

const getDiffLabel = (diff) => {
  if (diff === "easy") return "Fácil";
  if (diff === "medium") return "Medio";
  return "Difícil";
};

const LESSONS_PER_PAGE = 20;

// Calcula qué números de página mostrar, colapsando los intermedios con "…"
function getPageRange(current, total, siblings = 1) {
  if (total <= 1) return [1];
  const range = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - siblings && i <= current + siblings)) {
      range.push(i);
    }
  }
  const withDots = [];
  let last = null;
  for (const i of range) {
    if (last !== null) {
      if (i - last === 2) withDots.push(last + 1);
      else if (i - last > 2) withDots.push("…");
    }
    withDots.push(i);
    last = i;
  }
  return withDots;
}

export default function LessonsManagement() {
  const [lessons, setLessons] = useState([]);
  const [units, setUnits] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);
  const confirm = useConfirm(); // ✅ Hook movido al inicio (sin condiciones)

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [pageJumpValue, setPageJumpValue] = useState("");

  const [form, setForm] = useState({
    unit: "", name: "", order: 1, xpReward: 10,
    questionCount: 6, difficulty: "easy", aiTopicHint: "", description: ""
  });

  const fetchData = async () => {
    try {
      const [lessonsRes, unitsRes, subjectsRes] = await Promise.all([
        api.get("/admin/lessons"),
        api.get("/admin/units"),
        api.get("/admin/subjects")
      ]);
      setLessons(lessonsRes.data.data || []);
      setUnits(unitsRes.data.data || []);
      setSubjects(subjectsRes.data.data || []);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredLessons = lessons.filter((lesson) => {
    const unitId = lesson.unit?._id || lesson.unit;
    let subjectId = null;
    if (lesson.unit && typeof lesson.unit === "object") {
      subjectId = lesson.unit.subject?._id || lesson.unit.subject;
    }
    const matchesSearch = !search || lesson.name.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = !selectedSubject || String(subjectId) === String(selectedSubject);
    const matchesUnit = !selectedUnit || String(unitId) === String(selectedUnit);
    return matchesSearch && matchesSubject && matchesUnit;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / LESSONS_PER_PAGE));
  const paginatedLessons = filteredLessons.slice((page - 1) * LESSONS_PER_PAGE, page * LESSONS_PER_PAGE);

  // Si el filtro cambia (o se elimina una lección), vuelve a la página 1
  // o recorta a la última página válida para no quedar en una vacía.
  useEffect(() => { setPage(1); }, [search, selectedSubject, selectedUnit]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const goToPage = (n) => setPage(Math.min(Math.max(1, n), totalPages));

  const handlePageJumpSubmit = (e) => {
    e.preventDefault();
    const n = parseInt(pageJumpValue, 10);
    if (!Number.isNaN(n)) goToPage(n);
    setPageJumpValue("");
  };

  const openModal = (lesson = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setForm({
        unit: String(lesson.unit?._id || lesson.unit),
        name: lesson.name, order: lesson.order,
        xpReward: lesson.xpReward || 10, questionCount: lesson.questionCount || 6,
        difficulty: lesson.difficulty || "easy",
        aiTopicHint: lesson.aiTopicHint || "", description: lesson.description || ""
      });
    } else {
      setEditingLesson(null);
      const defaultUnit = selectedUnit || units[0]?._id || "";
      const lessonsInUnit = lessons.filter(l => String(l.unit?._id || l.unit) === String(defaultUnit));
      const nextOrder = lessonsInUnit.length > 0 ? Math.max(...lessonsInUnit.map(l => l.order)) + 1 : 1;
      setForm({ unit: defaultUnit, name: "", order: nextOrder, xpReward: 10, questionCount: 6, difficulty: "easy", aiTopicHint: "", description: "" });
    }
    setShowModal(true);
  };

  const saveLesson = async (e) => {
    e.preventDefault();
    if (!validarNombre(form.name)) {
      toast.error(NOMBRE_ERROR);
      return;
    }
    try {
      if (editingLesson) {
        await api.put(`/admin/lessons/${editingLesson._id}`, form);
      } else {
        await api.post(`/admin/units/${form.unit}/lessons`, form);
      }
      setShowModal(false);
      fetchData();
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
    } catch (err) {
      if (err.response?.data?.message?.includes("duplicate key")) {
        toast.error("Ya existe una lección con ese orden en la unidad.");
      } else {
        toast.error(err.response?.data?.message || "Error al guardar la lección");
      }
    }
  };

  const deleteLesson = async (id) => {
    if (!(await confirm({ message: "¿Eliminar esta lección?", danger: true, confirmText: "Eliminar" }))) return;
    try {
      await api.delete(`/admin/lessons/${id}`);
      fetchData();
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
    } catch { 
      toast.error("Error al eliminar la lección"); 
    }
  };

  const getUnitName = (unitId) => {
    const unit = units.find(u => u._id === unitId);
    return unit?.name || "Unidad desconocida";
  };

  const resetFilters = () => {
    setSelectedSubject("");
    setSelectedUnit("");
    setSearch("");
    setShowFilters(false);
  };

  if (loading) {
    return (
      <div className="lm-page flex items-center justify-center min-h-[60vh]">
        <style>{LESSONS_CSS}</style>
        <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--text-accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="lm-page space-y-5 pb-20">
      <style>{LESSONS_CSS}</style>

      {/* Header con botón nueva lección */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight" style={{ color: "var(--text-primary)" }}>
            Lecciones
          </h1>
          <p className="text-xs sm:text-sm font-semibold mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {filteredLessons.length} lecciones
          </p>
        </div>
        <button className="lm-new-btn" onClick={() => openModal()}>
          <Plus size={16} /> <span className="hidden sm:inline">Nueva Lección</span>
        </button>
      </div>

      {/* Botón toggle filtros */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center justify-between w-full p-3 rounded-xl"
        style={{ background: "var(--glass-bg)", border: "1.5px solid var(--glass-border)" }}
      >
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: "var(--text-accent)" }} />
          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Filtros</span>
          {(selectedSubject || selectedUnit || search) && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--text-accent)", color: "white" }}>
              Activos
            </span>
          )}
        </div>
        <ChevronDown size={16} className={`lm-expand-icon ${showFilters ? 'expanded' : ''}`} />
      </button>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="lm-filter-bar space-y-3">
          <div>
            <label className="lm-label text-[10px]">Materia</label>
            <CustomSelect
              value={selectedSubject}
              onChange={val => { setSelectedSubject(val); setSelectedUnit(""); }}
              options={subjects}
              placeholder="Todas las materias"
              getOptionValue={opt => opt._id}
              getOptionLabel={opt => opt.name}
            />
          </div>
          <div>
            <label className="lm-label text-[10px]">Unidad</label>
            <CustomSelect
              value={selectedUnit}
              onChange={setSelectedUnit}
              options={units.filter(u => !selectedSubject || String(u.subject?._id || u.subject) === String(selectedSubject))}
              placeholder="Todas las unidades"
              getOptionValue={opt => opt._id}
              getOptionLabel={opt => opt.name}
            />
          </div>
          <div>
            <label className="lm-label text-[10px]">Buscar</label>
            <input className="lm-input" type="text" placeholder="Nombre de la lección..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={resetFilters} className="text-xs font-bold py-2" style={{ color: "var(--text-accent)" }}>
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Lista de Lecciones - Cards */}
      <div className="space-y-3">
        {filteredLessons.length === 0 ? (
          <div className="lm-card p-8 text-center">
            <p className="font-bold" style={{ color: "var(--text-secondary)" }}>
              No se encontraron lecciones
            </p>
            <button 
              onClick={resetFilters}
              className="mt-3 text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--text-accent)" }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          paginatedLessons.map(lesson => (
            <div key={lesson._id} className="lm-lesson-card">
              <div className="p-4">
                {/* Header con nombre y acciones */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-base truncate" style={{ color: "var(--text-primary)" }}>
                      {lesson.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {getUnitName(lesson.unit?._id || lesson.unit)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button className="lm-btn-icon" onClick={() => openModal(lesson)}>
                      <Edit size={16} />
                    </button>
                    <button className="lm-btn-icon danger" onClick={() => deleteLesson(lesson._id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{ borderColor: "var(--card-border)" }}>
                  <div className="flex items-center gap-2">
                    <span className={`lm-diff-badge ${getDiffClass(lesson.difficulty)}`}>
                      {getDiffLabel(lesson.difficulty)}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Orden: {lesson.order}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: "var(--text-accent)" }}>
                        {lesson.questionCount} preguntas
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {lesson.xpReward} XP
                      </p>
                    </div>
                    <button
                      onClick={() => setExpandedLesson(expandedLesson === lesson._id ? null : lesson._id)}
                      className="p-1.5 rounded-lg hover:bg-white/10"
                    >
                      <ChevronDown size={16} className={`lm-expand-icon ${expandedLesson === lesson._id ? 'expanded' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Contenido expandible */}
                {expandedLesson === lesson._id && (
                  <div className="mt-3 pt-2 border-t space-y-2" style={{ borderColor: "var(--card-border)" }}>
                    {lesson.aiTopicHint && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--text-accent)" }}>
                          Hint IA
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                          {lesson.aiTopicHint}
                        </p>
                      </div>
                    )}
                    {lesson.description && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--text-accent)" }}>
                          Descripción
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                          {lesson.description}
                        </p>
                      </div>
                    )}
                    {!lesson.aiTopicHint && !lesson.description && (
                      <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                        Sin información adicional
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="lm-page-nav">
            <button className="lm-page-btn" disabled={page === 1} onClick={() => goToPage(1)}>«</button>
            <button className="lm-page-btn" disabled={page === 1} onClick={() => goToPage(page - 1)}>Anterior</button>

            {getPageRange(page, totalPages).map((n, idx) =>
              n === "…" ? (
                <span key={`dots-${idx}`} className="lm-page-ellipsis">…</span>
              ) : (
                <button
                  key={n}
                  className={`lm-page-num ${n === page ? "active" : ""}`}
                  onClick={() => goToPage(n)}
                  aria-current={n === page ? "page" : undefined}
                >
                  {n}
                </button>
              )
            )}

            <button className="lm-page-btn" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>Siguiente</button>
            <button className="lm-page-btn" disabled={page >= totalPages} onClick={() => goToPage(totalPages)}>»</button>
          </div>

          <form className="lm-page-jump" onSubmit={handlePageJumpSubmit}>
            <span>Ir a página</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={pageJumpValue}
              onChange={e => setPageJumpValue(e.target.value)}
              placeholder={String(page)}
            />
            <span>/ {totalPages}</span>
          </form>
        </div>
      )}

      {/* Modal - Bottom sheet */}
      {showModal && (
        <div className="lm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="lm-modal" onClick={e => e.stopPropagation()}>
            <button className="lm-close-btn" onClick={() => setShowModal(false)}>
              <X size={18} />
            </button>

            <div className="p-5 pt-12">
              <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight mb-5" style={{ color: "var(--text-primary)" }}>
                {editingLesson ? "Editar Lección" : "Nueva Lección"}
              </h2>

              <form onSubmit={saveLesson} className="space-y-4">
                <div>
                  <label className="lm-label">Unidad</label>
                  <CustomSelect
                    value={form.unit}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || NOMBRE_REGEX.test(val)) setForm({ ...form, name: val });
                    }}
                    options={units}
                    placeholder="Selecciona una unidad"
                    getOptionValue={opt => opt._id}
                    getOptionLabel={opt => opt.name}
                  />
                </div>

                <div>
                  <label className="lm-label">Nombre</label>
                  <input className="lm-input" type="text" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: Introducción al Álgebra" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="lm-label">Orden</label>
                    <input className="lm-input" type="number" value={form.order}
                      onChange={e => setForm({ ...form, order: parseInt(e.target.value) })} min="1" />
                  </div>
                  <div>
                    <label className="lm-label">Dificultad</label>
                    <CustomSelect
                      value={form.difficulty}
                      onChange={val => setForm({ ...form, difficulty: val })}
                      options={[
                        { value: "easy", label: "Fácil" },
                        { value: "medium", label: "Medio" },
                        { value: "hard", label: "Difícil" },
                      ]}
                      getOptionValue={opt => opt.value}
                      getOptionLabel={opt => opt.label}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="lm-label">Preguntas</label>
                    <input className="lm-input" type="number" value={form.questionCount}
                      onChange={e => setForm({ ...form, questionCount: parseInt(e.target.value) })} min="1" max="20" />
                  </div>
                  <div>
                    <label className="lm-label">XP Recompensa</label>
                    <input className="lm-input" type="number" value={form.xpReward}
                      onChange={e => setForm({ ...form, xpReward: parseInt(e.target.value) })} min="0" />
                  </div>
                </div>

                <div>
                  <label className="lm-label">Hint para IA (opcional)</label>
                  <textarea
                    className="lm-input resize-none"
                    rows={2}
                    value={form.aiTopicHint}
                    onChange={e => setForm({ ...form, aiTopicHint: e.target.value })}
                    placeholder="Ej: Sumas simples con números del 1 al 9"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" className="lm-btn-ghost" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="lm-btn-primary">
                    {editingLesson ? "Guardar" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}