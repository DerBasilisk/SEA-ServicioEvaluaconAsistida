// frontend/sea/src/pages/admin/QuestionsManagement.jsx
import { useState, useEffect } from "react";
import { Search, Edit, Trash2, CheckCircle, XCircle, Sparkles, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import QuestionModal from "../../components/admin/QuestionModal";   // ← Importante

export default function QuestionsManagement() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, reviewed
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search: search || undefined,
        reviewed: filter === "all" ? undefined : filter === "reviewed"
      };

      const { data } = await api.get("/admin/questions", { params });
      
      setQuestions(data.data.questions || data.data);
      setTotalPages(data.data.pages || 1);
    } catch (err) {
      console.error(err);
      alert("Error al cargar las preguntas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [page, filter, search]);

  // Abrir modal para crear o editar
  const openModal = (q = null) => {
    setEditingQuestion(q);
    setShowModal(true);
  };

  // Generar preguntas con IA
  const handleGenerateAI = async () => {
    const lessonId = prompt("Ingresa el ID de la lección para generar preguntas:");
    if (!lessonId) return;

    const count = parseInt(prompt("¿Cuántas preguntas quieres generar?", "5")) || 5;

    try {
      const { data } = await api.post("/admin/questions/generate", {
        lessonId,
        count,
        difficulty: "easy"
      });
      alert(data.message || "Preguntas generadas correctamente");
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.message || "Error al generar preguntas con IA");
    }
  };

  // Eliminar
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta pregunta permanentemente?")) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      fetchQuestions();
    } catch (err) {
      alert("Error al eliminar la pregunta");
    }
  };

  // Revisar (aprobar/rechazar)
  const handleReview = async (id, approved) => {
    if (!confirm(approved ? "¿Aprobar esta pregunta?" : "¿Rechazar esta pregunta?")) return;
    try {
      await api.put(`/admin/questions/${id}/review`, { approved });
      fetchQuestions();
    } catch (err) {
      alert("Error al revisar la pregunta");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Preguntas</h1>
          <p className="text-indigo-400">Revisa, edita y genera preguntas para las lecciones</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGenerateAI}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:brightness-110 px-6 py-3 rounded-2xl text-white font-medium transition-all"
          >
            <Sparkles size={20} />
            Generar con IA
          </button>

          <button
            onClick={() => openModal()}   // ← Abre modal para nueva pregunta
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-2xl text-white font-medium transition-all"
          >
            <Plus size={20} />
            Nueva Pregunta Manual
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por enunciado de la pregunta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 focus:border-violet-500 rounded-2xl pl-11 py-4 text-white placeholder-gray-400"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-white rounded-2xl px-6 py-4 focus:border-violet-500"
        >
          <option value="all">Todas las preguntas</option>
          <option value="pending">Pendientes de revisión</option>
          <option value="reviewed">Ya revisadas</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left p-6 text-gray-400">Pregunta</th>
              <th className="text-left p-6 text-gray-400">Tipo</th>
              <th className="text-left p-6 text-gray-400">Dificultad</th>
              <th className="text-left p-6 text-gray-400">Lección</th>
              <th className="text-center p-6 text-gray-400">Estado</th>
              <th className="text-center p-6 text-gray-400 w-40">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {questions.map((q) => (
              <tr key={q._id} className="hover:bg-gray-800/50 transition-colors">
                <td className="p-6 max-w-md">
                  <p className="line-clamp-2 text-white font-medium">{q.prompt}</p>
                  {q.isAIGenerated && (
                    <span className="inline-block mt-2 text-xs bg-violet-500/10 text-violet-400 px-3 py-1 rounded-full">
                      Generada por IA
                    </span>
                  )}
                </td>
                <td className="p-6">
                  <span className="capitalize px-4 py-1.5 bg-gray-800 text-sm rounded-2xl">
                    {q.type.replace("_", " ")}
                  </span>
                </td>
                <td className="p-6">
                  <span className={`px-4 py-1.5 text-sm rounded-2xl font-medium ${
                    q.difficulty === "easy" ? "bg-emerald-500/10 text-emerald-400" :
                    q.difficulty === "medium" ? "bg-amber-500/10 text-amber-400" :
                    "bg-red-500/10 text-red-400"
                  }`}>
                    {q.difficulty}
                  </span>
                </td>
                <td className="p-6 text-gray-300">{q.lesson?.name || "—"}</td>
                <td className="p-6 text-center">
                  {q.isReviewed ? (
                    <div className="flex items-center justify-center gap-1.5 text-emerald-400">
                      <CheckCircle size={18} />
                      <span className="text-sm">Revisada</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-amber-400">
                      <XCircle size={18} />
                      <span className="text-sm">Pendiente</span>
                    </div>
                  )}
                </td>
                <td className="p-6">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => openModal(q)}
                      className="p-3 hover:bg-gray-700 rounded-2xl text-gray-300 hover:text-white transition-colors"
                      title="Editar"
                    >
                      <Edit size={20} />
                    </button>

                    {!q.isReviewed && (
                      <>
                        <button
                          onClick={() => handleReview(q._id, true)}
                          className="p-3 text-emerald-400 hover:bg-emerald-500/10 rounded-2xl transition-colors"
                          title="Aprobar"
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button
                          onClick={() => handleReview(q._id, false)}
                          className="p-3 text-red-400 hover:bg-red-500/10 rounded-2xl transition-colors"
                          title="Rechazar"
                        >
                          <XCircle size={20} />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDelete(q._id)}
                      className="p-3 text-red-400 hover:bg-red-500/10 rounded-2xl transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-6 py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 rounded-2xl text-white"
        >
          ← Anterior
        </button>
        <span className="text-gray-400">
          Página <span className="text-white font-semibold">{page}</span> de {totalPages}
        </span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page === totalPages}
          className="px-6 py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 rounded-2xl text-white"
        >
          Siguiente →
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <QuestionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          question={editingQuestion}
          onSave={async (data) => {
            try {
              if (editingQuestion) {
                await api.put(`/admin/questions/${editingQuestion._id}`, data);
              } else {
                await api.post("/admin/questions", data);
              }
              setShowModal(false);
              fetchQuestions();
            } catch (err) {
              alert(err.response?.data?.message || "Error al guardar la pregunta");
            }
          }}
        />
      )}
    </div>
  );
}