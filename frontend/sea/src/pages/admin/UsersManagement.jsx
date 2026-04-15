// src/pages/admin/UsersManagement.jsx
import { useState, useEffect } from "react";
import { Search, Edit, Ban, Trash2, Shield, UserCheck } from "lucide-react";
import useAuthStore from "../../store/authStore";
import api from "../../api/axios";
import Avatar from "../../components/Avatar";

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const isSuperAdmin = useAuthStore(s => s.isSuperAdmin);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/users`, {
        params: { page, limit: 15, search }
      });

      setUsers(data.data.users);
      setTotalPages(data.data.pages);
    } catch (err) {
      console.error(err);
      alert("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  // Acciones
  const handleBan = async (id, isActive) => {
    // Invertimos el estado actual para la confirmación
    const action = isActive ? "Banear" : "Desbanear";
    if (!confirm(`¿${action} a este usuario?`)) return;
    
    try {
      // Enviamos el nuevo estado al backend
      await api.put(`/admin/users/${id}/ban`, { 
        isActive: !isActive 
      });
      
      // Refrescamos la lista para ver el cambio reflejado
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar estado: " + (err.response?.data?.message || "Error desconocido"));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar usuario permanentemente? (Se borrará también su progreso)")) return;
    
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert("Error al eliminar usuario");
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const updateUser = async (e) => {
    e.preventDefault();
    try {
      // Any admin can update profile fields
      await api.put(`/admin/users/${selectedUser._id}`, {
        displayName: selectedUser.displayName,
        email: selectedUser.email,
        isActive: selectedUser.isActive,
      });

      if (isSuperAdmin()) {
        await api.put(`/admin/users/${selectedUser._id}/role`, {
          role: selectedUser.role,
        });
      }

      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      alert("Error al actualizar usuario: " + (err.response?.data?.message || "Error desconocido"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
          <p className="text-indigo-400">Administra usuarios, roles y accesos</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre, usuario o email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full bg-gray-900 border border-gray-700 focus:border-violet-500 rounded-2xl pl-11 py-4 text-white placeholder-gray-400"
        />
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left p-6 text-gray-400">Usuario</th>
              <th className="text-left p-6 text-gray-400">Email</th>
              <th className="text-left p-6 text-gray-400">Rol</th>
              <th className="text-left p-6 text-gray-400">Estado</th>
              <th className="text-left p-6 text-gray-400">XP / Nivel</th>
              <th className="text-center p-6 text-gray-400">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map((user) => (
              // Dentro del <tbody> reemplaza la fila completa por esto:
            <tr key={user._id} className="hover:bg-gray-800/50 transition-colors">
              <td className="p-6">
                <div className="flex items-center gap-3">
                  <Avatar 
                    src={user.avatar} 
                    name={user.displayName || user.username} 
                    size="md" 
                  />
                  <div>
                    <p className="font-medium text-white">{user.displayName || user.username}</p>
                    <p className="text-xs text-gray-500">@{user.username}</p>
                  </div>
                </div>
              </td>
              <td className="p-6 text-gray-300">{user.email}</td>
              <td className="p-6">
                <span className={`px-4 py-1 text-xs font-medium rounded-2xl ${
                  user.role === "superadmin"
                    ? "bg-amber-500/10 text-amber-400"
                    : user.role === "admin"
                    ? "bg-violet-500/10 text-violet-400"
                    : "bg-gray-700 text-gray-300"
                }`}>
                  {user.role === "superadmin" ? "Superadmin" : user.role === "admin" ? "Administrador" : "Estudiante"}
                </span>
              </td>
              <td className="p-6">
                <span className={`inline-flex items-center gap-2 px-4 py-1 rounded-2xl text-sm ${
                  user.isActive 
                    ? "bg-emerald-500/10 text-emerald-400" 
                    : "bg-red-500/10 text-red-400"
                }`}>
                  {user.isActive ? "Activo" : "Baneado"}
                </span>
              </td>
              <td className="p-6">
                <div className="text-white">
                  {user.xp} XP <span className="text-gray-500">• Nivel {user.level}</span>
                </div>
              </td>
              <td className="p-6">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => openEditModal(user)}
                    className="p-3 hover:bg-gray-700 text-gray-300 hover:text-white rounded-2xl transition-colors"
                    title="Editar"
                  >
                    <Edit size={20} />
                  </button>

                  <button
                    onClick={() => handleBan(user._id, user.isActive)}
                    className={`p-3 rounded-2xl transition-colors ${
                      user.isActive 
                        ? "hover:bg-red-500/10 text-emerald-400 hover:text-emerald-500" 
                        : "hover:bg-emerald-500/10 text-red-400 hover:text-red-500"
                    }`}
                    title={user.isActive ? "Banear" : "Desbanear"}
                  >
                    <Ban size={20} />
                  </button>

                  <button
                    onClick={() => handleDelete(user._id)}
                    className="p-3 hover:bg-red-500/10 text-gray-300 hover:text-red-400 rounded-2xl transition-colors"
                    title="Eliminar"
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

      {/* Paginación */}
      <div className="flex justify-between items-center px-2">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className="px-6 py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-2xl text-white transition-colors"
        >
          ← Anterior
        </button>
        <span className="text-gray-400">
          Página <span className="font-semibold text-white">{page}</span> de {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
          className="px-6 py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-2xl text-white transition-colors"
        >
          Siguiente →
        </button>
      </div>

      {/* Modal de Edición */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-3xl p-8 w-full max-w-md border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Editar Usuario</h2>
            
            <form onSubmit={updateUser} className="space-y-5">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Nombre visible</label>
                <input
                  type="text"
                  value={selectedUser.displayName || ""}
                  onChange={(e) => setSelectedUser({...selectedUser, displayName: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1">Email</label>
                <input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1">Rol</label>
                {isSuperAdmin() ? (
                  <select
                    value={selectedUser.role}
                    onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white"
                  >
                    <option value="student">Estudiante</option>
                    <option value="admin">Administrador</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                ) : (
                  <div className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl px-4 py-3 text-gray-500 cursor-not-allowed">
                    {selectedUser.role === "superadmin" ? "Superadmin" : selectedUser.role === "admin" ? "Administrador" : "Estudiante"}
                    <span className="float-right text-xs text-gray-600">Solo superadmin puede cambiar esto</span>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-2xl text-white font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-violet-600 hover:bg-violet-500 rounded-2xl text-white font-medium"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}