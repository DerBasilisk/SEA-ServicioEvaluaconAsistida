// src/components/admin/AdminSidebar.jsx
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3, Users, ListChecks,
  BookOpen, Layers, BookText,
  LogOut, Home, ChevronLeft,
  ShieldCheck, X, Menu
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import Avatar from "../Avatar";
import { useState } from "react";

/* ── Estilos que consumen las variables de index.css ── */
const SIDEBAR_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  .sea-admin-sidebar {
    font-family: 'Nunito', sans-serif;
    background: var(--glass-bg);
    border-right: 1.5px solid var(--sidebar-border);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  /* Nav link base */
  .sea-nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    border-radius: 1rem;
    font-weight: 700;
    font-size: 0.875rem;
    transition: all 0.22s ease;
    color: var(--text-secondary);
    border: 1.5px solid transparent;
    text-decoration: none;
  }
  .sea-nav-link:hover {
    background: color-mix(in srgb, var(--text-accent) 8%, transparent);
    color: var(--text-primary);
    border-color: color-mix(in srgb, var(--text-accent) 20%, transparent);
    transform: translateX(3px);
  }
  .sea-nav-link.active {
    background: color-mix(in srgb, var(--text-secondary) 15%, transparent);
    color: var(--text-accent);
    border-color: color-mix(in srgb, var(--text-accent) 35%, transparent);
  }

  [data-theme="high-contrast"] .sea-nav-link {
    background: var(--glass-bg);
  }

  /* Botón de logout */
  .sea-logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.85rem;
    border-radius: 1rem;
    font-weight: 800;
    font-size: 0.8rem;
    transition: all 0.22s ease;
    color: var(--text-secondary);
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .sea-logout-btn:hover {
    background: color-mix(in srgb, var(--incorrect) 10%, transparent);
    color: var(--incorrect);
    border-color: color-mix(in srgb, var(--incorrect) 30%, transparent);
  }

  /* Botón volver */
  .sea-back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.85rem;
    border-radius: 1rem;
    font-weight: 800;
    font-size: 0.8rem;
    transition: all 0.22s ease;
    color: var(--text-secondary);
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .sea-back-btn:hover {
    color: var(--correct);
  }

  /* Badge de status */
  .sea-online-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--correct);
    animation: pulse-dot 2s infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.6; transform: scale(1.3); }
  }

  /* Logo S */
  .sea-logo-letter {
    background: linear-gradient(135deg, var(--text-accent), var(--text-alternative-b));
  }

  /* Sección label */
  .sea-section-label {
    font-size: 0.6rem;
    font-weight: 900;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--text-muted);
    padding: 0 1.25rem;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    display: block;
  }


  /* Divider */
  .sea-divider {
    border: none;
    border-top: 1.5px solid var(--sidebar-border);
    margin: 0;
  }

  /* Bottom Navigation Bar Styles */
  .sea-bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1.5px solid var(--sidebar-border);
    padding: 0.5rem 0.75rem 0.75rem;
    z-index: 50;
  }

  .sea-bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.5rem 0.25rem;
    border-radius: 0.75rem;
    font-weight: 700;
    font-size: 0.65rem;
    transition: all 0.2s ease;
    color: var(--text-secondary);
    text-decoration: none;
    text-align: center;
  }

  .sea-bottom-nav-item.active {
    color: var(--text-accent);
    background: color-mix(in srgb, var(--text-accent) 12%, transparent);
  }

  .sea-bottom-nav-item:active {
    transform: scale(0.95);
  }

  /* Bottom sheet para más opciones */
  .sea-bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--card-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top-left-radius: 1.5rem;
    border-top-right-radius: 1.5rem;
    border-top: 1.5px solid var(--sidebar-border);
    transform: translateY(100%);
    transition: transform 0.3s ease;
    z-index: 60;
    max-height: 80vh;
    overflow-y: auto;
  }

  .sea-bottom-sheet.open {
    transform: translateY(0);
  }

  .sea-bottom-sheet-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(2px);
    z-index: 55;
  }

  /* Drag indicator */
  .sea-drag-indicator {
    width: 40px;
    height: 4px;
    background: var(--text-muted);
    border-radius: 2px;
    margin: 12px auto;
  }
