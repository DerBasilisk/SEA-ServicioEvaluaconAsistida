// src/pages/Shop.jsx
import { useEffect, useState } from "react";
import { useActiveTheme } from "../hooks/useActiveTheme";
import { resolveBackground, resolveSvgPattern, getRenderMode } from "../hooks/shopItem";
import { ShoppingBag, Package, Gem, CheckCircle2, Sparkles, RefreshCw } from "lucide-react";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

/* ─────────────────────────────────────────────
   Rareza → colores y etiqueta
───────────────────────────────────────────── */
const RARITY = {
  common:    { label: "Común",     color: "#64748b", glow: "#64748b22", badge: "#f1f5f9", badgeText: "#475569" },
  rare:      { label: "Raro",      color: "#3b82f6", glow: "#3b82f622", badge: "#eff6ff", badgeText: "#1d4ed8" },
  epic:      { label: "Épico",     color: "#8b5cf6", glow: "#8b5cf622", badge: "#f5f3ff", badgeText: "#6d28d9" },
  legendary: { label: "Legendario",color: "#f59e0b", glow: "#f59e0b30", badge: "#fffbeb", badgeText: "#b45309" },
};

/* ─────────────────────────────────────────────
   CSS del módulo
───────────────────────────────────────────── */
const SHOP_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,800;1,900&display=swap');

  .sea-shop { font-family: 'Nunito', sans-serif; }

  .sea-shop *:focus-visible {
    outline: 3px solid var(--text-accent);
    outline-offset: 3px;
    border-radius: 0.5rem;
  }

  /* ── Glass ── */
  .sea-glass-main {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 8px 32px var(--glass-shadow);
    color: var(--text-primary);
  }
  .sea-sidebar-card {
    background: var(--sidebar-bg);
    border: 1.5px solid var(--sidebar-border);
    backdrop-filter: blur(10px);
  }

  /* ── Tabs ── */
  .shop-tab-bar {
    display: flex;
    gap: 6px;
    padding: 5px;
    border-radius: 16px;
    background: var(--progress-track);
    border: 1.5px solid var(--glass-border);
  }
  .shop-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 9px 16px;
    border-radius: 12px;
    border: none;
    background: transparent;
    font-family: 'Nunito', sans-serif;
    font-weight: 800;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    cursor: pointer;
    color: var(--text-secondary);
    transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
  }
  .shop-tab.active {
    background: var(--card-bg);
    color: var(--text-accent);
    box-shadow: 0 2px 12px var(--glass-shadow);
    border: 1.5px solid var(--glass-border);
  }

  /* ── Item Cards ── */
  .shop-item-card {
    background: var(--card-bg);
    border: 2px solid var(--card-border);
    border-radius: 1.5rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                box-shadow 0.3s ease,
                border-color 0.2s ease;
  }
  .shop-item-card:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 16px 40px var(--glass-shadow);
  }
  .shop-item-card.owned {
    border-color: var(--card-border);
    opacity: 0.9;
  }

  /* Preview visual */
  .item-preview {
    width: 100%;
    height: 90px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  .item-preview-frame {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
  }
  .item-preview-bg {
    position: absolute;
    inset: 0;
  }
  .item-preview-bg-label {
    position: relative;
    z-index: 1;
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: white;
    text-shadow: 0 1px 4px rgba(0,0,0,0.5);
    background: rgba(0,0,0,0.28);
    padding: 3px 10px;
    border-radius: 99px;
    backdrop-filter: blur(4px);
  }

  /* Rarity stripe top */
  .rarity-stripe {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
  }

  /* Rarity badge */
  .rarity-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 99px;
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* Owned checkmark overlay */
  .owned-overlay {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    width: 26px;
    height: 26px;
    border-radius: 99px;
    background: #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(16,185,129,0.4);
  }

  /* Buy / Equip buttons */
  .btn-buy {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px 12px;
    border-radius: 12px;
    border: none;
    font-family: 'Nunito', sans-serif;
    font-weight: 900;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s, filter 0.15s;
    background: var(--text-accent);
    color: white;
  }
  .btn-buy:hover:not(:disabled) { filter: brightness(1.1); transform: scale(1.02); }
  .btn-buy:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn-buy.insufficient { background: #ef4444; }

  .btn-equip {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px 12px;
    border-radius: 12px;
    border: 2px solid var(--glass-border);
    font-family: 'Nunito', sans-serif;
    font-weight: 900;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.15s;
    background: transparent;
    color: var(--text-primary);
  }
  .btn-equip:hover { background: var(--progress-track); border-color: var(--text-accent); color: var(--text-accent); }
  .btn-equip.equipped {
    background: linear-gradient(135deg, #10b98122, #10b98108);
    border-color: #10b98155;
    color: #10b981;
  }
  .btn-equip.equipped:hover {
    background: #ef444415;
    border-color: #ef444455;
    color: #ef4444;
  }

  /* Filter chips */
  .filter-chip {
    padding: 5px 14px;
    border-radius: 99px;
    border: 1.5px solid var(--glass-border);
    background: transparent;
    font-family: 'Nunito', sans-serif;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }
  .filter-chip:hover { border-color: var(--text-accent); color: var(--text-accent); }
  .filter-chip.active {
    background: var(--text-accent);
    border-color: var(--text-accent);
    color: white;
  }

  /* Toast notif */
  .shop-toast {
    position: fixed;
    bottom: 90px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 999;
    padding: 10px 22px;
    border-radius: 14px;
    font-family: 'Nunito', sans-serif;
    font-weight: 900;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: white;
    box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    animation: toast-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    white-space: nowrap;
  }
  @keyframes toast-in {
    from { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.95); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }

  /* Skeleton */
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .skeleton {
    border-radius: 1.5rem;
    background: linear-gradient(90deg,
      rgba(255,255,255,0.06) 25%,
      rgba(255,255,255,0.14) 50%,
      rgba(255,255,255,0.06) 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s infinite;
  }

  /* Animations */
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-in { animation: fadeSlideUp 0.45s ease both; }
  .delay-1 { animation-delay: 0.08s; }
  .delay-2 { animation-delay: 0.16s; }
  .delay-3 { animation-delay: 0.24s; }

  /* Stat pill */
  .stat-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.75rem;
    border-radius: 99px;
    font-size: 0.65rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.3);
  }
`;

/* ─────────────────────────────────────────────
   Preview de item según tipo
───────────────────────────────────────────── */
function ItemPreview({ item }) {
  const theme   = useActiveTheme();
  const r       = RARITY[item.rarity] || RARITY.common;
  const mode    = getRenderMode(item);

  // ── Marco ──────────────────────────────────
  if (mode === "frame") {
    return (
      <div className="item-preview" style={{ background: "var(--progress-track)" }}>
        <div
          className="item-preview-frame"
          style={{ boxShadow: `0 0 0 3px ${r.color}, 0 0 18px ${r.glow}` }}
          aria-hidden="true"
        >
          🎓
        </div>
      </div>
    );
  }

  // ── Fondo: gradiente adaptativo ────────────
  if (mode === "gradient") {
    const bg = resolveBackground(item, theme);
    return (
      <div className="item-preview" style={{ background: bg || "var(--progress-track)" }}>
        <span className="item-preview-bg-label">Vista previa</span>
      </div>
    );
  }

  // ── Fondo: patrón SVG sobre fondo del tema ─
  if (mode === "svg") {
    const pattern = resolveSvgPattern(item, theme);
    return (
      <div className="item-preview" style={{ background: "var(--progress-track)", position: "relative" }}>
        {pattern && (
          <div className="item-preview-bg" style={pattern} aria-hidden="true" />
        )}
        <span className="item-preview-bg-label" style={{ position: "relative", zIndex: 1 }}>
          Vista previa
        </span>
      </div>
    );
  }

  // ── Fallback: cssValue directo (items viejos) ──
  return (
    <div className="item-preview">
      <div
        className="item-preview-bg"
        style={{ background: item.cssValue, backgroundSize: "cover" }}
        aria-hidden="true"
      />
      <span className="item-preview-bg-label">Vista previa</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Card de item — tienda
───────────────────────────────────────────── */
function ShopItemCard({ item, onBuy, buying, userGems }) {
  const r = RARITY[item.rarity] || RARITY.common;
  const canAfford = userGems >= item.price;

  return (
    <div
      className={`shop-item-card${item.owned ? " owned" : ""}`}
      style={item.owned ? {} : { boxShadow: `0 0 0 0 transparent` }}
    >
      {/* Stripe superior de rareza */}
      <div
        className="rarity-stripe"
        style={{ background: r.color }}
        aria-hidden="true"
      />

      {/* Checkmark si ya es tuyo */}
      {item.owned && (
        <div className="owned-overlay" aria-label="Ya adquirido">
          <CheckCircle2 size={15} color="white" strokeWidth={3} />
        </div>
      )}

      {/* Preview visual */}
      <ItemPreview item={item} />

      {/* Info */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Nombre + rareza */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-black italic uppercase tracking-tight leading-tight text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {item.name}
          </h3>
          <span
            className="rarity-badge shrink-0"
            style={{ background: r.badge, color: r.badgeText }}
          >
            <Sparkles size={8} />
            {r.label}
          </span>
        </div>

        {/* Descripción */}
        <p
          className="text-xs font-semibold leading-snug flex-1"
          style={{ color: "var(--text-secondary)" }}
        >
          {item.description}
        </p>

        {/* Tipo */}
        <span
          className="text-[9px] font-black uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          {item.type === "frame" ? "Marco de avatar" : "Fondo de perfil"}
        </span>

        {/* Precio + botón */}
        <div className="flex items-center gap-2 mt-1">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0"
            style={{ background: "var(--progress-track)", border: "1.5px solid var(--glass-border)" }}
          >
            <img src="/gems.png" style={{ width: 16, height: 16, objectFit: "contain" }} alt="gemas" />
            <span className="font-black text-sm" style={{ color: "var(--text-primary)" }}>
              {item.price}
            </span>
          </div>

          {item.owned ? (
            <div
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
              style={{ background: "#10b98115", color: "#10b981", border: "1.5px solid #10b98133" }}
            >
              <CheckCircle2 size={12} strokeWidth={3} />
              Adquirido
            </div>
          ) : (
            <button
              className={`btn-buy flex-1${!canAfford ? " insufficient" : ""}`}
              onClick={() => onBuy(item)}
              disabled={buying === item._id || !canAfford}
              aria-label={canAfford ? `Comprar ${item.name} por ${item.price} gemas` : "Gemas insuficientes"}
            >
              {buying === item._id ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : !canAfford ? (
                <>Sin gemas</>
              ) : (
                <>Comprar</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Card de inventario
───────────────────────────────────────────── */
function InventoryItemCard({ entry, onEquip, onUnequip, equipping }) {
  const item = entry.itemId;
  if (!item) return null;
  const r = RARITY[item.rarity] || RARITY.common;
  const isEquipped = entry.isEquipped;

  return (
    <div className="shop-item-card">
      <div className="rarity-stripe" style={{ background: r.color }} aria-hidden="true" />

      {isEquipped && (
        <div className="owned-overlay" style={{ background: "var(--text-accent)" }} aria-label="Equipado">
          <Sparkles size={13} color="white" />
        </div>
      )}

      <ItemPreview item={item} />

      <div className="flex flex-col gap-2 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-black italic uppercase tracking-tight leading-tight text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {item.name}
          </h3>
          <span className="rarity-badge shrink-0" style={{ background: r.badge, color: r.badgeText }}>
            <Sparkles size={8} />
            {r.label}
          </span>
        </div>

        <p className="text-xs font-semibold leading-snug flex-1" style={{ color: "var(--text-secondary)" }}>
          {item.description}
        </p>

        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          {item.type === "frame" ? "Marco de avatar" : "Fondo de perfil"}
        </span>

        <button
          className={`btn-equip mt-1${isEquipped ? " equipped" : ""}`}
          onClick={() => isEquipped ? onUnequip(item.type) : onEquip(entry._id, item._id)}
          disabled={equipping === entry._id}
          aria-label={isEquipped ? `Desequipar ${item.name}` : `Equipar ${item.name}`}
        >
          {equipping === entry._id ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : isEquipped ? (
            <>
              <CheckCircle2 size={12} strokeWidth={3} />
              Equipado — Quitar
            </>
          ) : (
            <>
              <Sparkles size={12} />
              Equipar
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Toast de notificación
───────────────────────────────────────────── */
function Toast({ msg, type }) {
  if (!msg) return null;
  const bg = type === "error" ? "#ef4444" : type === "warn" ? "#f59e0b" : "#10b981";
  return (
    <div className="shop-toast" style={{ background: bg }} role="alert" aria-live="polite">
      {msg}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Skeleton loader
───────────────────────────────────────────── */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4" aria-busy="true">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 260 }} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Página principal
───────────────────────────────────────────── */
export default function Shop() {
  const { user, fetchMe } = useAuthStore();

  const [tab, setTab]           = useState("store");   // "store" | "inventory"
  const [items, setItems]       = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");     // "all" | "frame" | "background"
  const [buying, setBuying]     = useState(null);
  const [equipping, setEquipping] = useState(null);
  const [toast, setToast]       = useState(null);      // { msg, type }

  /* ── Cargar datos ── */
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [shopRes, invRes] = await Promise.all([
        api.get("/shop/items"),
        api.get("/shop/inventory"),
      ]);
      setItems(shopRes.data || []);
      setInventory(invRes.data || []);
    } catch (err) {
      console.error("Shop load error:", err);
      showToast("Error al cargar la tienda", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── Toast helper ── */
  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  /* ── Comprar ── */
  const handleBuy = async (item) => {
    if (buying) return;
    setBuying(item._id);
    try {
      const res = await api.post(`/shop/buy/${item._id}`);
      showToast(`¡${item.name} adquirido! 💎 ${res.data.gemsRemaining} restantes`);
      await Promise.all([loadAll(), fetchMe()]);
    } catch (err) {
      const msg = err.response?.data?.message || "Error al comprar";
      showToast(msg, "error");
    } finally {
      setBuying(null);
    }
  };

  /* ── Equipar ── */
  const handleEquip = async (entryId, itemId) => {
    if (equipping) return;
    setEquipping(entryId);
    try {
      await api.put(`/shop/equip/${itemId}`);
      showToast("¡Item equipado!");
      await Promise.all([loadAll(), fetchMe()]);
    } catch (err) {
      showToast(err.response?.data?.message || "Error al equipar", "error");
    } finally {
      setEquipping(null);
    }
  };

  /* ── Desequipar ── */
  const handleUnequip = async (type) => {
    try {
      await api.put(`/shop/unequip/${type}`);
      showToast("Item desequipado");
      await Promise.all([loadAll(), fetchMe()]);
    } catch (err) {
      showToast(err.response?.data?.message || "Error al desequipar", "error");
    }
  };

  /* ── Filtrado ── */
  const filteredItems = items.filter(
    (i) => filter === "all" || i.type === filter
  );
  const filteredInventory = inventory.filter(
    (e) => e.itemId && (filter === "all" || e.itemId?.type === filter)
  );

  const gems = user?.gems || 0;

  /* ── Render ── */
  return (
    <div
      className="sea-shop min-h-screen pb-28 lg:pb-12 relative overflow-x-hidden"
      style={{ background: "var(--bg-gradient)", color: "var(--text-primary)" }}
    >
      <style>{SHOP_CSS}</style>

      {/* Blobs decorativos */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-[-8%] left-[-12%] w-[480px] h-[480px] rounded-full"
          style={{ background: "var(--deco-blob)", filter: "blur(90px)" }}
        />
        <div
          className="absolute bottom-[-8%] right-[-12%] w-[420px] h-[420px] rounded-full"
          style={{ background: "var(--deco-blob2)", filter: "blur(100px)" }}
        />
      </div>

      <Navbar />

      <main
        className="w-full max-w-[1600px] mx-auto px-3 sm:px-5 pt-4 sm:pt-6 relative z-10 flex flex-col gap-4 lg:gap-6"
        id="main-content"
        aria-label="Tienda"
      >

        {/* ══ HEADER ══ */}
        <section className="sea-glass-main rounded-2xl lg:rounded-[2.5rem] p-5 sm:p-7 relative overflow-hidden animate-in">
          {/* Ícono decorativo fondo */}
          <ShoppingBag
            size={160}
            aria-hidden="true"
            className="absolute -top-4 -right-6 opacity-[0.04] -rotate-12 pointer-events-none"
            style={{ color: "var(--text-primary)" }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="stat-pill mb-2" style={{ color: "var(--text-accent)" }} aria-hidden="true">
                <ShoppingBag size={10} /> Tienda SEA
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black italic uppercase tracking-tighter leading-none">
                Arsenal
              </h1>
              <p className="text-sm font-semibold mt-1.5 max-w-sm" style={{ color: "var(--text-secondary)" }}>
                Personaliza tu perfil con marcos y fondos exclusivos.
              </p>
            </div>

            {/* Contador de gemas */}
            <div
              className="flex items-center gap-3 px-5 py-3 rounded-2xl shrink-0"
              style={{ background: "var(--progress-track)", border: "1.5px solid var(--glass-border)" }}
              aria-label={`${gems} gemas disponibles`}
            >
              <img src="/gems.png" style={{ width: 32, height: 32, objectFit: "contain" }} alt="gemas" />
              <div>
                <p className="text-2xl font-black italic leading-none" style={{ color: "var(--text-primary)" }}>
                  {gems}
                </p>
                <p className="text-[9px] font-black uppercase tracking-widest mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  Gemas
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══ CONTROLES: TABS + FILTROS ══ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in delay-1">
          {/* Tabs */}
          <div className="shop-tab-bar w-full sm:w-auto">
            <button
              className={`shop-tab${tab === "store" ? " active" : ""}`}
              onClick={() => setTab("store")}
              aria-pressed={tab === "store"}
            >
              <ShoppingBag size={14} />
              Tienda
            </button>
            <button
              className={`shop-tab${tab === "inventory" ? " active" : ""}`}
              onClick={() => setTab("inventory")}
              aria-pressed={tab === "inventory"}
            >
              <Package size={14} />
              Inventario
              {inventory.length > 0 && (
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black"
                  style={{ background: "var(--text-accent)", color: "white" }}
                >
                  {inventory.length}
                </span>
              )}
            </button>
          </div>

          {/* Filtros de tipo */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {["all", "frame", "background"].map((f) => (
              <button
                key={f}
                className={`filter-chip${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
              >
                {f === "all" ? "Todos" : f === "frame" ? "Marcos" : "Fondos"}
              </button>
            ))}
          </div>
        </div>

        {/* ══ GRID DE ITEMS ══ */}
        {loading ? (
          <SkeletonGrid />
        ) : tab === "store" ? (
          filteredItems.length === 0 ? (
            <EmptyState message="No hay items en esta categoría." />
          ) : (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4 animate-in delay-2"
              role="list"
              aria-label="Items de la tienda"
            >
              {filteredItems.map((item) => (
                <div key={item._id} role="listitem">
                  <ShopItemCard
                    item={item}
                    onBuy={handleBuy}
                    buying={buying}
                    userGems={gems}
                  />
                </div>
              ))}
            </div>
          )
        ) : (
          filteredInventory.length === 0 ? (
            <EmptyState
              message="Tu inventario está vacío. ¡Ve a la tienda y consigue algo!"
              action={() => setTab("store")}
              actionLabel="Ir a la tienda"
            />
          ) : (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4 animate-in delay-2"
              role="list"
              aria-label="Tu inventario"
            >
              {filteredInventory.map((entry) => (
                <div key={entry._id} role="listitem">
                  <InventoryItemCard
                    entry={entry}
                    onEquip={handleEquip}
                    onUnequip={handleUnequip}
                    equipping={equipping}
                  />
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Estado vacío
───────────────────────────────────────────── */
function EmptyState({ message, action, actionLabel }) {
  return (
    <div
      className="sea-glass-main rounded-2xl p-10 text-center flex flex-col items-center gap-4 animate-in delay-2"
      role="status"
      aria-live="polite"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: "var(--glass-bg)", border: "1.5px solid var(--glass-border)" }}
        aria-hidden="true"
      >
        🛍️
      </div>
      <p className="font-black italic uppercase tracking-tight text-lg">{message}</p>
      {action && (
        <button
          onClick={action}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all hover:opacity-90 hover:scale-[1.02]"
          style={{ background: "var(--text-accent)", color: "white" }}
        >
          <ShoppingBag size={14} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}