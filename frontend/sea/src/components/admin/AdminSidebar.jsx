// src/components/admin/AdminSidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  Users, 
  ListChecks, 
  BookOpen, 
  Layers, 
  BookText, 
  LogOut, 
  Home 
} from "lucide-react";
import useAuthStore from "../../store/authStore";

export default function AdminSidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col h-screen">
      {/* Logo + Título */}
      <div className="p-8 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl">
            S
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter">SEA</h1>
            <p className="text-xs text-violet-400 -mt-1">ADMIN PANEL</p>
          </div>
        </div>
      </div>

      {/* Usuario actual */}
      <div className="px-8 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar || "https://via.placeholder.com/40"}
            alt={user?.username}
            className="w-10 h-10 rounded-full object-cover border border-gray-700"
          />
          <div className="overflow-hidden">
            <p className="font-semibold text-white truncate">
              {user?.displayName || user?.username}
            </p>
            <p className="text-xs text-emerald-400">● En línea</p>
          </div>
        </div>
      </div>

      {/* Menú de navegación */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="px-5 text-xs uppercase tracking-widest text-gray-500 mb-3 mt-2">General</p>
        
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${
              isActive ? "bg-violet-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`
          }
        >
          <BarChart3 size={22} />
          <span className="font-medium">Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${
              isActive ? "bg-violet-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`
          }
        >
          <Users size={22} />
          <span className="font-medium">Usuarios</span>
        </NavLink>

        <p className="px-5 text-xs uppercase tracking-widest text-gray-500 mb-3 mt-6">Contenido</p>

        <NavLink
          to="/admin/questions"
          className={({ isActive }) =>
            `flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${
              isActive ? "bg-violet-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`
          }
        >
          <ListChecks size={22} />
          <span className="font-medium">Preguntas</span>
        </NavLink>

        <NavLink
          to="/admin/subjects"
          className={({ isActive }) =>
            `flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${
              isActive ? "bg-violet-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`
          }
        >
          <BookOpen size={22} />
          <span className="font-medium">Materias</span>
        </NavLink>

        <NavLink
          to="/admin/units"
          className={({ isActive }) =>
            `flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${
              isActive ? "bg-violet-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`
          }
        >
          <Layers size={22} />
          <span className="font-medium">Unidades</span>
        </NavLink>

        <NavLink
          to="/admin/lessons"
          className={({ isActive }) =>
            `flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${
              isActive ? "bg-violet-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`
          }
        >
          <BookText size={22} />
          <span className="font-medium">Lecciones</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-gray-800 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-4 bg-gray-800 hover:bg-red-500/10 hover:text-red-400 text-gray-300 rounded-2xl transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Cerrar Sesión</span>
        </button>

        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center justify-center gap-3 py-4 mt-3 text-gray-400 hover:text-white transition-all"
        >
          <Home size={20} />
          <span className="text-sm">Volver a SEA</span>
        </button>
      </div>
    </div>
  );
}