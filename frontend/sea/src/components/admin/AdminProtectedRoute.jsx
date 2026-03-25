// src/components/admin/AdminProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function AdminProtectedRoute({ children }) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}