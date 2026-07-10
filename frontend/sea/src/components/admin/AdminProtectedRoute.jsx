import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const LOADING_TIMEOUT_MS = 8000;

export default function AdminProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timeoutId = setTimeout(() => setTimedOut(true), LOADING_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Si loading nunca termina (bug de red/store), no dejamos a la persona
  // colgada indefinidamente: la mandamos a login para que reintente.
  if (loading && timedOut) {
    return <Navigate to="/login?error=timeout" replace />;
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-gradient)" }}
      >
        <div className="flex flex-col items-center">
          <Loader2 size={32} className="text-[#2B7FE8] animate-spin mb-4" />
          <p className="text-[--text-primary] text-sm font-medium">
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!["admin", "superadmin"].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}