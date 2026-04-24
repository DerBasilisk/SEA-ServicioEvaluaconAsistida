// src/pages/admin/SubjectsManagement.jsx
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, X, ChevronDown, ChevronUp } from "lucide-react";
import api from "../../api/axios";
import { validarNombre, NOMBRE_ERROR, NOMBRE_REGEX } from "../../utils/validators";

const SUBJECTS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  .subjects-page { font-family: 'Nunito', sans-serif; }

  .subjects-card {
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 1.5rem;
    overflow: hidden;
  }

  /* Subject Card - Mobile */
  .subject-card {
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 1.25rem;
    transition: all 0.2s ease;
  }
  .subject-card:active {
    transform: scale(0.99);
  }

  .subject-expand-icon {
    transition: transform 0.2s ease;
  }
  .subject-expand-icon.expanded {
    transform: rotate(180deg);
  }

  /* Modal - Bottom sheet en móvil */
  .subjects-modal-overlay {
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
    .subjects-modal-overlay {
      align-items: center;
    }
  }
  .subjects-modal {
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
    .subjects-modal {
      border-radius: 2rem;
    }
  }

  .subjects-btn-primary {
    width: 100%;
    background: var(--text-alternative-b);
    color: white;
    border: none;
    border-radius: 1rem;
    padding: 1rem;
    font-weight: 800;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Nunito', sans-serif;
  }
  .subjects-btn-primary:active {
    transform: scale(0.98);
    opacity: 0.9;
  }

  .subjects-btn-ghost {
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
  .subjects-btn-ghost:active {
    transform: scale(0.98);
  }

  .subjects-input {
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
  .subjects-input:focus {
    border-color: var(--text-accent);
    background: color-mix(in srgb, var(--text-accent) 4%, var(--card-bg));
  }
  .subjects-input::placeholder {
    color: var(--text-muted);
  }

  .subjects-label {
    font-size: 0.7rem;
    font-weight: 800;
    color: var(--text-secondary);
    display: block;
    margin-bottom: 0.4rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .subjects-close-btn {
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
  .subjects-close-btn:active {
    transform: scale(0.92);
  }

  .subjects-order-btn {
    background: var(--glass-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 0.75rem;
    padding: 0.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .subjects-order-btn:active {
    transform: scale(0.92);
  }
  .subjects-order-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

export default function SubjectsManagement() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [expandedSubject, setExpandedSubject] = useState(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "📚",
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
        icon: subject.icon || "📚",
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
    if (!validarNombre(form.name)) {
      alert(NOMBRE_ERROR);
      return;
    }
    try {
      if (editingSubject) {
        await api.put(`/admin/subjects/${editingSubject._id}`, form);
      } else {
        await api.post("/admin/subjects", form);
      }
      setShowModal(false);
      fetchSubjects();
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
    } catch (err) {
      alert(err.response?.data?.message || "Error al guardar materia");
    }
  };

  const deleteSubject = async (id) => {
    if (!confirm("¿Eliminar esta materia? Se borrarán también sus unidades y lecciones.")) return;
    try {
      await api.delete(`/admin/subjects/${id}`);
      fetchSubjects();
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
    } catch (err) {
      alert("Error al eliminar materia");
    }
  };

  const moveOrder = async (id, direction) => {
    const subject = subjects.find(s => s._id === id);
    const newOrder = direction === "up" ? subject.order - 1 : subject.order + 1;

    try {
      await api.put(`/admin/subjects/${id}`, { order: newOrder });
      fetchSubjects();
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="subjects-page flex items-center justify-center min-h-[60vh]">
        <style>{SUBJECTS_CSS}</style>
        <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--text-accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="subjects-page space-y-5 pb-20">
      <style>{SUBJECTS_CSS}</style>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight" style={{ color: "var(--text-primary)" }}>
            Materias
          </h1>
          <p className="text-xs sm:text-sm font-semibold mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {subjects.length} materias registradas
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-4 py-2.5 sm:px-6 sm:py-3 rounded-2xl text-white font-bold transition-all active:scale-95"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nueva Materia</span>
        </button>
      </div>

      {/* Lista de Materias - Cards */}
      <div className="space-y-3">
        {subjects.length === 0 ? (
          <div className="subjects-card p-8 text-center">
            <p className="font-bold" style={{ color: "var(--text-secondary)" }}>
              No hay materias registradas
            </p>
            <button
              onClick={() => openModal()}
              className="mt-3 text-sm font-bold uppercase tracking-wider"
              style={{ color: "var(--text-accent)" }}
            >
              Crear primera materia
            </button>
          </div>
        ) : (
          subjects.map((subject, index) => (
            <div key={subject._id} className="subject-card">
              {/* Header de la tarjeta */}
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setExpandedSubject(expandedSubject === subject._id ? null : subject._id)}
              >
                <div className="flex items-start gap-3">
                  {/* Icono y color */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: subject.color + "20", color: subject.color }}
                  >
                    {subject.icon || "📚"}
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-black text-base truncate" style={{ color: "var(--text-primary)" }}>
                        {subject.name}
                      </p>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openModal(subject); }}
                          className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteSubject(subject._id); }}
                          className="p-2 rounded-xl hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={16} style={{ color: "var(--incorrect)" }} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted mt-0.5">/{subject.slug}</p>
                    <p className="text-xs mt-1 line-clamp-1" style={{ color: "var(--text-secondary)" }}>
                      {subject.description || "Sin descripción"}
                    </p>
                  </div>
                </div>

                {/* Stats y orden */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{ borderColor: "var(--card-border)" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                        Orden: {subject.order}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveOrder(subject._id, "up"); }}
                      disabled={index === 0}
                      className="subjects-order-btn"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveOrder(subject._id, "down"); }}
                      disabled={index === subjects.length - 1}
                      className="subjects-order-btn"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Contenido expandible - AI Prompt Context */}
              {expandedSubject === subject._id && subject.aiPromptContext && (
                <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: "var(--card-border)" }}>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "var(--text-accent)" }}>
                    Contexto IA
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {subject.aiPromptContext}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Crear/Editar Materia - Bottom sheet en móvil */}
      {showModal && (
        <div className="subjects-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="subjects-modal" onClick={e => e.stopPropagation()}>
            <button className="subjects-close-btn" onClick={() => setShowModal(false)}>
              <X size={18} />
            </button>

            <div className="p-5 pt-12">
              <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight mb-5" style={{ color: "var(--text-primary)" }}>
                {editingSubject ? "Editar Materia" : "Nueva Materia"}
              </h2>

              <form onSubmit={saveSubject} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="subjects-label">Nombre</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || NOMBRE_REGEX.test(val)) setForm({ ...form, name: val });
                      }}
                      required
                      className="subjects-input"
                      placeholder="Ej: Matemáticas"
                    />
                  </div>
                  <div>
                    <label className="subjects-label">Slug</label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      required
                      className="subjects-input"
                      placeholder="matematicas"
                    />
                  </div>
                </div>

                <div>
                  <label className="subjects-label">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="subjects-input resize-none"
                    placeholder="Breve descripción de la materia..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="subjects-label">Icono</label>
                    <input
                      type="text"
                      value={form.icon}
                      onChange={(e) => setForm({ ...form, icon: e.target.value })}
                      className="subjects-input text-center text-2xl"
                      placeholder="📚"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="subjects-label">Color</label>
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="w-full h-11 bg-transparent border border-card-border rounded-xl cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="subjects-label">Orden</label>
                    <input
                      type="number"
                      value={form.order}
                      onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })}
                      className="subjects-input"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="subjects-label">
                    Prompt Context para IA
                  </label>
                  <textarea
                    value={form.aiPromptContext}
                    onChange={(e) => setForm({ ...form, aiPromptContext: e.target.value })}
                    rows={4}
                    placeholder="Ej: Materia de matemática para niños de primaria. Usa números concretos y ejemplos cotidianos..."
                    className="subjects-input resize-none text-sm"
                  />
                  <p className="text-[9px] mt-1" style={{ color: "var(--text-muted)" }}>
                    Este contexto guiará a la IA al generar preguntas
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="subjects-btn-ghost"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="subjects-btn-primary"
                  >
                    {editingSubject ? "Guardar Cambios" : "Crear Materia"}
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