`;

const NAV_ITEMS = [
  {
    group: "General",
    items: [
      { to: "/admin",        end: true, icon: <BarChart3 size={22} />, label: "Dashboard" },
      { to: "/admin/users",             icon: <Users     size={22} />, label: "Usuarios"  },
    ],
  },
  {
    group: "Contenido",
    items: [
      { to: "/admin/subjects",  icon: <BookOpen   size={22} />, label: "Materias"  },
      { to: "/admin/units",     icon: <Layers     size={22} />, label: "Unidades"  },
      { to: "/admin/lessons",   icon: <BookText   size={22} />, label: "Lecciones" },
      { to: "/admin/questions", icon: <ListChecks size={22} />, label: "Preguntas" },
    ],
  },
];

// Items principales que se muestran en la bottom bar (primeros 4)
const BOTTOM_NAV_ITEMS = NAV_ITEMS.flatMap(group => group.items).slice(0, 4);

export default function AdminSidebar({ mobileOpen, onMobileClose }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setBottomSheetOpen(false);
  };

  const handleMorePress = () => {
    setBottomSheetOpen(true);
  };

  const sidebarContent = (
    <div className="sea-admin-sidebar flex flex-col h-screen w-72">
      <style>{SIDEBAR_CSS}</style>

      {/* ── Logo ── */}
      <div className="p-6 flex items-center justify-between" style={{ borderBottom: "1.5px solid var(--sidebar-border)" }}>
        <div className="flex items-center gap-3">
          <div className="sea-logo-letter w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0">
            S
          </div>
          <div>
            <h1
              className="text-2xl font-black italic uppercase tracking-tighter leading-none"
              style={{ color: "var(--text-primary)" }}
            >
              SEA
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-accent)" }}>
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* ── Usuario ── */}
      <div className="px-5 py-4" style={{ borderBottom: "1.5px solid var(--sidebar-border)" }}>
        <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--glass-bg-small)", border: "1px solid var(--glass-border)" }}>
          <Avatar
            src={user?.avatar}
            name={user?.displayName}
            size="md"
            className="rounded-xl object-cover shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p
              className="font-black text-sm truncate uppercase italic tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {user?.displayName || user?.username}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="sea-online-dot" />
              <span className="text-[10px] font-bold" style={{ color: "var(--correct)" }}>En línea</span>
            </div>
          </div>
          <ShieldCheck size={15} style={{ color: "var(--text-accent)", flexShrink: 0 }} />
        </div>
      </div>

      {/* ── Navegación ── */}
      <nav className="flex-1 px-4 py-3 overflow-y-auto space-y-1">
        {NAV_ITEMS.map((group) => (
          <div key={group.group}>
            <span className="sea-section-label">{group.group}</span>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `sea-nav-link${isActive ? " active" : ""}`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="p-4 space-y-2" style={{ borderTop: "1.5px solid var(--sidebar-border)" }}>
        <button className="sea-logout-btn" onClick={handleLogout}>
          <LogOut size={17} />
          Cerrar Sesión
        </button>
        <button className="sea-back-btn" onClick={() => { navigate("/"); }}>
          <Home size={15} />
          Volver a SEA
        </button>
      </div>
    </div>
  );

  // Bottom navigation bar para móvil
  const bottomNavBar = (
    <div className="sea-bottom-nav lg:hidden">
      <div className="flex justify-around items-center">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `sea-bottom-nav-item${isActive ? " active" : ""}`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={handleMorePress}
          className={`sea-bottom-nav-item ${!BOTTOM_NAV_ITEMS.some(item => location.pathname === item.to || (item.end && location.pathname === item.to)) && 
            !['/admin/subjects', '/admin/units', '/admin/lessons', '/admin/questions'].includes(location.pathname)
            ? 'active' 
            : ''}`}
        >
          <Menu size={22} />
          <span>Más</span>
        </button>
      </div>
    </div>
  );

  // Bottom sheet con opciones adicionales
  const bottomSheet = (
    <>
      {bottomSheetOpen && (
        <div
          className="sea-bottom-sheet-overlay lg:hidden"
          onClick={() => setBottomSheetOpen(false)}
        />
      )}
      <div className={`sea-bottom-sheet lg:hidden ${bottomSheetOpen ? 'open' : ''}`}>
        <div className="sea-drag-indicator" />
        <div className="px-4 pb-6">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-black text-lg" style={{ color: "var(--text-secondary)" }}>
              Más opciones
            </h3>
            <button
              onClick={() => setBottomSheetOpen(false)}
              className="p-2 rounded-xl"
              style={{ background: "var(--glass-bg-small)", color: "var(--text-secondary)" }}
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Items restantes del menú */}
          {NAV_ITEMS.flatMap(group => group.items).slice(4).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setBottomSheetOpen(false)}
              className="sea-nav-link w-full mb-2 bg-[--glass-border] rounded-2xl"
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
          
          <div className="sea-divider my-4" />
          
          <button
            className="sea-logout-btn mt-2"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Cerrar Sesión
          </button>
          
          <button
            className="sea-back-btn mt-2"
            onClick={() => { navigate("/"); setBottomSheetOpen(false); }}
          >
            <Home size={15} />
            Volver a SEA
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop: siempre visible ── */}
      <div className="hidden lg:flex h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* ── Mobile: bottom navigation + bottom sheet ── */}
      <div className="lg:hidden">
        {bottomNavBar}
        {bottomSheet}
        {/* Padding inferior para que el contenido no quede detrás de la bottom bar */}
        <div style={{ paddingBottom: "70px" }} />
      </div>
    </>
  );
}