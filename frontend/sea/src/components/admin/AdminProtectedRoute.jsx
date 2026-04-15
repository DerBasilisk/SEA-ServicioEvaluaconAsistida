import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function AdminProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();

  // 1. MIENTRAS CARGA: No redirigimos. Mostramos un estado de espera.
  // Esto evita que el sistema te expulse mientras fetchMe() verifica el token.
  if (loading) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 text-sm font-medium animate-pulse">Verificando credenciales...</p>
      </div>
    );
  }

  // 2. SI NO HAY USUARIO: Solo después de que terminó de cargar y user sigue null, redirigimos.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. SI NO ES ADMIN: Redirigimos al home.
  if (!["admin", "superadmin"].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // 4. TODO OK: Renderizamos el panel de admin.
  return children;
}