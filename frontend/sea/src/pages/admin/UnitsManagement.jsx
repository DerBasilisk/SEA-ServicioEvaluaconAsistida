// frontend/sea/src/pages/admin/UnitsManagement.jsx
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, RotateCcw, Lock, X, } from "lucide-react";
import api from "../../api/axios";

export default function UnitsManagement() {
  const [units, setUnits] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  // Filtros
  const [selectedSubject, setSelectedSubject] = useState("");
  const [search, setSearch] = useState("");

  const initialForm = {
    subject: "",
    name: "",
    description: "",
    icon: "📖",
    order: 1,
    requiredXP: 0,
    isActive: true
  };

  const [form, setForm] = useState(initialForm);

  const fetchData = async () => {
    try {
      const [unitsRes, subjectsRes] = await Promise.all([
        api.get("/admin/units"),
        api.get("/admin/subjects")
      ]);
      setUnits(unitsRes.data.data || []);
      setSubjects(subjectsRes.data.data || []);
    } catch (err) {
      console.error("Error cargando datos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtro inteligente
  const filteredUnits = units.filter(unit => {
    const matchesSubject = !selectedSubject || 
      String(unit.subject?._id || unit.subject) === String(selectedSubject);

    const matchesSearch = !search || 
      unit.name.toLowerCase().includes(search.toLowerCase());

    return matchesSubject && matchesSearch;
  });

  const openModal = (unit = null) => {
    if (unit) {
      setEditingUnit(unit);
      setForm({
        subject: unit.subject?._id || unit.subject,
        name: unit.name,
        description: unit.description || "",
        icon: unit.icon || "📖",
        order: unit.order,
        requiredXP: unit.requiredXP || 0,
        isActive: unit.isActive ?? true
      });
    } else {
      setEditingUnit(null);
      setForm({ 
        ...initialForm, 
        subject: selectedSubject || subjects[0]?._id || "" 
      });
    }
    setShowModal(true);
  };

  const saveUnit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUnit) {
        await api.put(`/admin/units/${editingUnit._id}`, form);
      } else {
        await api.post(`/admin/subjects/${form.subject}/units`, form);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Error al guardar. Revisa que el orden no esté repetido en la materia.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteUnit = async (id) => {
    if (!confirm("¿Eliminar esta unidad? Se borrarán todas sus lecciones y preguntas.")) return;
    try {
      await api.delete(`/admin/units/${id}`);
      fetchData();
    } catch (err) {
      alert("Error al eliminar la unidad");
    }
  };

  const resetFilters = () => {
    setSelectedSubject("");
    setSearch("");
  };

  if (loading) return <div className="text-center py-20 text-white">Cargando unidades...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Unidades</h1>
          <p className="text-gray-400">Organiza los temas principales de cada materia.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-2xl text-white flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Nueva Unidad
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="text-gray-400 text-sm block mb-2">Filtrar por Materia</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white"
          >
            <option value="">Todas las materias</option>
            {subjects.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="text-gray-400 text-sm block mb-2">Buscar Unidad</label>
          <input
            type="text"
            placeholder="Nombre de la unidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={resetFilters}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl flex items-center gap-2 transition-colors"
          >
            <RotateCcw size={18} />
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-sm">
              <th className="p-6">Icono</th>
              <th className="p-6">Materia</th>
              <th className="p-6">Nombre de Unidad</th>
              <th className="p-6 text-center">XP Requerido</th>
              <th className="p-6 text-center">Orden</th>
              <th className="p-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-gray-300">
            {filteredUnits.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-12 text-center text-gray-400">
                  No se encontraron unidades con los filtros aplicados.
                </td>
              </tr>
            ) : (
              filteredUnits.map(u => (
                <tr key={u._id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-6 text-3xl">{u.icon}</td>
                  <td className="p-6">
                    <span className="bg-gray-800 px-3 py-1 rounded text-emerald-400 text-sm border border-emerald-500/20">
                      {u.subject?.name || "Sin materia"}
                    </span>
                  </td>
                  <td className="p-6 font-medium text-white">{u.name}</td>
                  <td className="p-6 text-center flex items-center justify-center gap-1">
                    <Lock size={14} className="text-gray-500" /> {u.requiredXP}
                  </td>
                  <td className="p-6 text-center font-mono">{u.order}</td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openModal(u)} 
                        className="p-2 hover:bg-gray-700 rounded-xl transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => deleteUnit(u._id)} 
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal (mantengo tu modal actual, solo agregué pequeño ajuste) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-lg relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X /></button>
            
            <h2 className="text-2xl font-bold mb-6 text-white">
              {editingUnit ? "Editar Unidad" : "Nueva Unidad"}
            </h2>

            <form onSubmit={saveUnit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Materia</label>
                <select 
                  value={form.subject} 
                  onChange={e => setForm({...form, subject: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="" disabled>Seleccionar materia...</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="text-sm text-gray-400 mb-2 block">Icono</label>
                  <input 
                    type="text" 
                    value={form.icon} 
                    onChange={e => setForm({...form, icon: e.target.value})} 
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-center text-xl" 
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-sm text-gray-400 mb-2 block">Nombre</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Álgebra Lineal" 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Descripción</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-white h-24 resize-none"
                  placeholder="De qué trata esta unidad..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Orden</label>
                  <input 
                    type="number" 
                    value={form.order} 
                    onChange={e => setForm({...form, order: Number(e.target.value)})} 
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-white" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">XP Requerido</label>
                  <input 
                    type="number" 
                    value={form.requiredXP} 
                    onChange={e => setForm({...form, requiredXP: Number(e.target.value)})} 
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-white" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 rounded-2xl text-white font-bold text-lg transition-all shadow-lg shadow-emerald-900/20"
              >
                {isSubmitting ? "Guardando..." : (editingUnit ? "Actualizar Unidad" : "Crear Unidad")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}