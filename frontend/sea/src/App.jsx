// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import useAuthStore from "./store/authStore";

// Componentes de protección
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";

// Layout del Admin
import AdminLayout from "./components/admin/AdminLayout";

// Pages normales
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import SubjectMap from "./pages/SubjectMap";
import Lesson from "./pages/Lesson";
import Profile from "./pages/Profile";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Friends from "./pages/Friends";
import PublicProfile from "./pages/PublicProfile";
import Duel from "./pages/Duel";
import League from "./pages/League";
import Settings from "./pages/Settings";

// Pages del Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import QuestionsManagement from "./pages/admin/QuestionsManagement";
import SubjectsManagement from "./pages/admin/SubjectsManagement";

import DuelInviteToast from "./components/Duelinvitetoast";

function App() {
  const { token, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchMe();
    }
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ====================== RUTAS PÚBLICAS ====================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ====================== RUTAS PROTEGIDAS (Usuarios normales) ====================== */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/subject/:slug" element={<ProtectedRoute><SubjectMap /></ProtectedRoute>} />
        <Route path="/lesson/:id" element={<ProtectedRoute><Lesson /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:username" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
        <Route path="/duel/:duelId" element={<ProtectedRoute><Duel /></ProtectedRoute>} />
        <Route path="/league" element={<ProtectedRoute><League /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* ====================== PANEL ADMINISTRATIVO ====================== */}
        <Route 
          path="/admin" 
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          {/* Rutas hijas del Admin */}
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="questions" element={<QuestionsManagement />} />
          <Route path="subjects" element={<SubjectsManagement />} />
        </Route>

        {/* ====================== FALLBACK ====================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Toast global */}
      <DuelInviteToast />
    </BrowserRouter>
  );
}

export default App;