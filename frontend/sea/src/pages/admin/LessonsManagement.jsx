import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, GraduationCap, Target } from "lucide-react";
import api from "../../api/axios";

export default function LessonsManagement() {
  const [lessons, setLessons] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);

  const initialForm = {
    unit: "",
    name: "",
    order: 1,
    type: "lesson",
    xpReward: 10,
    questionCount: 5,
    difficulty: "easy",
    aiTopicHint: "",
    isActive: true
  };

  const [form, setForm] = useState(initialForm);

  const fetchData = async () => {
    try {
      const [lessonsRes, unitsRes] = await Promise.all([
        api.get("/admin/lessons"),
        api.get("/admin/units")
      ]);
      setLessons(lessonsRes.data.data);
      setUnits(unitsRes.data.data);
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (lesson = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setForm({
        unit: lesson.unit?._id || lesson.unit,
        name: lesson.name,
        order: lesson.order,
        type: lesson.type || "lesson",
        xpReward: lesson.xpReward,
        questionCount: lesson.questionCount,
        difficulty: lesson.difficulty,
        aiTopicHint: lesson.aiTopicHint || "",
        isActive: lesson.isActive ?? true
      });
    } else {
      setEditingLesson(null);
      setForm({ ...initialForm, unit: units[0]?._id || "" });
    }
    setShowModal(true);
  };

  const saveLesson = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingLesson) {
        await api.put(`/admin/lessons/${editingLesson._id}`, form);
      } else {
        await api.post(`/admin/units/${form.unit}/lessons`, form);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteLesson = async (id) => {
    if (!confirm("¿Eliminar esta lección? Esto podría afectar el progreso de los usuarios.")) return;
    try {
      await api.delete(`/admin/lessons/${id}`);
      fetchData();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  if (loading) return <div className="text-center py-20 text-white">Cargando lecciones...</div>;

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Lecciones</h1>
          <p className="text-gray-400">Administra el contenido y dificultad de cada paso del mapa.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all"
        >
          <Plus size={20} /> Nueva Lección
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-6">Unidad</th>
                <th className="p-6">Lección</th>
                <th className="p-6 text-center">Tipo</th>
                <th className="p-6 text-center">Dificultad</th>
                <th className="p-6 text-center">Orden</th>
                <th className="p-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {lessons.map(l => (
                <tr key={l._id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-6">
                    <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">{l.unit?.name || 'Sin unidad'}</span>
                  </td>
                  <td className="p-6 font-medium text-white">{l.name}</td>
                  <td className="p-6 text-center">
                    <span className={`text-xs px-3 py-1 rounded-full ${l.type === 'checkpoint' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>
                      {l.type}
                    </span>
                  </td>
                  <td className="p-6 text-center capitalize">{l.difficulty}</td>
                  <td className="p-6 text-center font-mono">{l.order}</td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => openModal(l)} className="p-2 hover:bg-gray-700 rounded-lg transition-colors"><Edit size={18} /></button>
                      <button onClick={() => deleteLesson(l._id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EDICIÓN / CREACIÓN */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X /></button>
            
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              {editingLesson ? <Edit className="text-violet-500" /> : <Plus className="text-green-500" />}
              {editingLesson ? "Editar Lección" : "Crear Nueva Lección"}
            </h2>

            <form onSubmit={saveLesson} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Unidad y Nombre */}
              <div className="md:col-span-2">
                <label className="text-sm text-gray-400 mb-2 block">Unidad Perteneciente</label>
                <select 
                  value={form.unit} 
                  onChange={e => setForm({...form, unit: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                  required
                >
                  <option value="" disabled>Selecciona una unidad</option>
                  {units.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-400 mb-2 block">Nombre de la Lección</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-white focus:ring-2 focus:ring-violet-500 outline-none" 
                  placeholder="Ej: Introducción a Fracciones"
                  required 
                />
              </div>

              {/* Configuración Técnica */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Tipo de Lección</label>
                <select 
                  value={form.type} 
                  onChange={e => setForm({...form, type: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-white"
                >
                  <option value="lesson">Lección Normal</option>
                  <option value="checkpoint">Checkpoint (Examen)</option>
                  <option value="review">Repaso</option>
                  <option value="ai_generated">Generada por IA</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Dificultad</label>
                <select 
                  value={form.difficulty} 
                  onChange={e => setForm({...form, difficulty: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-white uppercase"
                >
                  <option value="easy">Fácil</option>
                  <option value="medium">Media</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Recompensa XP</label>
                <input 
                  type="number" 
                  value={form.xpReward} 
                  onChange={e => setForm({...form, xpReward: Number(e.target.value)})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-white" 
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Preguntas por Sesión</label>
                <input 
                  type="number" 
                  value={form.questionCount} 
                  onChange={e => setForm({...form, questionCount: Number(e.target.value)})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-white" 
                  min="3" max="20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-400 mb-2 block">AI Topic Hint (Contexto para IA)</label>
                <textarea 
                  value={form.aiTopicHint} 
                  onChange={e => setForm({...form, aiTopicHint: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-white h-24 resize-none" 
                  placeholder="Ej: Enfatizar en suma de fracciones con distinto denominador..."
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-2 py-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={form.isActive} 
                  onChange={e => setForm({...form, isActive: e.target.checked})} 
                  className="w-5 h-5 accent-violet-500"
                />
                <label htmlFor="isActive" className="text-white">Lección activa (visible para alumnos)</label>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="md:col-span-2 w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 rounded-2xl text-white font-bold text-lg transition-all mt-4"
              >
                {isSubmitting ? "Guardando..." : (editingLesson ? "Actualizar Lección" : "Crear Lección")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}