import { useState, useEffect } from "react";
import { Search, Edit, Trash2, CheckCircle, XCircle, Sparkles, Plus, Filter, RotateCcw } from "lucide-react";
import api from "../../api/axios";
import QuestionModal from "../../components/admin/QuestionModal";

export default function QuestionsManagement() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Data para Selects
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [lessons, setLessons] = useState([]);

  // Estados de Filtro
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selSubject, setSelSubject] = useState("");
  const [selUnit, setSelUnit] = useState("");
  const [selLesson, setSelLesson] = useState("");
  
  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // 1. Cargar Materias al montar el componente
  useEffect(() => {
    api.get("/admin/subjects").then(res => setSubjects(res.data.data));
  }, []);

  // 2. Cargar Unidades cuando cambie la Materia
  useEffect(() => {
    if (selSubject) {
      api.get(`/admin/subjects/${selSubject}/units`).then(res => setUnits(res.data.data));
    } else {
      setUnits([]);
    }
    setSelUnit(""); // Reset downstream
    setSelLesson("");
  }, [selSubject]);

  // 3. Cargar Lecciones cuando cambie la Unidad
  useEffect(() => {
    if (selUnit) {
      api.get(`/admin/units/${selUnit}/lessons`).then(res => setLessons(res.data.data));
    } else {
      setLessons([]);
    }
    setSelLesson(""); // Reset downstream
  }, [selUnit]);

  // 4. Cargar Preguntas (Se dispara con cualquier cambio de filtro o página)
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        search: search || undefined,
        reviewed: filterStatus === "all" ? undefined : (filterStatus === "reviewed"),
        subjectId: selSubject || undefined,
        unitId: selUnit || undefined,
        lessonId: selLesson || undefined
      };

      const { data } = await api.get("/admin/questions", { params });
      setQuestions(data.data.questions);
      setTotalPages(data.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [page, filterStatus, search, selSubject, selUnit, selLesson]);

  const resetFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setSelSubject("");
    setPage(1);
  };

  // Handlers de acción (Delete, Review, etc.) similares a los anteriores...
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar pregunta?")) return;
    await api.delete(`/admin/questions/${id}`);
    fetchQuestions();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header con acciones principales */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Filter className="text-violet-400" /> Gestión de Preguntas
          </h1>
          <p className="text-gray-400">Control de calidad y generación de contenido</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl flex items-center gap-2 transition-all">
            <Plus size={20} /> Manual
          </button>
          <button className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-3 rounded-2xl flex items-center gap-2 transition-all">
            <Sparkles size={20} /> Generar IA
          </button>
        </div>
      </div>

      {/* Barra de Filtros Avanzada */}
      <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-3xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Select Materia */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Materia</label>
            <select value={selSubject} onChange={(e) => setSelSubject(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-2xl px-4 py-3 focus:ring-2 ring-violet-500 outline-none">
              <option value="">Todas las materias</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>

          {/* Select Unidad */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Unidad</label>
            <select value={selUnit} onChange={(e) => setSelUnit(e.target.value)} disabled={!selSubject}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-2xl px-4 py-3 disabled:opacity-30 outline-none">
              <option value="">Todas las unidades</option>
              {units.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>

          {/* Select Lección */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Lección</label>
            <select value={selLesson} onChange={(e) => setSelLesson(e.target.value)} disabled={!selUnit}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-2xl px-4 py-3 disabled:opacity-30 outline-none">
              <option value="">Todas las lecciones</option>
              {lessons.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input type="text" placeholder="Buscar en el enunciado..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl pl-12 pr-4 py-3 text-white focus:border-violet-500 outline-none" />
          </div>
          
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-2xl px-6 py-3 outline-none">
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes ⏳</option>
            <option value="reviewed">Revisadas ✅</option>
          </select>

          <button onClick={resetFilters} className="p-3 text-gray-400 hover:text-white transition-colors" title="Reiniciar filtros">
            <RotateCcw size={22} />
          </button>
        </div>
      </div>

      {/* Tabla de Resultados (Misma estructura que tenías, pero con loading state) */}
      {loading ? (
        <div className="py-20 text-center text-gray-500 animate-pulse">Cargando preguntas filtradas...</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
           <table className="w-full text-left">
              {/* Tabla de Resultados */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center bg-gray-900/50 border border-gray-800 rounded-3xl">
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 animate-pulse">Cargando preguntas filtradas...</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/50">
                  <th className="p-6 text-gray-400 font-medium text-sm uppercase tracking-wider">Pregunta</th>
                  <th className="p-6 text-gray-400 font-medium text-sm uppercase tracking-wider">Tipo / Dificultad</th>
                  <th className="p-6 text-gray-400 font-medium text-sm uppercase tracking-wider">Ubicación</th>
                  <th className="p-6 text-center text-gray-400 font-medium text-sm uppercase tracking-wider">Estado</th>
                  <th className="p-6 text-right text-gray-400 font-medium text-sm uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {questions && questions.length > 0 ? (
                  questions.map((q) => (
                    <tr key={q._id} className="hover:bg-gray-800/30 transition-colors group">
                      <td className="p-6 max-w-md">
                        <div className="flex flex-col gap-1">
                          <p className="text-white font-medium line-clamp-2" title={q.prompt}>
                            {q.prompt}
                          </p>
                          {q.isAIGenerated && (
                            <div className="flex items-center gap-1.5 text-[10px] bg-violet-500/10 text-violet-400 w-fit px-2 py-0.5 rounded-full border border-violet-500/20">
                              <Sparkles size={10} /> IA GENERATED
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="p-6">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded-md w-fit border border-gray-700">
                            {q.type?.replace("_", " ").toUpperCase()}
                          </span>
                          <span className={`text-[11px] font-bold uppercase tracking-tight ${
                            q.difficulty === 'easy' ? 'text-emerald-400' :
                            q.difficulty === 'medium' ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            ● {q.difficulty}
                          </span>
                        </div>
                      </td>

                      <td className="p-6">
                        <div className="text-sm">
                          <p className="text-gray-300 font-medium">{q.lesson?.name || "—"}</p>
                          <p className="text-gray-500 text-xs italic">{q.lesson?.unit?.name || "Sin unidad"}</p>
                        </div>
                      </td>

                      <td className="p-6">
                        <div className="flex justify-center">
                          {q.isReviewed ? (
                            <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                              <CheckCircle size={14} />
                              <span className="text-xs font-medium">Revisada</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                              <XCircle size={14} />
                              <span className="text-xs font-medium">Pendiente</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-6">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEditingQuestion(q); setShowModal(true); }}
                            className="p-2.5 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded-xl transition-all shadow-lg"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(q._id)}
                            className="p-2.5 bg-gray-800 hover:bg-red-500/20 text-red-400 rounded-xl transition-all shadow-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-500">
                        <Search size={40} className="opacity-20" />
                        <p>No se encontraron preguntas con estos filtros.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
           </table>
           {questions.length === 0 && <div className="p-20 text-center text-gray-500">No se encontraron preguntas con estos filtros.</div>}
        </div>
      )}

      {/* Paginación */}
      <div className="flex justify-center gap-4 items-center">
         <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-5 py-2 bg-gray-800 text-white rounded-xl disabled:opacity-20">Anterior</button>
         <span className="text-gray-400 text-sm font-mono">Página {page} / {totalPages}</span>
         <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-5 py-2 bg-gray-800 text-white rounded-xl disabled:opacity-20">Siguiente</button>
      </div>

      {showModal && (
        <QuestionModal 
          isOpen={showModal} 
          onClose={() => { setShowModal(false); setEditingQuestion(null); }}
          question={editingQuestion}
          onSave={fetchQuestions}
          // Pasar IDs actuales para facilitar la creación
          initialData={{ lessonId: selLesson, unitId: selUnit }}
        />
      )}
    </div>
  );
}