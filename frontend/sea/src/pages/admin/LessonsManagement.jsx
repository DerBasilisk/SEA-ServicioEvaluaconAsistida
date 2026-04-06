// frontend/sea/src/pages/admin/LessonsManagement.jsx
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import api from "../../api/axios";

export default function LessonsManagement() {
  const [lessons, setLessons] = useState([]);
  const [units, setUnits] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);

  // Filtros
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    unit: "",
    name: "",
    order: 1,
    xpReward: 10,
    questionCount: 6,
    difficulty: "easy",
    aiTopicHint: "",
    description: ""
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

  useEffect(() => {
    fetchData();
  }, []);

  // ==================== FILTRO CORREGIDO Y ROBUSTO ====================
  // ==================== FILTRO ROBUSTO ====================
  const filteredLessons = lessons.filter((lesson) => {
    // Extraer IDs de forma segura
    const unitId = lesson.unit?._id || lesson.unit;
    let subjectId = null;

    if (lesson.unit && typeof lesson.unit === 'object') {
      subjectId = lesson.unit.subject?._id || lesson.unit.subject;
    }

    const matchesSearch = !search || 
      lesson.name.toLowerCase().includes(search.toLowerCase());

    const matchesSubject = !selectedSubject || 
      String(subjectId) === String(selectedSubject);

    const matchesUnit = !selectedUnit || 
      String(unitId) === String(selectedUnit);

    return matchesSearch && matchesSubject && matchesUnit;
  });

  const openModal = (lesson = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setForm({
        unit: String(lesson.unit?._id || lesson.unit),
        name: lesson.name,
        order: lesson.order,
        xpReward: lesson.xpReward || 10,
        questionCount: lesson.questionCount || 6,
        difficulty: lesson.difficulty || "easy",
        aiTopicHint: lesson.aiTopicHint || "",
        description: lesson.description || ""
      });
    } else {
      setEditingLesson(null);
      const defaultUnit = selectedUnit || units[0]?._id || "";

      const lessonsInUnit = lessons.filter(l => 
        String(l.unit?._id || l.unit) === String(defaultUnit)
      );
      const nextOrder = lessonsInUnit.length > 0 
        ? Math.max(...lessonsInUnit.map(l => l.order)) + 1 
        : 1;

      setForm({
        unit: defaultUnit,
        name: "",
        order: nextOrder,
        xpReward: 10,
        questionCount: 6,
        difficulty: "easy",
        aiTopicHint: "",
        description: ""
      });
    }
    setShowModal(true);
  };

  const saveLesson = async (e) => {
    e.preventDefault();
    try {
      if (editingLesson) {
        await api.put(`/admin/lessons/${editingLesson._id}`, form);
      } else {
        await api.post(`/admin/units/${form.unit}/lessons`, form);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      if (err.response?.data?.message?.includes("duplicate key")) {
        alert("Ya existe una lección con ese orden en la unidad. Por favor elige otro orden.");
      } else {
        alert(err.response?.data?.message || "Error al guardar la lección");
      }
    }
  };

  const deleteLesson = async (id) => {
    if (!confirm("¿Eliminar esta lección?")) return;
    try {
      await api.delete(`/admin/lessons/${id}`);
      fetchData();
    } catch (err) {
      alert("Error al eliminar la lección");
    }
  };

  if (loading) return <div className="text-center py-20 text-indigo-300">Cargando lecciones...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Lecciones</h1>
          <p className="text-indigo-400">Administra las lecciones de cada unidad</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-2xl text-white font-medium transition-colors"
        >
          <Plus size={20} />
          Nueva Lección
        </button>
      </div>

      {/* Filtros Mejorados */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-gray-400 text-sm block mb-2">Materia</label>
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedUnit(""); // Reset unidad cuando cambia la materia
            }}
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white"
          >
            <option value="">Todas las materias</option>
            {subjects.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-2">Unidad</label>
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white"
            disabled={!selectedSubject}
          >
            <option value="">Todas las unidades</option>
            {units
              .filter(u => !selectedSubject || String(u.subject?._id || u.subject) === String(selectedSubject))
              .map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))
            }
          </select>
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-2">Buscar Lección</label>
          <input
            type="text"
            placeholder="Nombre de la lección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left p-6 text-white">Unidad</th>
              <th className="text-left p-6 text-white">Lección</th>
              <th className="text-center p-6 text-white">Orden</th>
              <th className="text-center p-6 text-white">Dificultad</th>
              <th className="text-center p-6 text-white">Preguntas</th>
              <th className="text-center p-6 text-white">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredLessons.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-12 text-center text-gray-400">
                  No se encontraron lecciones con los filtros aplicados.
                </td>
              </tr>
            ) : (
              filteredLessons.map((lesson) => (
                <tr key={lesson._id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="p-6 text-gray-300">{lesson.unit?.name || "—"}</td>
                  <td className="p-6 font-medium text-white">{lesson.name}</td>
                  <td className="p-6 text-center font-mono text-gray-300">{lesson.order}</td>
                  <td className="p-6 text-center">
                    <span className={`px-4 py-1 text-xs rounded-full ${
                      lesson.difficulty === "easy" || lesson.difficulty === "beginner" 
                        ? "bg-emerald-500/10 text-emerald-400" 
                        : lesson.difficulty === "medium" || lesson.difficulty === "intermediate"
                        ? "bg-amber-500/10 text-amber-400" 
                        : "bg-red-500/10 text-red-400"
                    }`}>
                      {lesson.difficulty}
                    </span>
                  </td>
                  <td className="p-6 text-center text-gray-300">{lesson.questionCount}</td>
                  <td className="p-6 text-center">
                    <button 
                      onClick={() => openModal(lesson)} 
                      className="p-3 hover:bg-gray-700 rounded-2xl text-gray-300 hover:text-white transition-colors"
                    >
                      <Edit size={20} />
                    </button>
                    <button 
                      onClick={() => deleteLesson(lesson._id)} 
                      className="p-3 text-red-400 hover:bg-red-500/10 rounded-2xl ml-3"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-3xl w-full max-w-lg border border-gray-700">
            <div className="p-8 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-white">
                {editingLesson ? "Editar Lección" : "Nueva Lección"}
              </h2>
            </div>

            <form onSubmit={saveLesson} className="p-8 space-y-6">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Unidad</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white"
                  required
                >
                  <option value="">Selecciona una unidad</option>
                  {units.map((unit) => (
                    <option key={unit._id} value={unit._id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-2">Nombre de la Lección</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white"
                  placeholder="Ej: Suma de un dígito"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Orden</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Dificultad</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white"
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Medio</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-2">Hint para IA (opcional)</label>
                <input
                  type="text"
                  value={form.aiTopicHint}
                  onChange={(e) => setForm({ ...form, aiTopicHint: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white"
                  placeholder="Ej: Sumas simples con números del 1 al 9"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-2xl text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-violet-600 hover:bg-violet-500 rounded-2xl text-white font-medium"
                >
                  {editingLesson ? "Guardar Cambios" : "Crear Lección"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}