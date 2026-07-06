// frontend/sea/src/pages/admin/QuestionsManagement.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Edit, Trash2, CheckCircle, ShieldAlert, XCircle, Sparkles, Plus, RotateCcw } from "lucide-react";
import api from "../../api/axios";
import QuestionModal from "../../components/admin/QuestionModal";
import CustomSelect from "../../components/ui/CustomSelect";

const QUESTIONS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  .qm-page { font-family: 'Nunito', sans-serif; }

  .qm-card {
    background: var(--card-bg);
    border: 1.5px solid var(--glass-border);
    border-radius: 1.5rem; overflow: hidden;
  }

  .qm-filter-bar {
    background: var(--glass-bg);
    border: 1.5px solid var(--glass-border);
    border-radius: 1.5rem; padding: 1.5rem;
    backdrop-filter: blur(10px);
  }

  .qm-input {
    width: 100%;
    background: var(--glass-bg-small);
    border: 1.5px solid var(--glass-border); border-radius: 1rem;
    padding: 0.75rem 1.25rem;
    color: var(--text-primary); font-family: 'Nunito', sans-serif;
    font-weight: 600; font-size: 0.875rem;
    transition: border-color 0.2s; outline: none;
  }
  .qm-input:focus { border-color: var(--text-accent); }
  .qm-input::placeholder { color: var(--text-muted); }
  .qm-input:disabled { opacity: 0.45; cursor: not-allowed; }

  .qm-search-wrap { position: relative; flex: 1; }
  .qm-search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
  .qm-search-input {
    width: 100%; padding-left: 2.75rem;
    background: var(--card-bg); border: 1.5px solid var(--glass-border);
    border-radius: 1rem; padding-top: 0.75rem; padding-right: 1rem; padding-bottom: 0.75rem; padding-left: 2.75rem;
    color: var(--text-primary); font-family: 'Nunito', sans-serif;
    font-weight: 600; font-size: 0.875rem; outline: none; transition: border-color 0.2s;
  }
  .qm-search-input:focus { border-color: var(--text-accent); }
  .qm-search-input::placeholder { color: var(--text-muted); }

  .qm-label {
    font-size: 0.65rem; font-weight: 800; color: var(--text-secondary);
    display: block; margin-bottom: 0.35rem;
    text-transform: uppercase; letter-spacing: 0.1em;
  }

  .qm-table-head { background: var(--glass-bg); border-bottom: 1.5px solid var(--glass-border); }
  .qm-table-head th {
    color: var(--text-secondary); font-weight: 800;
    font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em;
    padding: 1rem 1.5rem;
  }

  .qm-table-row { border-bottom: 1px solid var(--glass-border); transition: background 0.18s; }
  .qm-table-row:last-child { border-bottom: none; }
  .qm-table-row:hover { background: color-mix(in srgb, var(--text-accent) 5%, transparent); }
  .qm-table-row td { padding: 1rem 1.5rem; vertical-align: middle; }

  /* Difficulty dots */
  .qm-diff-easy   { color: var(--correct); }
  .qm-diff-medium { color: var(--text-alternative-a); }
  .qm-diff-hard   { color: var(--incorrect); }

  /* Type badge */
  .qm-type-badge {
    font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;
    padding: 0.2rem 0.55rem; border-radius: 0.5rem;
    background: var(--glass-bg); color: var(--text-secondary); border: 1px solid var(--glass-border);
  }

  /* AI badge */
  .qm-ai-badge {
    display: inline-flex; align-items: center; gap: 0.3rem;
    font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;
    padding: 0.2rem 0.55rem; border-radius: 999px;
    background: color-mix(in srgb, var(--text-accent) 10%, transparent);
    color: var(--text-accent);
    border: 1px solid color-mix(in srgb, var(--text-accent) 25%, transparent);
  }

  /* Review toggle buttons */
  .qm-reviewed-btn {
    display: inline-flex; align-items: center; gap: 0.4rem;
    font-size: 0.75rem; font-weight: 800; padding: 0.35rem 0.9rem;
    border-radius: 999px; cursor: pointer; transition: all 0.2s; border: 1px solid;
    font-family: 'Nunito', sans-serif;
  }
  .qm-reviewed-btn.reviewed {
    background: var(--correct-bg); color: var(--correct);
    border-color: color-mix(in srgb, var(--correct) 25%, transparent);
  }
  .qm-reviewed-btn.reviewed:hover { background: color-mix(in srgb, var(--correct) 20%, transparent); }
  .qm-reviewed-btn.pending {
    background: color-mix(in srgb, var(--text-alternative-a) 10%, transparent);
    color: var(--text-alternative-a);
    border-color: color-mix(in srgb, var(--text-alternative-a) 25%, transparent);
  }
  .qm-reviewed-btn.pending:hover { background: color-mix(in srgb, var(--text-alternative-a) 20%, transparent); }

  /* Active toggle */
  .qm-active-badge {
    font-size: 0.65rem; font-weight: 800; padding: 0.2rem 0.65rem; border-radius: 999px; cursor: pointer;
    font-family: 'Nunito', sans-serif; transition: all 0.2s; border: none;
  }
  .qm-active-badge.active   { background: var(--correct); color: white; }
  .qm-active-badge.inactive { background: var(--glass-bg); color: var(--text-muted); border: 1px solid var(--glass-border); }

  /* Reports badge */
  .qm-report-badge {
    display: inline-flex; align-items: center; gap: 0.35rem;
    font-size: 0.65rem; font-weight: 800; padding: 0.2rem 0.65rem; border-radius: 999px;
    background: var(--incorrect-bg); color: var(--incorrect);
    border: 1px solid color-mix(in srgb, var(--incorrect) 25%, transparent);
  }

  /* Action buttons */
  .qm-btn-icon {
    background: var(--glass-bg); border: 1.5px solid var(--glass-border);
    border-radius: 0.65rem; padding: 0.45rem; cursor: pointer;
    color: var(--text-secondary); transition: all 0.18s;
    display: inline-flex; align-items: center;
  }
  .qm-btn-icon:hover { border-color: var(--text-accent); color: var(--text-primary); }
  .qm-btn-icon.danger:hover { background: var(--incorrect-bg); color: var(--incorrect); border-color: color-mix(in srgb, var(--incorrect) 30%, transparent); }
  .qm-btn-icon.edit:hover { background: color-mix(in srgb, var(--text-accent) 10%, transparent); color: var(--text-accent); border-color: color-mix(in srgb, var(--text-accent) 30%, transparent); }
  .qm-btn-icon.success:hover { background: var(--correct-bg); color: var(--correct); border-color: color-mix(in srgb, var(--correct) 30%, transparent); }

  /* Header buttons */
  .qm-btn-ai {
    display: flex; align-items: center; gap: 0.5rem;
    background: var(--btn-primary); color: var(--btn-text);
    border: none; border-radius: 1rem; padding: 0.75rem 1.5rem;
    font-weight: 800; font-size: 0.875rem; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s; font-family: 'Nunito', sans-serif;
  }
  .qm-btn-ai:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  .qm-btn-ai:disabled { opacity: 0.45; cursor: not-allowed; }

  .qm-btn-new {
    display: flex; align-items: center; gap: 0.5rem;
    background: var(--text-alternative-b); color: white;
    border: none; border-radius: 1rem; padding: 0.75rem 1.5rem;
    font-weight: 800; font-size: 0.875rem; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s; font-family: 'Nunito', sans-serif;
  }
  .qm-btn-new:hover { opacity: 0.88; transform: translateY(-1px); }

  .qm-btn-clear {
    display: flex; align-items: center; justify-content: center; gap: 0.4rem;
    width: 100%; padding: 0.75rem;
    background: var(--glass-bg); color: var(--text-secondary);
    border: 1.5px solid var(--glass-border); border-radius: 1rem;
    font-weight: 700; font-size: 0.875rem; cursor: pointer;
    transition: all 0.2s; font-family: 'Nunito', sans-serif;
  }
  .qm-btn-clear:hover { border-color: var(--text-accent); color: var(--text-primary); }

  .qm-btn-reported {
    display: flex; align-items: center; gap: 0.5rem; white-space: nowrap;
    padding: 0.75rem 1.25rem; border-radius: 1rem;
    font-weight: 800; font-size: 0.8rem; cursor: pointer;
    transition: all 0.2s; font-family: 'Nunito', sans-serif;
  }
  .qm-btn-reported.on  { background: var(--incorrect); color: white; border: 1.5px solid var(--incorrect); }
  .qm-btn-reported.off { background: var(--glass-bg); color: var(--text-secondary); border: 1.5px solid var(--glass-border); }
  .qm-btn-reported.off:hover { border-color: var(--incorrect); color: var(--incorrect); }

  /* Pagination */
  .qm-page-btn {
    background: var(--card-bg); color: var(--text-secondary);
    border: 1.5px solid var(--glass-border); border-radius: 1rem;
    padding: 0.6rem 1.5rem; font-weight: 700; font-size: 0.875rem; cursor: pointer;
    transition: all 0.2s; font-family: 'Nunito', sans-serif;
  }
  .qm-page-btn:hover:not(:disabled) { border-color: var(--text-accent); color: var(--text-primary); }
  .qm-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .qm-page-nav {
    display: flex; align-items: center; justify-content: center;
    gap: 0.4rem; flex-wrap: wrap;
  }

  .qm-page-num {
    min-width: 2.5rem; height: 2.5rem; padding: 0 0.5rem;
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--card-bg); color: var(--text-secondary);
    border: 1.5px solid var(--glass-border); border-radius: 0.85rem;
    font-weight: 700; font-size: 0.875rem; cursor: pointer;
    transition: all 0.2s; font-family: 'Nunito', sans-serif;
  }
  .qm-page-num:hover:not(:disabled):not(.active) { border-color: var(--text-accent); color: var(--text-primary); }
  .qm-page-num.active {
    background: var(--btn-primary); color: var(--btn-text);
    border-color: var(--btn-primary); cursor: default;
  }
  .qm-page-num:disabled { opacity: 0.3; cursor: not-allowed; }

  .qm-page-ellipsis {
    min-width: 1.5rem; text-align: center; color: var(--text-muted);
    font-weight: 700; font-size: 0.875rem; user-select: none;
  }

  .qm-page-jump {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);
  }
  .qm-page-jump input {
    width: 3.5rem; text-align: center;
    background: var(--card-bg); border: 1.5px solid var(--glass-border);
    border-radius: 0.75rem; padding: 0.5rem 0.25rem;
    color: var(--text-primary); font-family: 'Nunito', sans-serif;
    font-weight: 700; font-size: 0.875rem; outline: none; transition: border-color 0.2s;
  }
  .qm-page-jump input:focus { border-color: var(--text-accent); }
  .qm-page-jump input::-webkit-outer-spin-button,
  .qm-page-jump input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

  /* Loading spinner */
  .qm-spin { animation: qm-spin-anim 0.9s linear infinite; }
  @keyframes qm-spin-anim { to { transform: rotate(360deg); } }
