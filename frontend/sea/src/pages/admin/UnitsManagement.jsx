// frontend/sea/src/pages/admin/UnitsManagement.jsx
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, RotateCcw, Lock, X, Search as SearchIcon, Filter } from "lucide-react";
import api from "../../api/axios";
import CustomSelect from "../../components/ui/CustomSelect";
import { validarNombre, NOMBRE_ERROR, NOMBRE_REGEX } from "../../utils/validators";
import toast from 'react-hot-toast';
import { useConfirm } from "../../context/ConfirmContext"; // Importa el hook useConfirm

const UNITS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  .um-page { font-family: 'Nunito', sans-serif; }

  .um-card {
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 1.5rem;
    overflow: hidden;
  }

  .um-filter-bar {
    background: var(--glass-bg);
    border: 1.5px solid var(--glass-border);
    border-radius: 1.5rem;
    padding: 1rem;
    backdrop-filter: blur(10px);
  }

  /* Unit Card - Mobile */
  .um-unit-card {
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 1.25rem;
    transition: all 0.2s ease;
  }
  .um-unit-card:active {
    transform: scale(0.99);
  }

  .um-subject-badge {
    background: color-mix(in srgb, var(--text-alternative-b) 12%, transparent);
    color: var(--text-alternative-b);
    border: 1px solid color-mix(in srgb, var(--text-alternative-b) 25%, transparent);
    font-size: 0.65rem;
    font-weight: 800;
    padding: 0.2rem 0.65rem;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .um-input {
    width: 100%;
    background: var(--glass-bg-small);
    border: 1.5px solid var(--card-border);
    border-radius: 1rem;
    padding: 0.75rem 1.25rem;
    color: var(--text-primary);
    font-family: 'Nunito', sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    transition: border-color 0.2s;
    outline: none;
  }
  .um-input:focus { border-color: var(--text-accent); background: color-mix(in srgb, var(--text-accent) 4%, var(--card-bg)); }
  .um-input::placeholder { color: var(--text-muted); }

  .um-label {
    font-size: 0.7rem;
    font-weight: 800;
    color: var(--text-secondary);
    display: block;
    margin-bottom: 0.4rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  /* Modal - Bottom sheet en móvil */
  .um-modal-overlay {
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
    .um-modal-overlay {
      align-items: center;
    }
  }
  .um-modal {
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
    .um-modal {
      border-radius: 2rem;
    }
  }

  .um-btn-primary {
    width: 100%;
    background: var(--text-alternative-b);
    color: white;
    border: none;
    border-radius: 1rem;
    padding: 1rem 1.5rem;
    font-weight: 800;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Nunito', sans-serif;
  }
  .um-btn-primary:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
  .um-btn-primary:disabled {
    background: var(--card-border);
    color: var(--text-muted);
    cursor: not-allowed;
    transform: none;
  }

  .um-btn-ghost {
    background: var(--glass-bg);
    color: var(--text-secondary);
    border: 1.5px solid var(--card-border);
    border-radius: 1rem;
    padding: 0.7rem 1rem;
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Nunito', sans-serif;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .um-btn-ghost:active {
    transform: scale(0.96);
  }

  .um-btn-icon {
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
  .um-btn-icon:active {
    transform: scale(0.92);
  }
  .um-btn-icon.danger:active {
    background: var(--incorrect-bg);
    color: var(--incorrect);
  }

  .um-new-btn {
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
    font-family: 'Nunito', sans-serif;
  }
  .um-new-btn:active {
    transform: scale(0.96);
  }

  .um-close-btn {
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
  .um-close-btn:active {
    transform: scale(0.92);
  }

  .um-expand-icon {
    transition: transform 0.2s ease;
  }
  .um-expand-icon.expanded {
    transform: rotate(180deg);
  }

  /* Scroll horizontal para filtros */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* Paginación */
  .um-page-nav {
    display: flex; align-items: center; justify-content: center;
    gap: 0.35rem; flex-wrap: wrap;
  }
  .um-page-btn {
    background: var(--card-bg); color: var(--text-secondary);
    border: 1.5px solid var(--card-border); border-radius: 0.85rem;
    padding: 0.55rem 1rem; font-weight: 700; font-size: 0.8rem; cursor: pointer;
    transition: all 0.2s; font-family: 'Nunito', sans-serif;
  }
  .um-page-btn:active:not(:disabled) { transform: scale(0.96); }
  .um-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .um-page-num {
    min-width: 2.35rem; height: 2.35rem; padding: 0 0.4rem;
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--card-bg); color: var(--text-secondary);
    border: 1.5px solid var(--card-border); border-radius: 0.75rem;
    font-weight: 700; font-size: 0.8rem; cursor: pointer;
    transition: all 0.2s; font-family: 'Nunito', sans-serif;
  }
  .um-page-num:active:not(:disabled):not(.active) { transform: scale(0.94); }
  .um-page-num.active {
    background: var(--text-alternative-b); color: white; border-color: var(--text-alternative-b); cursor: default;
  }
  .um-page-num:disabled { opacity: 0.3; cursor: not-allowed; }
  .um-page-ellipsis {
    min-width: 1.2rem; text-align: center; color: var(--text-muted);
    font-weight: 700; font-size: 0.8rem; user-select: none;
  }
  .um-page-jump {
    display: flex; align-items: center; justify-content: center; gap: 0.4rem;
    font-size: 0.75rem; font-weight: 700; color: var(--text-secondary);
  }
  .um-page-jump input {
    width: 3.25rem; text-align: center;
    background: var(--card-bg); border: 1.5px solid var(--card-border);
    border-radius: 0.65rem; padding: 0.4rem 0.25rem;
    color: var(--text-primary); font-family: 'Nunito', sans-serif;
    font-weight: 700; font-size: 0.8rem; outline: none; transition: border-color 0.2s;
  }
  .um-page-jump input:focus { border-color: var(--text-accent); }
  .um-page-jump input::-webkit-outer-spin-button,
  .um-page-jump input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
`;

const UNITS_PER_PAGE = 20;

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

export default function UnitsManagement() {
  const [units, setUnits] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [expandedUnit, setExpandedUnit] = useState(null);
  const confirm = useConfirm(); // ✅ Hook movido al inicio (sin condiciones)

  const [selectedSubject, setSelectedSubject] = useState("");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pageJumpValue, setPageJumpValue] = useState("");

  const initialForm = { subject: "", name: "", description: "", icon: "📖", order: 1, requiredXP: 0, isActive: true };
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

  useEffect(() => { fetchData(); }, []);

  const filteredUnits = units.filter(unit => {
    const matchesSubject = !selectedSubject || String(unit.subject?._id || unit.subject) === String(selectedSubject);
    const matchesSearch = !search || unit.name.toLowerCase().includes(search.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / UNITS_PER_PAGE));
  const paginatedUnits = filteredUnits.slice((page - 1) * UNITS_PER_PAGE, page * UNITS_PER_PAGE);

  // Si el filtro cambia (o se elimina una unidad), vuelve a la página 1
  // o recorta a la última página válida para no quedar en una vacía.
  useEffect(() => { setPage(1); }, [search, selectedSubject]);
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

  const openModal = (unit = null) => {
    if (unit) {
      setEditingUnit(unit);
      setForm({
        subject: unit.subject?._id || unit.subject,
        name: unit.name, description: unit.description || "",
        icon: unit.icon || "📖", order: unit.order,
        requiredXP: unit.requiredXP || 0, isActive: unit.isActive ?? true
      });
    } else {
      setEditingUnit(null);
      setForm({ ...initialForm, subject: selectedSubject || subjects[0]?._id || "" });
    }
    setShowModal(true);
  };

  const saveUnit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!validarNombre(form.name)) {
      toast.error(NOMBRE_ERROR);
      return;
    }
    try {
      if (editingUnit) {
        await api.put(`/admin/units/${editingUnit._id}`, form);
      } else {
        await api.post(`/admin/subjects/${form.subject}/units`, form);
      }
      setShowModal(false);
      fetchData();
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al guardar. Revisa que el orden no esté repetido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteUnit = async (id) => {
     if (!(await confirm({
     title: "Eliminar unidad",
     message: "Se borrarán todas sus lecciones y preguntas.",
     danger: true,
     confirmText: "Eliminar",
     }))) return;
    try {
      await api.delete(`/admin/units/${id}`);
      fetchData();
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
    } catch (err) {
      toast.error("Error al eliminar la unidad");
    }
  };

  const resetFilters = () => { setSelectedSubject(""); setSearch(""); };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s._id === subjectId);
    return subject?.name || "Sin materia";
  };

  if (loading) {
    return (
      <div className="um-page flex items-center justify-center py-20">
        <style>{UNITS_CSS}</style>
        <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--text-accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="um-page space-y-5 pb-20">
      <style>{UNITS_CSS}</style>

      {/* Header con botón nueva unidad */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight" style={{ color: "var(--text-primary)" }}>
            Unidades
          </h1>
          <p className="text-xs sm:text-sm font-semibold mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {filteredUnits.length} unidades · {subjects.length} materias
          </p>
        </div>
        <button className="um-new-btn" onClick={() => openModal()}>
          <Plus size={16} /> <span className="hidden sm:inline">Nueva Unidad</span>
        </button>
      </div>

      {/* Filtros - Mobile optimizado */}
      <div className="um-filter-bar">
        <div className="space-y-3">
          {/* Selector de materia - Mobile full width */}
          <div>
            <label className="um-label text-[10px]">Filtrar por Materia</label>
            <CustomSelect
              value={selectedSubject}
              onChange={setSelectedSubject}
              options={[{ _id: "", name: "Todas las materias" }, ...subjects]}
              placeholder="Todas las materias"
              getOptionValue={opt => opt._id}
              getOptionLabel={opt => opt.name}
            />
          </div>
          
          {/* Buscador y limpiar en fila */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="um-label text-[10px]">Buscar</label>
              <div className="relative">
                <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input className="um-input pl-9" type="text" placeholder="Nombre..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="flex items-end">
              <button className="um-btn-ghost" onClick={resetFilters}>
                <RotateCcw size={14} /> Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Unidades - Cards */}
      <div className="space-y-3">
        {filteredUnits.length === 0 ? (
          <div className="um-card p-8 text-center">
            <p className="font-bold" style={{ color: "var(--text-secondary)" }}>
              No se encontraron unidades
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
          paginatedUnits.map(unit => (
            <div key={unit._id} className="um-unit-card">
              {/* Header de la tarjeta */}
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setExpandedUnit(expandedUnit === unit._id ? null : unit._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-3xl">{unit.icon || "📖"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-base truncate" style={{ color: "var(--text-primary)" }}>
                        {unit.name}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="um-subject-badge">{getSubjectName(unit.subject?._id || unit.subject)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {/* Botones de acción - No cierran el expand */}
                    <button 
                      className="um-btn-icon" 
                      onClick={(e) => { e.stopPropagation(); openModal(unit); }}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="um-btn-icon danger" 
                      onClick={(e) => { e.stopPropagation(); deleteUnit(unit._id); }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Stats resumidos */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{ borderColor: "var(--card-border)" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Lock size={12} style={{ color: "var(--text-muted)" }} />
                      <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                        XP: {unit.requiredXP || 0}
                      </span>
                    </div>
                    <div className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                      Orden: {unit.order}
                    </div>
                  </div>
                  <div className="text-xs font-bold px-2 py-1 rounded-full" style={{ 
                    background: unit.isActive ? "color-mix(in srgb, var(--correct) 10%, transparent)" : "color-mix(in srgb, var(--incorrect) 10%, transparent)",
                    color: unit.isActive ? "var(--correct)" : "var(--incorrect)"
                  }}>
                    {unit.isActive ? "Activa" : "Inactiva"}
                  </div>
                </div>
              </div>

              {/* Descripción expandible */}
              {expandedUnit === unit._id && unit.description && (
                <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: "var(--card-border)" }}>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {unit.description}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="um-page-nav">
            <button className="um-page-btn" disabled={page === 1} onClick={() => goToPage(1)}>«</button>
            <button className="um-page-btn" disabled={page === 1} onClick={() => goToPage(page - 1)}>Anterior</button>

            {getPageRange(page, totalPages).map((n, idx) =>
              n === "…" ? (
                <span key={`dots-${idx}`} className="um-page-ellipsis">…</span>
              ) : (
                <button
                  key={n}
                  className={`um-page-num ${n === page ? "active" : ""}`}
                  onClick={() => goToPage(n)}
                  aria-current={n === page ? "page" : undefined}
                >
                  {n}
                </button>
              )
            )}

            <button className="um-page-btn" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>Siguiente</button>
            <button className="um-page-btn" disabled={page >= totalPages} onClick={() => goToPage(totalPages)}>»</button>
          </div>

          <form className="um-page-jump" onSubmit={handlePageJumpSubmit}>
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

      {/* Modal - Bottom sheet en móvil */}
      {showModal && (
        <div className="um-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <button className="um-close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>

            <div className="p-5 pt-12">
              <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight mb-5" style={{ color: "var(--text-primary)" }}>
                {editingUnit ? "Editar Unidad" : "Nueva Unidad"}
              </h2>

              <form onSubmit={saveUnit} className="space-y-4">
                <div>
                  <label className="um-label">Materia</label>
                  <CustomSelect
                    value={form.subject}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || NOMBRE_REGEX.test(val)) setForm({ ...form, name: val });
                    }}
                    options={subjects}
                    placeholder="Seleccionar materia…"
                    getOptionValue={opt => opt._id}
                    getOptionLabel={opt => opt.name}
                  />
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-1">
                    <label className="um-label">Icono</label>
                    <input className="um-input text-center text-xl" type="text"
                      value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} maxLength={2} />
                  </div>
                  <div className="col-span-3">
                    <label className="um-label">Nombre</label>
                    <input className="um-input" type="text" placeholder="Ej: Álgebra Lineal"
                      value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                </div>

                <div>
                  <label className="um-label">Descripción</label>
                  <textarea className="um-input" rows={3} value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="De qué trata esta unidad…" style={{ resize: "none" }} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="um-label">Orden</label>
                    <input className="um-input" type="number"
                      value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} required />
                  </div>
                  <div>
                    <label className="um-label">XP Requerido</label>
                    <input className="um-input" type="number"
                      value={form.requiredXP} onChange={e => setForm({ ...form, requiredXP: Number(e.target.value) })} />
                  </div>
                </div>

                <button type="submit" className="um-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando…" : (editingUnit ? "Actualizar" : "Crear Unidad")}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}