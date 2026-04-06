import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import useAuthStore from "./store/authStore";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import SubjectMap from "./pages/SubjectMap";
import Lesson from "./pages/Lesson";
import Profile from "./pages/Profile";
import AuthCallback from "./pages/AuthCallback"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import Friends from "./pages/Friends";
import PublicProfile from "./pages/PublicProfile";
import Duel from "./pages/Duel";
import DuelInviteToast from "./components/Duelinvitetoast";
import League from "./pages/League";

function App() {
  const { token, fetchMe } = useAuthStore();

  // App.jsx
  useEffect(() => {
    if (token) {
      fetchMe();
      // Opcional: Refrescar datos cada 2 minutos en segundo plano
      const interval = setInterval(fetchMe, 120000); 
      return () => clearInterval(interval);
    }
  }, [token, fetchMe]); // Se vuelve a ejecutar si el token cambia (login/logout)

  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/league" element={<ProtectedRoute><League /></ProtectedRoute>} />

        {/* Protegidas */}
        <Route path="/duel/:duelId" element={<ProtectedRoute><Duel /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
        <Route path="/profile/:username" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/subject/:slug" element={<ProtectedRoute><SubjectMap /></ProtectedRoute>} />
        <Route path="/lesson/:id" element={<ProtectedRoute><Lesson /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
      <DuelInviteToast />
    </BrowserRouter>
  );
}

export default App;
