import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, RotateCcw, X, Search as SearchIcon, Gem } from "lucide-react";
import api from "../../api/axios";
import CustomSelect from "../../components/ui/CustomSelect";
import { validarNombre, NOMBRE_ERROR } from "../../utils/validators";
import useAuthStore from "../../store/authStore";
import toast from 'react-hot-toast';

const SHOP_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  .shop-mgmt { font-family: 'Nunito', sans-serif; }

  .shop-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .shop-card {
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 1.25rem;
    transition: all 0.2s ease;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .shop-card:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--text-accent) 40%, transparent);
  }

  .shop-filter-bar {
    background: var(--glass-bg);
    border: 1.5px solid var(--glass-border);
    border-radius: 1.5rem;
    padding: 1rem;
    backdrop-filter: blur(10px);
  }

  .shop-input {
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
  .shop-input:focus { border-color: var(--text-accent); background: color-mix(in srgb, var(--text-accent) 4%, var(--card-bg)); }

  .shop-label {
    font-size: 0.7rem;
    font-weight: 800;
    color: var(--text-secondary);
    display: block;
    margin-bottom: 0.4rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .shop-modal-overlay {
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
    .shop-modal-overlay { align-items: center; }
  }
  .shop-modal {
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

  .shop-btn-primary {
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
  }
  .shop-btn-primary:active { transform: scale(0.98); opacity: 0.9; }
  .shop-btn-primary:disabled { background: var(--card-border); color: var(--text-muted); cursor: not-allowed; }

  .shop-btn-ghost {
    background: var(--glass-bg);
    color: var(--text-secondary);
    border: 1.5px solid var(--card-border);
    border-radius: 1rem;
    padding: 0.7rem 1rem;
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .shop-btn-icon {
    background: transparent;
    border: 1.5px solid transparent;
    border-radius: 0.75rem;
    padding: 0.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all 0.18s;
  }
  .shop-btn-icon:active { transform: scale(0.92); }
  .shop-btn-icon.danger:active { background: var(--incorrect-bg); color: var(--incorrect); }

  .shop-new-btn {
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
  }

  .shop-close-btn {
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
  }

  .rarity-badge {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 0.2rem 0.65rem;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .rarity-common { background: color-mix(in srgb, #6c757d 15%, transparent); color: #6c757d; border: 1px solid #6c757d40; }
  .rarity-rare { background: color-mix(in srgb, #007bff 15%, transparent); color: #007bff; border: 1px solid #007bff40; }
  .rarity-epic { background: color-mix(in srgb, #9b59b6 15%, transparent); color: #9b59b6; border: 1px solid #9b59b640; }
  .rarity-legendary { background: color-mix(in srgb, #f39c12 15%, transparent); color: #f39c12; border: 1px solid #f39c1240; }

  /* Preview */
  .preview-frame {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--card-bg);
    border-radius: 1rem;
    transition: box-shadow 0.2s;
    overflow: hidden;
  }
  .preview-bg {
    background-size: cover;
    background-position: center;
    border-radius: 0.75rem;
  }
  .preview-svg {
    background-repeat: repeat;
  }
`;

// Helper fuera del componente para evitar recreación en cada render
function getCurrentThemeHelper() {
  const theme = document.documentElement.getAttribute("data-theme") || "light";
  if (theme === "high-contrast") return "highContrast";
  return theme === "dark" ? "dark" : "light";
}

// Convierte cualquier color CSS válido a #RRGGBB usando canvas.
// Necesario porque <input type="color"> solo acepta ese formato exacto;
// rgb(), hsl(), colores nombrados y hex con alpha hacen que muestre negro.
function cssColorToHex(color) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000000"; // reset antes de asignar
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  } catch {
    return "#000000";
  }
}

// Componente extraído fuera de ShopManagement para evitar desmontaje/remontaje en cada re-render
function ItemPreview({ item, size = "md", userAvatarUrl, previewTheme }) {
  const currentTheme = previewTheme || getCurrentThemeHelper();
  const isFrame = item.type === "frame";
  const bgType = item.backgroundType;
  const previewStyle = {};

  if (isFrame) {
    previewStyle.boxShadow = item.cssValue || "0 0 0 3px var(--text-accent)";
    previewStyle.backgroundColor = "var(--card-bg)";
    previewStyle.display = "flex";
    previewStyle.alignItems = "center";
    previewStyle.justifyContent = "center";
    previewStyle.borderRadius = "1rem";
    previewStyle.overflow = "hidden";
  } else {
    if (bgType === "gradient" && item.themeVariants) {
      const gradientValue = item.themeVariants[currentTheme];
      previewStyle.background = gradientValue || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    } else if (bgType === "svg" && item.patternSvg) {
      let svgString = item.patternSvg;
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue("--text-accent").trim();
      svgString = svgString.replace(/currentColor/g, accentColor);
      const encodedSvg = encodeURIComponent(svgString);
      previewStyle.backgroundImage = `url("data:image/svg+xml,${encodedSvg}")`;
      previewStyle.backgroundRepeat = "repeat";
      previewStyle.backgroundSize = item.patternSize || "40px 40px";
      previewStyle.backgroundColor = "var(--card-bg)";
      previewStyle.opacity = item.patternOpacity ?? 0.25;
    } else if (item.cssValue) {
      previewStyle.background = item.cssValue;
    } else {
      previewStyle.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    }
    previewStyle.borderRadius = "0.75rem";
  }

  // Frames usan tamaño fijo; fondos siempre ancho completo
  const sizeClasses = {
    sm: isFrame ? "w-14 h-14" : "w-full h-16",
    md: isFrame ? "w-20 h-20" : "w-full h-20",
    lg: isFrame ? "w-28 h-28" : "w-full h-28",
  };

  if (isFrame) {
    // El shadow se aplica en el div INTERNO, dentro de un padding del wrapper.
    // Esto evita que el overflow:hidden del padre (shop-card) lo recorte,
    // ya que la sombra queda dentro de los límites del contenedor exterior.
    const frameShadow = item.cssValue || "0 0 0 3px var(--text-accent)";
    return (
      <div
        className={sizeClasses[size]}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--card-bg)",
          borderRadius: "1.25rem",
          padding: "8px",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "0.875rem",
            overflow: "hidden",
            boxShadow: frameShadow,
            flexShrink: 0,
          }}
        >
          <img
            src={userAvatarUrl}
            alt="Avatar preview"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} preview-bg ${bgType === "svg" ? "preview-svg" : ""}`}
      style={previewStyle}
    />
  );
}

export default function ShopManagement() {
  const { user } = useAuthStore(); // Obtener usuario actual
  const userAvatarUrl = user?.avatar || "https://via.placeholder.com/80?text=Avatar"; // fallback

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");
  const [search, setSearch] = useState("");

  const initialForm = {
    name: "",
    description: "",
    type: "frame",
    price: 0,
    rarity: "common",
    isActive: true,
    assetUrl: "",
    cssValue: "",
    backgroundType: null,
    themeVariants: { light: "", dark: "", highContrast: "" },
    patternSvg: "",
    patternOpacity: 0.25,
    patternSize: "40px 40px",
  };
  const [form, setForm] = useState(initialForm);

  // Estado para el editor visual de gradientes
  const [gradientAngle, setGradientAngle] = useState("135deg");
  const [manualMode, setManualMode] = useState({ light: false, dark: false, highContrast: false });
  // Tema seleccionado para previsualizar fondos en el modal (independiente del tema de la app)
  const [previewTheme, setPreviewTheme] = useState(getCurrentThemeHelper);

  // Función para construir un gradiente lineal a partir de colores y ángulo
  const buildGradientCSS = (startColor, endColor, angle = gradientAngle) => {
    if (!startColor && !endColor) return "";
    return `linear-gradient(${angle}, ${startColor || "#000"}, ${endColor || "#000"})`;
  };

  // Manejar cambio de color en un tema específico (inicio o fin)
  const handleGradientColorChange = (theme, position, color) => {
    const currentGradient = form.themeVariants[theme];
    let startColor = "#000000", endColor = "#ffffff";
    const match = currentGradient.match(/linear-gradient\([^,]+,\s*([^,]+),\s*([^)]+)\)/);
    if (match) {
      startColor = cssColorToHex(match[1].trim());
      endColor = cssColorToHex(match[2].trim());
    }
    if (position === "start") startColor = color;
    else endColor = color;
    const newGradient = buildGradientCSS(startColor, endColor);
    setForm({
      ...form,
      themeVariants: { ...form.themeVariants, [theme]: newGradient }
    });
  };

  // Manejar cambio de ángulo (actualiza todos los temas que no estén en modo manual)
  const handleAngleChange = (newAngle) => {
    setGradientAngle(newAngle);
    const updatedVariants = { ...form.themeVariants };
    for (const theme of ["light", "dark", "highContrast"]) {
      if (!manualMode[theme] && updatedVariants[theme]) {
        const match = updatedVariants[theme].match(/linear-gradient\([^,]+,\s*([^,]+),\s*([^)]+)\)/);
        if (match) {
          const start = cssColorToHex(match[1].trim());
          const end = cssColorToHex(match[2].trim());
          updatedVariants[theme] = buildGradientCSS(start, end, newAngle);
        }
      }
    }
    setForm({ ...form, themeVariants: updatedVariants });
  };

  // Alternar entre modo visual y manual para cada tema
  const toggleManualMode = (theme) => {
    setManualMode(prev => ({ ...prev, [theme]: !prev[theme] }));
  };



  const fetchItems = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.append("type", filterType);
      if (filterRarity !== "all") params.append("rarity", filterRarity);
      if (search) params.append("search", search);
      const res = await api.get(`/admin/shop-items?${params.toString()}`);
      setItems(res.data.data);
    } catch (err) {
      console.error("Error cargando items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filterType, filterRarity, search]);

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({
        name: item.name,
        description: item.description || "",
        type: item.type,
        price: item.price,
        rarity: item.rarity,
        isActive: item.isActive,
        assetUrl: item.assetUrl || "",
        cssValue: item.cssValue || "",
        backgroundType: item.backgroundType || null,
        themeVariants: item.themeVariants || { light: "", dark: "", highContrast: "" },
        patternSvg: item.patternSvg || "",
        patternOpacity: item.patternOpacity ?? 0.25,
        patternSize: item.patternSize || "40px 40px",
      });
      // Intentar extraer el ángulo del primer gradiente para inicializar gradientAngle
      const firstGradient = item.themeVariants?.light || "";
      const angleMatch = firstGradient.match(/linear-gradient\(([^,]+),/);
      if (angleMatch) setGradientAngle(angleMatch[1]);
      else setGradientAngle("135deg");
      setManualMode({ light: false, dark: false, highContrast: false });
    } else {
      setEditingItem(null);
      setForm(initialForm);
      setGradientAngle("135deg");
      setManualMode({ light: false, dark: false, highContrast: false });
    }
    setPreviewTheme(getCurrentThemeHelper());
    setShowModal(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    if (!validarNombre(form.name)) {
      toast.error(NOMBRE_ERROR);
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/admin/shop-items/${editingItem._id}`, form);
      } else {
        await api.post("/admin/shop-items", form);
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al guardar el item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (id) => {
    if (!confirm("¿Eliminar este item? Los usuarios que lo tengan lo perderán.")) return;
    try {
      await api.delete(`/admin/shop-items/${id}`);
      fetchItems();
    } catch (err) {
      toast.error("Error al eliminar el item");
    }
  };

  const resetFilters = () => {
    setFilterType("all");
    setFilterRarity("all");
    setSearch("");
  };

  const getRarityClass = (rarity) => {
    switch (rarity) {
      case "common": return "rarity-common";
      case "rare": return "rarity-rare";
      case "epic": return "rarity-epic";
      case "legendary": return "rarity-legendary";
      default: return "";
    }
  };

  if (loading) {
    return (
      <div className="shop-mgmt flex items-center justify-center py-20">
        <style>{SHOP_CSS}</style>
        <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--text-accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="shop-mgmt space-y-5 pb-20">
      <style>{SHOP_CSS}</style>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight" style={{ color: "var(--text-primary)" }}>
            Tienda
          </h1>
          <p className="text-xs sm:text-sm font-semibold mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {items.length} items
          </p>
        </div>
        <button className="shop-new-btn" onClick={() => openModal()}>
          <Plus size={16} /> <span className="hidden sm:inline">Nuevo Item</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="shop-filter-bar">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="shop-label">Tipo</label>
              <CustomSelect
                value={filterType}
                onChange={setFilterType}
                options={[
                  { _id: "all", name: "Todos" },
                  { _id: "frame", name: "Marco" },
                  { _id: "background", name: "Fondo" }
                ]}
                getOptionValue={opt => opt._id}
                getOptionLabel={opt => opt.name}
              />
            </div>
            <div>
              <label className="shop-label">Rareza</label>
              <CustomSelect
                value={filterRarity}
                onChange={setFilterRarity}
                options={[
                  { _id: "all", name: "Todas" },
                  { _id: "common", name: "Común" },
                  { _id: "rare", name: "Rara" },
                  { _id: "epic", name: "Épica" },
                  { _id: "legendary", name: "Legendaria" }
                ]}
                getOptionValue={opt => opt._id}
                getOptionLabel={opt => opt.name}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="shop-label">Buscar</label>
              <div className="relative">
                <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input className="shop-input pl-9" type="text" placeholder="Nombre..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="flex items-end">
              <button className="shop-btn-ghost" onClick={resetFilters}>
                <RotateCcw size={14} /> Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de items */}
      <div className="shop-grid">
        {items.length === 0 ? (
          <div className="shop-card p-8 text-center col-span-full">
            <p className="font-bold" style={{ color: "var(--text-secondary)" }}>No se encontraron items</p>
            <button onClick={resetFilters} className="mt-3 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-accent)" }}>Limpiar filtros</button>
          </div>
        ) : (
          items.map(item => (
            <div key={item._id} className="shop-card">
              <div className={`p-3 pb-0 ${item.type === "frame" ? "flex justify-center" : ""}`}>
                <ItemPreview item={item} size="md" userAvatarUrl={userAvatarUrl} />
              </div>
              <div className="p-3 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-base truncate" style={{ color: "var(--text-primary)" }}>{item.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className={`rarity-badge ${getRarityClass(item.rarity)}`}>{item.rarity}</span>
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "var(--glass-bg-small)", color: "var(--text-accent)" }}>{item.type}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="shop-btn-icon" onClick={() => openModal(item)}><Edit size={16} /></button>
                    <button className="shop-btn-icon danger" onClick={() => deleteItem(item._id)}><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1 pt-2 border-t" style={{ borderColor: "var(--card-border)" }}>
                  <div className="flex items-center gap-1">
                    <Gem size={14} style={{ color: "var(--correct)" }} />
                    <span className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>{item.price} gemas</span>
                  </div>
                  <div className="text-xs font-bold px-2 py-1 rounded-full" style={{
                    background: item.isActive ? "color-mix(in srgb, var(--correct) 10%, transparent)" : "color-mix(in srgb, var(--incorrect) 10%, transparent)",
                    color: item.isActive ? "var(--correct)" : "var(--incorrect)"
                  }}>
                    {item.isActive ? "Activo" : "Inactivo"}
                  </div>
                </div>
                {item.description && (
                  <p className="text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>{item.description}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de creación/edición */}
      {showModal && (
        <div className="shop-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="shop-modal" onClick={e => e.stopPropagation()}>
            <button className="shop-close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
            <div className="p-5 pt-12">
              <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight mb-5" style={{ color: "var(--text-primary)" }}>
                {editingItem ? "Editar Item" : "Nuevo Item"}
              </h2>
              <form onSubmit={saveItem} className="space-y-4">
                <div>
                  <label className="shop-label">Nombre *</label>
                  <input className="shop-input" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="shop-label">Descripción</label>
                  <textarea className="shop-input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="shop-label">Tipo</label>
                    <CustomSelect
                      value={form.type}
                      onChange={val => setForm({ ...form, type: val })}
                      options={[
                        { _id: "frame", name: "Marco" },
                        { _id: "background", name: "Fondo" }
                      ]}
                      getOptionValue={opt => opt._id}
                      getOptionLabel={opt => opt.name}
                    />
                  </div>
                  <div>
                    <label className="shop-label">Rareza</label>
                    <CustomSelect
                      value={form.rarity}
                      onChange={val => setForm({ ...form, rarity: val })}
                      options={[
                        { _id: "common", name: "Común" },
                        { _id: "rare", name: "Rara" },
                        { _id: "epic", name: "Épica" },
                        { _id: "legendary", name: "Legendaria" }
                      ]}
                      getOptionValue={opt => opt._id}
                      getOptionLabel={opt => opt.name}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="shop-label">Precio (gemas)</label>
                    <input className="shop-input" type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="shop-label">Activo</label>
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <label className="shop-label">CSS Value (para marcos o fondos simples)</label>
                  <input className="shop-input" type="text" placeholder="box-shadow: 0 0 0 3px gold, ..." value={form.cssValue} onChange={e => setForm({ ...form, cssValue: e.target.value })} />
                </div>

                {form.type === "background" && (
                  <>
                    <div>
                      <label className="shop-label">Tipo de fondo</label>
                      <CustomSelect
                        value={form.backgroundType || ""}
                        onChange={val => setForm({ ...form, backgroundType: val || null })}
                        options={[
                          { _id: "", name: "Ninguno (solo CSS)" },
                          { _id: "gradient", name: "Gradiente adaptativo por tema" },
                          { _id: "svg", name: "Patrón SVG" }
                        ]}
                        getOptionValue={opt => opt._id}
                        getOptionLabel={opt => opt.name}
                      />
                    </div>

                    {form.backgroundType === "gradient" && (
                      <div className="space-y-4">
                        <div>
                          <label className="shop-label">Ángulo del gradiente</label>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            step="1"
                            value={parseInt(gradientAngle)}
                            onChange={(e) => handleAngleChange(`${e.target.value}deg`)}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted mt-1">
                            <span>0°</span><span>90°</span><span>180°</span><span>270°</span><span>360°</span>
                          </div>
                          <input
                            type="text"
                            value={gradientAngle}
                            onChange={(e) => handleAngleChange(e.target.value)}
                            className="shop-input mt-2"
                            placeholder="Ej: 135deg, to right, etc."
                          />
                        </div>

                        <div className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--card-border)" }}>
                          <table className="w-full text-sm">
                            <thead className="bg-glass-bg">
                              <tr>
                                <th className="p-2 text-left">Tema</th>
                                <th className="p-2 text-left">Color inicial</th>
                                <th className="p-2 text-left">Color final</th>
                                <th className="p-2 text-left">Acción</th>
                              </tr>
                            </thead>
                            <tbody>
                              {["light", "dark", "highContrast"].map((theme) => {
                                const themeLabel = theme === "light" ? "🌞 Claro" : (theme === "dark" ? "🌙 Oscuro" : "♿ Alto contraste");
                                const currentGradient = form.themeVariants[theme];
                                let startColor = "#000000", endColor = "#ffffff";
                                const match = currentGradient.match(/linear-gradient\([^,]+,\s*([^,]+),\s*([^)]+)\)/);
                                if (match) {
                                  startColor = cssColorToHex(match[1].trim());
                                  endColor = cssColorToHex(match[2].trim());
                                }
                                return (
                                  <tr key={theme} className="border-t" style={{ borderColor: "var(--card-border)" }}>
                                    <td className="p-2 font-bold">{themeLabel}</td>
                                    <td className="p-2">
                                      <input
                                        type="color"
                                        value={startColor}
                                        onChange={(e) => handleGradientColorChange(theme, "start", e.target.value)}
                                        disabled={manualMode[theme]}
                                        className="w-10 h-10 rounded border"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <input
                                        type="color"
                                        value={endColor}
                                        onChange={(e) => handleGradientColorChange(theme, "end", e.target.value)}
                                        disabled={manualMode[theme]}
                                        className="w-10 h-10 rounded border"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <button
                                        type="button"
                                        onClick={() => toggleManualMode(theme)}
                                        className="text-xs px-2 py-1 rounded bg-glass-bg"
                                      >
                                        {manualMode[theme] ? "Usar selectores" : "Edición manual"}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {Object.entries(manualMode).some(([_, active]) => active) && (
                          <div className="space-y-2 mt-2">
                            <label className="shop-label">Valores CSS (edición manual)</label>
                            {manualMode.light && (
                              <input
                                className="shop-input"
                                placeholder="Light gradient"
                                value={form.themeVariants.light}
                                onChange={(e) => setForm({ ...form, themeVariants: { ...form.themeVariants, light: e.target.value } })}
                              />
                            )}
                            {manualMode.dark && (
                              <input
                                className="shop-input"
                                placeholder="Dark gradient"
                                value={form.themeVariants.dark}
                                onChange={(e) => setForm({ ...form, themeVariants: { ...form.themeVariants, dark: e.target.value } })}
                              />
                            )}
                            {manualMode.highContrast && (
                              <input
                                className="shop-input"
                                placeholder="High contrast gradient"
                                value={form.themeVariants.highContrast}
                                onChange={(e) => setForm({ ...form, themeVariants: { ...form.themeVariants, highContrast: e.target.value } })}
                              />
                            )}
                          </div>
                        )}

                        <div className="p-2 rounded-xl" style={{ background: "var(--glass-bg-small)" }}>
                          <label className="shop-label block text-center mb-2">Vista previa (selecciona tema)</label>
                          <div className="flex gap-1 justify-center mb-2">
                            {[
                              { key: "light", label: "🌞 Claro" },
                              { key: "dark", label: "🌙 Oscuro" },
                              { key: "highContrast", label: "♿ Alto contraste" },
                            ].map(({ key, label }) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setPreviewTheme(key)}
                                className="text-xs px-2 py-1 rounded-lg font-bold transition-all"
                                style={{
                                  background: previewTheme === key ? "var(--text-accent)" : "var(--glass-bg)",
                                  color: previewTheme === key ? "white" : "var(--text-secondary)",
                                  border: `1.5px solid ${previewTheme === key ? "var(--text-accent)" : "var(--card-border)"}`,
                                }}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          <div
                            className="h-20 rounded-lg"
                            style={{ background: form.themeVariants[previewTheme] || "transparent" }}
                          />
                        </div>
                      </div>
                    )}

                    {form.backgroundType === "svg" && (
                      <>
                        <div>
                          <label className="shop-label">Patrón SVG (usa currentColor para trazos)</label>
                          <textarea className="shop-input" rows={4} value={form.patternSvg} onChange={e => setForm({ ...form, patternSvg: e.target.value })} placeholder={`<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="..." fill="currentColor"/></svg>`} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="shop-label">Opacidad (0-1)</label>
                            <input className="shop-input" type="number" step="0.01" min="0" max="1" value={form.patternOpacity} onChange={e => setForm({ ...form, patternOpacity: parseFloat(e.target.value) })} />
                          </div>
                          <div>
                            <label className="shop-label">Tamaño del tile (ej: 40px 40px)</label>
                            <input className="shop-input" type="text" value={form.patternSize} onChange={e => setForm({ ...form, patternSize: e.target.value })} />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Vista previa en vivo en el modal */}
                <div className="mt-2 p-3 rounded-xl" style={{ background: "var(--glass-bg-small)", border: "1px solid var(--card-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="shop-label mb-0">Vista previa en tiempo real</label>
                    {form.type === "background" && (
                      <div className="flex gap-1">
                        {[
                          { key: "light", label: "🌞" },
                          { key: "dark", label: "🌙" },
                          { key: "highContrast", label: "♿" },
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setPreviewTheme(key)}
                            className="text-xs px-2 py-1 rounded-lg font-bold transition-all"
                            style={{
                              background: previewTheme === key ? "var(--text-accent)" : "var(--glass-bg)",
                              color: previewTheme === key ? "white" : "var(--text-secondary)",
                              border: `1.5px solid ${previewTheme === key ? "var(--text-accent)" : "var(--card-border)"}`,
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={form.type === "frame" ? "flex justify-center" : ""}>
                    <ItemPreview item={form} size="lg" userAvatarUrl={userAvatarUrl} previewTheme={previewTheme} />
                  </div>
                </div>

                <button type="submit" className="shop-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando…" : (editingItem ? "Actualizar" : "Crear Item")}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}