`;

const diffClass = (d) =>
  d === "easy" ? "qm-diff-easy" : d === "medium" ? "qm-diff-medium" : "qm-diff-hard";

// Calcula qué números de página mostrar, colapsando los intermedios con "…"
// Ej: total=10, current=5 -> [1, '…', 4, 5, 6, '…', 10]
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

export default function QuestionsManagement() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [lessons, setLessons] = useState([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selSubject, setSelSubject] = useState("");
  const [selUnit, setSelUnit] = useState("");
  const [selLesson, setSelLesson] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageJumpValue, setPageJumpValue] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [generating, setGenerating] = useState(false);
  const [showReportedOnly, setShowReportedOnly] = useState(false);

  const [selType,       setSelType]       = useState("");
  const [selDifficulty, setSelDifficulty] = useState("");

  useEffect(() => {
    api.get("/admin/subjects").then(res => setSubjects(res.data.data || []));
  }, []);

  useEffect(() => {
    if (selSubject) {
      api.get(`/admin/subjects/${selSubject}/units`).then(res => setUnits(res.data.data || []));
    } else {
      setUnits([]);
    }
    setSelUnit(""); setSelLesson("");
  }, [selSubject]);

  useEffect(() => {
    if (selUnit) {
      api.get(`/admin/units/${selUnit}/lessons`).then(res => setLessons(res.data.data || []));
    } else {
      setLessons([]);
    }
    setSelLesson("");
  }, [selUnit]);

  // Espera 350ms sin escribir antes de disparar la búsqueda real
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = {
        page, limit: 20,
        search: debouncedSearch || undefined,
        reviewed: filterStatus === "all" ? undefined : (filterStatus === "reviewed"),
        subjectId: selSubject || undefined,
        unitId: selUnit || undefined,
        lessonId: selLesson || undefined,
        reported: showReportedOnly ? "true" : undefined,
        type:       selType       || undefined,
        difficulty: selDifficulty || undefined,
      };
      const { data } = await api.get("/admin/questions", { params });
      setQuestions(data.data.questions || []);
      setTotalPages(data.data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Clave que representa "todos los filtros salvo la página". Si cambia,
  // significa que el usuario tocó un filtro y debemos volver a la página 1
  // en vez de quedarnos en una página que puede no existir para el nuevo filtro.
  const filterKey = useMemo(
    () => JSON.stringify({
      debouncedSearch, filterStatus, selSubject, selUnit, selLesson,
      showReportedOnly, selType, selDifficulty,
    }),
    [debouncedSearch, filterStatus, selSubject, selUnit, selLesson, showReportedOnly, selType, selDifficulty]
  );
  const prevFilterKey = useRef(filterKey);

  useEffect(() => {
    const filtersChanged = prevFilterKey.current !== filterKey;
    prevFilterKey.current = filterKey;

    if (filtersChanged && page !== 1) {
      // Este cambio de página vuelve a disparar el efecto; como filterKey
      // ya quedó actualizado arriba, la próxima vuelta hará el fetch real.
      setPage(1);
      return;
    }
    fetchQuestions();
  }, [page, filterKey]);

  const handleClearReports = async (questionId) => {
    if (!confirm("¿Eliminar todos los reportes de esta pregunta?")) return;
    try {
      await api.put(`/admin/questions/${questionId}/clear-reports`);
      fetchQuestions();
    } catch { alert("Error al limpiar los reportes"); }
  };

  const handleToggleReview = async (id, newReviewed) => {
    try {
      await api.put(`/admin/questions/${id}/review`, { approved: newReviewed });
      fetchQuestions();
    } catch { alert("Error al actualizar estado de revisión"); }
  };

  const handleToggleActive = async (id, newActive) => {
    try {
      await api.put(`/admin/questions/${id}`, { isActive: newActive });
      fetchQuestions();
    } catch { alert("Error al actualizar estado activo"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta pregunta?")) return;
    await api.delete(`/admin/questions/${id}`);
    fetchQuestions();
  };

  const resetFilters = () => {
    setSearch(""); setFilterStatus("all");
    setSelSubject(""); setSelUnit(""); setSelLesson("");
    setSelType(""); setSelDifficulty("");
    setPage(1);
  };

  const goToPage = (n) => {
    const clamped = Math.min(Math.max(1, n), totalPages);
    setPage(clamped);
  };

  const handlePageJumpSubmit = (e) => {
    e.preventDefault();
    const n = parseInt(pageJumpValue, 10);
    if (!Number.isNaN(n)) goToPage(n);
    setPageJumpValue("");
  };

  const handleGenerateAI = async () => {
    if (!selLesson) {
      alert("Por favor selecciona una Lección antes de generar preguntas con IA.");
      return;
    }
    setGenerating(true);
    try {
      const { data } = await api.post("/admin/questions/generate", {
        lessonId: selLesson, count: 5, difficulty: "medium"
      });
      alert(data.message || `${data.data?.length || 0} preguntas generadas correctamente.`);
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.message || "Error al generar preguntas con IA");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveQuestion = async (payload) => {
    try {
      let finalPayload = { ...payload };
      if (!editingQuestion && selLesson) finalPayload.lesson = selLesson;
      if (editingQuestion?._id) {
        await api.put(`/admin/questions/${editingQuestion._id}`, finalPayload);
        alert("Pregunta actualizada correctamente");
      } else {
        if (!finalPayload.lesson) { alert("Debes seleccionar una lección para crear la pregunta"); return; }
        await api.post("/admin/questions", finalPayload);
        alert("Pregunta creada correctamente");
      }
      setShowModal(false);
      setEditingQuestion(null);
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.message || "Error al guardar la pregunta");
    }
  };

  return (
    <div className="qm-page space-y-6 pb-20">
      <style>{QUESTIONS_CSS}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tight" style={{ color: "var(--text-primary)" }}>
            Gestión de Preguntas
          </h1>
          <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Control de calidad y generación con IA
          </p>
        </div>

        <div className="flex gap-3">
          <button className="qm-btn-ai" onClick={handleGenerateAI}
            disabled={generating || !selLesson}>
            <Sparkles size={18} />
            {generating ? "Generando…" : "Generar con IA"}
          </button>
          <button className="qm-btn-new"
            onClick={() => { setEditingQuestion(null); setShowModal(true); }}>
            <Plus size={18} /> Nueva Manual
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="qm-filter-bar space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="qm-label">Materia</label>
            <CustomSelect
              value={selSubject}
              onChange={setSelSubject}
              options={subjects}
              placeholder="Todas las materias"
              getOptionValue={opt => opt._id}
              getOptionLabel={opt => opt.name}
            />
          </div>
          <div>
            <label className="qm-label">Unidad</label>
            <CustomSelect
              value={selUnit}
              onChange={setSelUnit}
              options={units}
              placeholder="Todas las unidades"
              disabled={!selSubject}
              getOptionValue={opt => opt._id}
              getOptionLabel={opt => opt.name}
            />
          </div>
          <div>
            <label className="qm-label">Lección</label>
            <CustomSelect
              value={selLesson}
              onChange={setSelLesson}
              options={lessons}
              placeholder="Todas las lecciones"
              disabled={!selUnit}
              getOptionValue={opt => opt._id}
              getOptionLabel={opt => opt.name}
            />
          </div>
          <div className="flex items-end">
            <button className="qm-btn-clear" onClick={resetFilters}>
              <RotateCcw size={16} /> Limpiar Filtros
            </button>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4">

          <div className="qm-search-wrap col-start-1 col-end-3">
            <Search className="qm-search-icon" size={16} />
            <input className="qm-search-input" type="text"
              placeholder="Buscar en el enunciado…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <CustomSelect
            value={selType}
            onChange={setSelType}
            options={[
              { value: "",                 label: "Todos los tipos"   },
              { value: "multiple_choice",  label: "Multiple Choice"   },
              { value: "true_false",       label: "True / False"      },
              { value: "fill_blank",       label: "Fill Blank"        },
              { value: "order_items",      label: "Order Items"       },
              { value: "match_pairs",      label: "Match Pairs"       },
              { value: "sentence_builder", label: "Sentence Builder"  },
              { value: "free_text",        label: "Free Text"         },
              { value: "typing",           label: "Typing"            },
              { value: "code_python",      label: "Code Python"       },
            ]}
            getOptionValue={opt => opt.value}
            getOptionLabel={opt => opt.label}
          />

          <CustomSelect
            value={selDifficulty}
            onChange={setSelDifficulty}
            options={[
              { value: "",       label: "Todas las dificultades" },
              { value: "easy",   label: "Fácil" },
              { value: "medium", label: "Media" },
              { value: "hard",   label: "Difícil" },
            ]}
            getOptionValue={opt => opt.value}
            getOptionLabel={opt => opt.label}
          />

          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: "all", label: "Todos" },
              { value: "pending", label: "Pendientes" },
              { value: "reviewed", label: "Revisadas" },
            ]}
            getOptionValue={opt => opt.value}
            getOptionLabel={opt => opt.label}
          />

          <button
            className={`qm-btn-reported ${showReportedOnly ? "on" : "off"}`}
            onClick={() => setShowReportedOnly(!showReportedOnly)}
          >
            <ShieldAlert size={16} />
            {showReportedOnly ? "Reportadas: ON" : "Reportadas: OFF"}
          </button>

        </div>
      </div>

      {/* Tabla */}
      <div className="qm-card">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div
              className="qm-spin w-12 h-12 rounded-full border-4"
              style={{ borderColor: "color-mix(in srgb, var(--text-accent) 25%, transparent)", borderTopColor: "var(--text-accent)" }}
            />
            <p className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>Cargando preguntas…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="qm-table-head">
                <tr>
                  <th>Pregunta</th>
                  <th>Tipo</th>
                  <th>Ubicación</th>
                  <th className="text-center">Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {questions && questions.length > 0 ? (
                  questions.map(q => (
                    <tr key={q._id} className="qm-table-row">
                      {/* Pregunta */}
                      <td className="max-w-xs">
                        <p className="text-sm font-black line-clamp-2" style={{ color: "var(--text-primary)" }}>
                          {q.prompt}
                        </p>
                        {q.isAIGenerated && (
                          <div className="qm-ai-badge mt-1.5">
                            <Sparkles size={9} /> IA GENERATED
                          </div>
                        )}
                      </td>

                      {/* Tipo */}
                      <td>
                        <div className="flex flex-col gap-2">
                          <span className="qm-type-badge">
                            {q.type?.replace("_", " ").toUpperCase()}
                          </span>
                          <span className={`text-xs font-black uppercase tracking-tight ${diffClass(q.difficulty)}`}>
                            ● {q.difficulty}
                          </span>
                        </div>
                      </td>

                      {/* Ubicación */}
                      <td>
                        <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
                          {q.lesson?.name || "—"}
                        </p>
                        <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                          {q.lesson?.unit?.name || "Sin unidad"}
                        </p>
                      </td>

                      {/* Estado */}
                      <td>
                        <div className="flex flex-col items-center gap-2">
                          <button
                            className={`qm-reviewed-btn ${q.isReviewed ? "reviewed" : "pending"}`}
                            onClick={() => handleToggleReview(q._id, !q.isReviewed)}
                          >
                            {q.isReviewed ? <><CheckCircle size={14} /> Revisada</> : <><XCircle size={14} /> Pendiente</>}
                          </button>
                          <button
                            className={`qm-active-badge ${q.isActive ? "active" : "inactive"}`}
                            disabled
                            onClick={() => handleToggleActive(q._id, !q.isActive)}
                          >
                            {q.isActive ? "Activa" : "Inactiva"}
                          </button>
                          {q.reports && q.reports.length > 0 && (
                            <div className="qm-report-badge">
                              <ShieldAlert size={12} />
                              {q.reports.length} reporte{q.reports.length > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td>
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ opacity: 1 }}>
                          <button className="qm-btn-icon edit"
                            onClick={() => { setEditingQuestion(q); setShowModal(true); }}>
                            <Edit size={16} />
                          </button>
                          <button className="qm-btn-icon danger"
                            onClick={() => handleDelete(q._id)}>
                            <Trash2 size={16} />
                          </button>
                          {q.reports && q.reports.length > 0 && (
                            <button className="qm-btn-icon success"
                              onClick={() => handleClearReports(q._id)}
                              title="Limpiar reportes">
                              <ShieldAlert size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-20 text-center">
                      <div className="flex flex-col items-center gap-3" style={{ color: "var(--text-muted)" }}>
                        <Search size={36} style={{ opacity: 0.3 }} />
                        <p className="text-sm font-bold">No se encontraron preguntas con estos filtros.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      <div className="flex flex-col items-center gap-3">
        <div className="qm-page-nav">
          <button className="qm-page-btn" disabled={page === 1 || loading} onClick={() => goToPage(1)}>
            « Primera
          </button>
          <button className="qm-page-btn" disabled={page === 1 || loading} onClick={() => goToPage(page - 1)}>
            Anterior
          </button>

          {getPageRange(page, totalPages).map((n, idx) =>
            n === "…" ? (
              <span key={`dots-${idx}`} className="qm-page-ellipsis">…</span>
            ) : (
              <button
                key={n}
                className={`qm-page-num ${n === page ? "active" : ""}`}
                disabled={loading}
                onClick={() => goToPage(n)}
                aria-current={n === page ? "page" : undefined}
              >
                {n}
              </button>
            )
          )}

          <button className="qm-page-btn" disabled={page >= totalPages || loading} onClick={() => goToPage(page + 1)}>
            Siguiente
          </button>
          <button className="qm-page-btn" disabled={page >= totalPages || loading} onClick={() => goToPage(totalPages)}>
            Última »
          </button>
        </div>

        <form className="qm-page-jump" onSubmit={handlePageJumpSubmit}>
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

      {showModal && (
        <QuestionModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setEditingQuestion(null); }}
          question={editingQuestion}
          onSave={handleSaveQuestion}
          subjects={subjects}
          units={units}
          lessons={lessons}
          selectedLessonId={selLesson}
        />
      )}
    </div>
  );
}