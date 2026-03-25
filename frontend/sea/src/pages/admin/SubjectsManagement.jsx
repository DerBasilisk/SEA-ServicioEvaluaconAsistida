// src/pages/admin/SubjectsManagement.jsx
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import api from "../../api/axios";

export default function SubjectsManagement() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    color: "#6366f1",
    order: 1,
    aiPromptContext: ""
  });

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get("/admin/subjects");
      setSubjects(data.data);
    } catch (err) {
      console.error(err);
      alert("Error al cargar materias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      setForm({
        name: subject.name,
        slug: subject.slug,
        description: subject.description || "",
        icon: subject.icon || "",
        color: subject.color || "#6366f1",
        order: subject.order || 1,
        aiPromptContext: subject.aiPromptContext || ""
      });
    } else {
      setEditingSubject(null);
      setForm({
        name: "",
        slug: "",
        description: "",
        icon: "📚",
        color: "#6366f1",
        order: subjects.length + 1,
        aiPromptContext: ""
      });
    }
    setShowModal(true);
  };

  const saveSubject = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await api.put(`/admin/subjects/${editingSubject._id}`, form);
      } else {
        await api.post("/admin/subjects", form);
      }
      setShowModal(false);
      fetchSubjects();
    } catch (err) {
      alert(err.response?.data?.message || "Error al guardar materia");
    }
  };

  const deleteSubject = async (id) => {
    if (!confirm("¿Eliminar esta materia? Se borrarán también sus unidades y lecciones.")) return;
    
    try {
      await api.delete(`/admin/subjects/${id}`);
      fetchSubjects();
    } catch (err) {
      alert("Error al eliminar materia");
    }
  };

  const moveOrder = async (id, direction) => {
    // Lógica simple de reordenamiento (puedes mejorarla después)
    const subject = subjects.find(s => s._id === id);
    const newOrder = direction === "up" ? subject.order - 1 : subject.order + 1;

    try {
      await api.put(`/admin/subjects/${id}`, { order: newOrder });
      fetchSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-indigo-300">Cargando materias...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Materias y Contenido</h1>
          <p className="text-indigo-400">Gestiona materias, unidades y prompts de IA</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-2xl text-white font-medium transition-colors"
        >
          <Plus size={20} />
          Nueva Materia
        </button>
      </div>

      {/* Lista de Materias */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left p-6 text-gray-400 w-12">#</th>
              <th className="text-left p-6 text-gray-400">Materia</th>
              <th className="text-left p-6 text-gray-400">Icono</th>
              <th className="text-left p-6 text-gray-400">Descripción</th>
              <th className="text-center p-6 text-gray-400">Orden</th>
              <th className="text-center p-6 text-gray-400">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {subjects.map((subject, index) => (
              <tr key={subject._id} className="hover:bg-gray-800/50 transition-colors">
                <td className="p-6 text-gray-400 font-medium">{subject.order}</td>
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: subject.color + "20", color: subject.color }}
                    >
                      {subject.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{subject.name}</p>
                      <p className="text-xs text-gray-500">/{subject.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6 text-3xl">{subject.icon}</td>
                <td className="p-6 text-gray-300 text-sm line-clamp-2">
                  {subject.description || "Sin descripción"}
                </td>
                <td className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => moveOrder(subject._id, "up")}
                      disabled={index === 0}
                      className="p-2 hover:bg-gray-700 rounded-xl disabled:opacity-30"
                    >
                      <ArrowUp size={18} />
                    </button>
                    <button
                      onClick={() => moveOrder(subject._id, "down")}
                      disabled={index === subjects.length - 1}
                      className="p-2 hover:bg-gray-700 rounded-xl disabled:opacity-30"
                    >
                      <ArrowDown size={18} />
                    </button>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => openModal(subject)}
                      className="p-3 hover:bg-gray-700 text-gray-300 hover:text-white rounded-2xl transition-colors"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => deleteSubject(subject._id)}
                      className="p-3 hover:bg-red-500/10 text-gray-300 hover:text-red-400 rounded-2xl transition-colors"
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

      {/* Modal Crear/Editar Materia */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-3xl p-8 w-full max-w-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingSubject ? "Editar Materia" : "Nueva Materia"}
            </h2>

            <form onSubmit={saveSubject} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Nombre</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-2">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white resize-y"
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Icono (emoji)</label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-3xl text-center"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Color</label>
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full h-12 bg-transparent border border-gray-700 rounded-2xl cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Orden</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-2">
                  Prompt Context para IA (importante)
                </label>
                <textarea
                  value={form.aiPromptContext}
                  onChange={(e) => setForm({ ...form, aiPromptContext: e.target.value })}
                  rows={5}
                  placeholder="Ej: Materia de matemática para niños de primaria. Usa números concretos..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white font-mono text-sm"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-2xl text-white font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-violet-600 hover:bg-violet-500 rounded-2xl text-white font-medium"
                >
                  {editingSubject ? "Guardar Cambios" : "Crear Materia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}