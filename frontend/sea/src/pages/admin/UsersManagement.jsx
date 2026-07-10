// src/pages/admin/UsersManagement.jsx
import { useState, useEffect } from "react";
import { Search, Edit, Ban, Trash2, X, Filter, RefreshCw } from "lucide-react";
import useAuthStore from "../../store/authStore";
import api from "../../api/axios";
import Avatar from "../../components/Avatar";
import toast from 'react-hot-toast';
import { useConfirm } from "../../context/ConfirmContext"; // Importa el hook useConfirm

const USERS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  .usm-page { font-family: 'Nunito', sans-serif; }

  .usm-card {
    background: var(--card-bg);
    border: 1.5px solid var(--glass-border);
    border-radius: 1.5rem;
    overflow: hidden;
  }

  .usm-search-wrap {
    position: relative;
    width: 100%;
  }
  .usm-search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
  }
  .usm-search-input {
    width: 100%;
    background: var(--card-bg);
    border: 1.5px solid var(--glass-border);
    border-radius: 1rem;
    padding: 0.9rem 1rem 0.9rem 2.75rem;
    color: var(--text-primary);
    font-family: 'Nunito', sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    transition: border-color 0.2s;
    outline: none;
  }
  .usm-search-input:focus { border-color: var(--text-accent); }
  .usm-search-input::placeholder { color: var(--text-muted); }

  /* User Card - Mobile */
  .usm-user-card {
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    border-radius: 1.25rem;
    transition: all 0.2s ease;
  }
  .usm-user-card:active {
    transform: scale(0.99);
  }

  .usm-role-badge {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 0.2rem 0.65rem;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .usm-role-superadmin { background: color-mix(in srgb, var(--text-alternative-a) 12%, transparent); color: var(--text-alternative-a); border: 1px solid color-mix(in srgb, var(--text-alternative-a) 25%, transparent); }
  .usm-role-admin      { background: color-mix(in srgb, var(--text-accent) 12%, transparent); color: var(--text-accent); border: 1px solid color-mix(in srgb, var(--text-accent) 25%, transparent); }
  .usm-role-student    { background: var(--glass-bg); color: var(--text-secondary); border: 1px solid var(--glass-border); }

  .usm-status-badge {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 0.2rem 0.65rem;
    border-radius: 999px;
    letter-spacing: 0.06em;
  }
  .usm-status-active   { background: var(--correct-bg); color: var(--correct); border: 1px solid color-mix(in srgb, var(--correct) 25%, transparent); }
  .usm-status-banned   { background: var(--incorrect-bg); color: var(--incorrect); border: 1px solid color-mix(in srgb, var(--incorrect) 25%, transparent); }

  .usm-action-btn {
    background: transparent;
    border: 1.5px solid transparent;
    border-radius: 0.75rem;
    padding: 0.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all 0.18s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .usm-action-btn:active {
    transform: scale(0.92);
  }
  .usm-action-btn.ban-active:active   { background: var(--incorrect-bg); color: var(--incorrect); }
  .usm-action-btn.ban-banned:active   { background: var(--correct-bg); color: var(--correct); }
  .usm-action-btn.danger:active { background: var(--incorrect-bg); color: var(--incorrect); }

  /* Pagination */
  .usm-page-btn {
    background: var(--card-bg);
    color: var(--text-secondary);
    border: 1.5px solid var(--card-border);
    border-radius: 1rem;
    padding: 0.6rem 1.2rem;
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Nunito', sans-serif;
  }
  .usm-page-btn:active:not(:disabled) {
    transform: scale(0.96);
  }
  .usm-page-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  /* Filter chips */
  .usm-filter-chip {
    padding: 0.4rem 1rem;
    border-radius: 2rem;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: var(--glass-bg);
    border: 1.5px solid var(--glass-border);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .usm-filter-chip.active {
    background: color-mix(in srgb, var(--text-accent) 15%, transparent);
    border-color: var(--text-accent);
    color: var(--text-accent);
  }
  .usm-filter-chip:active {
    transform: scale(0.96);
  }

  /* Refresh button */
  .usm-refresh-btn {
    background: var(--glass-bg);
    border: 1.5px solid var(--glass-border);
    border-radius: 1rem;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }
  .usm-refresh-btn:active {
    transform: scale(0.96);
  }
  .spin {
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Modal */
  .usm-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 1rem;
  }
  @media (min-width: 640px) {
    .usm-modal-overlay {
      align-items: center;
    }
  }
  .usm-modal {
    background: var(--glass-bg);
    border: 1.5px solid var(--glass-border);
    border-radius: 1.5rem;
    width: 100%;
    max-width: 28rem;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 24px 60px var(--glass-shadow);
  }
  @media (min-width: 640px) {
    .usm-modal {
      border-radius: 2rem;
    }
  }

  .usm-modal-input {
    width: 100%;
    background: var(--glass-bg);
    border: 1.5px solid var(--glass-border);
    border-radius: 1rem;
    padding: 0.75rem 1.25rem;
    color: var(--text-primary);
    font-family: 'Nunito', sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    transition: border-color 0.2s;
    outline: none;
  }
  .usm-modal-input:focus { border-color: var(--text-accent); }

  .usm-btn-primary {
    flex: 1;
    background: var(--btn-primary);
    color: var(--btn-text);
    border: none;
    border-radius: 1rem;
    padding: 0.9rem;
    font-weight: 800;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .usm-btn-primary:active {
    transform: scale(0.98);
    opacity: 0.9;
  }

  .usm-btn-ghost {
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
  .usm-btn-ghost:active {
    transform: scale(0.98);
  }

  /* No scrollbar for horizontal scroll */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const confirm = useConfirm(); // ✅ Hook movido al inicio (sin condiciones)
  
  const isSuperAdmin = useAuthStore(s => s.isSuperAdmin);

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const { data } = await api.get(`/admin/users`, { 
        params: { page, limit: 20, search, role: roleFilter !== "all" ? roleFilter : undefined, status: statusFilter !== "all" ? statusFilter : undefined } 
      });
      setUsers(data.data.users);
      setTotalPages(data.data.pages);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

useEffect(() => {
  const doFetch = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/users`, {
        params: {
          page,
          limit: 20,
          search: search || undefined,
          role: roleFilter !== "all" ? roleFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined
        }
      });
      setUsers(data.data.users);
      setTotalPages(data.data.pages);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  doFetch();
}, [page, search, roleFilter, statusFilter]);

const handleRefresh = () => {
  if (window.navigator?.vibrate) window.navigator.vibrate(50);
  setRefreshing(true);
  // Forzar re-ejecución del useEffect con un estado dummy, o simplemente
  // llamar doFetch directamente desde afuera
};

  const handleBan = async (id, isActive) => {
    const action = isActive ? "banear" : "desbanear";
       if (!(await confirm({
     message: `¿${action.toUpperCase()} a este usuario?`,
     danger: !isActive, // banear es destructivo, desbanear no
     confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      }))) return;
    try {
      await api.put(`/admin/users/${id}/ban`, { isActive: !isActive });
      fetchUsers(true);
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
    } catch (err) {
      toast.error("Error al actualizar estado: " + (err.response?.data?.message || "Error desconocido"));
    }
  };

  const handleDelete = async (id) => {
       if (!(await confirm({
     title: "Eliminar usuario permanentemente",
     message: "Esto borrará todo su progreso. Esta acción no se puede deshacer.",
     danger: true,
     confirmText: "Eliminar",
   }))) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers(true);
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
    } catch { 
      toast.error("Error al eliminar usuario"); 
    }
  };

  const updateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${selectedUser._id}`, {
        displayName: selectedUser.displayName,
        email: selectedUser.email,
        isActive: selectedUser.isActive,
      });
      if (isSuperAdmin()) {
        await api.put(`/admin/users/${selectedUser._id}/role`, { role: selectedUser.role });
      }
      setShowEditModal(false);
      fetchUsers(true);
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
    } catch (err) {
      toast.error("Error al actualizar usuario: " + (err.response?.data?.message || "Error desconocido"));
    }
  };

  const roleLabel = (role) =>
    role === "superadmin" ? "Superadmin" : role === "admin" ? "Administrador" : "Estudiante";

  return (
    <div className="usm-page space-y-5 pb-20">
      <style>{USERS_CSS}</style>

      {/* Header con botón de refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight" style={{ color: "var(--text-primary)" }}>
            Usuarios
          </h1>
          <p className="text-xs sm:text-sm font-semibold mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {users.length} usuarios · Pág. {page} de {totalPages}
          </p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="usm-refresh-btn"
        >
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="usm-search-wrap">
        <Search className="usm-search-icon" size={18} />
        <input
          className="usm-search-input"
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filtros chips */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs font-bold self-center" style={{ color: "var(--text-muted)" }}>Rol:</span>
          {["all", "student", "admin", "superadmin"].map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`usm-filter-chip ${roleFilter === role ? "active" : ""}`}
            >
              {role === "all" ? "Todos" : roleLabel(role)}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs font-bold self-center" style={{ color: "var(--text-muted)" }}>Estado:</span>
          {["all", "active", "banned"].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`usm-filter-chip ${statusFilter === status ? "active" : ""}`}
            >
              {status === "all" ? "Todos" : status === "active" ? "Activos" : "Baneados"}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && !refreshing && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="usm-card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10" />
                <div className="flex-1">
                  <div className="h-4 bg-white/10 rounded w-32 mb-2" />
                  <div className="h-3 bg-white/10 rounded w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Cards */}
      {!loading && (
        <div className="space-y-3">
          {users.map(user => (
            <div key={user._id} className="usm-user-card p-4">
              {/* Header con avatar y nombre */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar src={user.avatar} name={user.displayName || user.username} size="lg" className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-sm truncate" style={{ color: "var(--text-primary)" }}>
                      {user.displayName || user.username}
                    </p>
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--text-muted)" }}>
                      @{user.username}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {user.email}
                    </p>
                  </div>
                </div>
                {/* Acciones rápidas */}
                <div className="flex gap-1 ml-2">
                  <button 
                    className="usm-action-btn" 
                    onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    className={`usm-action-btn ${user.isActive ? "ban-active" : "ban-banned"}`}
                    onClick={() => handleBan(user._id, user.isActive)}
                  >
                    <Ban size={18} />
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--card-border)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className={`usm-role-badge ${
                      user.role === "superadmin" ? "usm-role-superadmin"
                      : user.role === "admin" ? "usm-role-admin"
                      : "usm-role-student"
                    }`}>
                      {roleLabel(user.role)}
                    </span>
                    <span className={`usm-status-badge ${user.isActive ? "usm-status-active" : "usm-status-banned"}`}>
                      {user.isActive ? "Activo" : "Baneado"}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
                      {user.xp} XP
                    </p>
                    <p className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
                      Nivel {user.level}
                    </p>
                  </div>
                </div>
              </div>

              {/* Danger action */}
              <div className="mt-2 pt-1 flex justify-end">
                <button 
                  className="usm-action-btn danger px-3 py-1 text-xs font-bold"
                  onClick={() => handleDelete(user._id)}
                >
                  <Trash2 size={14} className="mr-1" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && users.length === 0 && (
        <div className="usm-card p-8 text-center">
          <p className="font-bold" style={{ color: "var(--text-secondary)" }}>
            No se encontraron usuarios
          </p>
          <button 
            onClick={() => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); }}
            className="mt-3 text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--text-accent)" }}
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center gap-3 pt-2">
          <button 
            className="usm-page-btn flex-1" 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
          >
            ← Anterior
          </button>
          <span className="text-xs font-bold shrink-0" style={{ color: "var(--text-secondary)" }}>
            {page} / {totalPages}
          </span>
          <button 
            className="usm-page-btn flex-1" 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Modal de Edición - Bottom sheet */}
      {showEditModal && selectedUser && (
        <div className="usm-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="usm-modal" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 usm-modal-header bg-inherit px-5 pt-5 pb-3 border-b" style={{ borderColor: "var(--card-border)" }}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight" style={{ color: "var(--text-primary)" }}>
                  Editar
                </h2>
                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-full hover:bg-white/10">
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={updateUser} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider block mb-1" style={{ color: "var(--text-secondary)" }}>
                  Nombre visible
                </label>
                <input className="usm-modal-input" type="text"
                  value={selectedUser.displayName || ""}
                  onChange={e => setSelectedUser({ ...selectedUser, displayName: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider block mb-1" style={{ color: "var(--text-secondary)" }}>
                  Email
                </label>
                <input className="usm-modal-input" type="email"
                  value={selectedUser.email}
                  onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider block mb-1" style={{ color: "var(--text-secondary)" }}>
                  Rol
                </label>
                {isSuperAdmin() ? (
                  <select className="usm-modal-input"
                    value={selectedUser.role}
                    onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })}>
                    <option value="student">Estudiante</option>
                    <option value="admin">Administrador</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                ) : (
                  <div className="usm-modal-input opacity-60">
                    {roleLabel(selectedUser.role)}
                    <span className="text-[10px] block text-muted">Solo superadmin puede cambiar esto</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" className="usm-btn-ghost" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="usm-btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}