// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import useAuthStore from "./store/authStore";
import { Toaster } from "react-hot-toast";

// Protecciones
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";

// Layout Admin
import AdminLayout from "./components/admin/AdminLayout";

// Sistema
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import SubjectMap from "./pages/SubjectMap";
import Lesson from "./pages/Lesson";
import Profile from "./pages/Profile";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerificationPending from './pages/VerificationPending';
import VerifyEmail from './pages/VerifyEmail';

// Aplicacion
import Friends from "./pages/Friends";
import PublicProfile from "./pages/PublicProfile";
import Duel from "./pages/Duel";
import League from "./pages/League";
import Settings from "./pages/Settings";
import Frontal from "./pages/Frontal";
import SubjectCatalog from "./pages/SubjectCatalog";
import Chat from "./pages/Chat";
import Shop from "./pages/Shop";

// Pages del Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import QuestionsManagement from "./pages/admin/QuestionsManagement";
import SubjectsManagement from "./pages/admin/SubjectsManagement";
import UnitsManagement from "./pages/admin/UnitsManagement";        // ← Corregido (plural)
import LessonsManagement from "./pages/admin/LessonsManagement";

// Adiciones
import AudioManager from "./components/AudioManager";

import DuelInviteToast from "./components/Duelinvitetoast";

function App() {
  const { token, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchMe();
    }
  }, [token]);

  useEffect(() => {
    const theme = localStorage.getItem("sea_theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  return (
    <BrowserRouter>
    <AudioManager />
      <Routes>
        {/* Rutas Públicas */}
        
        <Route path="/home" element={<Frontal />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verification-pending" element={<VerificationPending />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Rutas Protegidas para usuarios normales */}
        <Route path="/" element={
          token 
            ? <ProtectedRoute><Home /></ProtectedRoute>
            : <Navigate to="/home" replace />
        } />

        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
        <Route path="/subject-catalog" element={<ProtectedRoute><SubjectCatalog /></ProtectedRoute>} />
        <Route path="/subject/:slug" element={<ProtectedRoute><SubjectMap /></ProtectedRoute>} />
        <Route path="/lesson/:id" element={<ProtectedRoute><Lesson /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:username" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
        <Route path="/duel/:duelId" element={<ProtectedRoute><Duel /></ProtectedRoute>} />
        <Route path="/league" element={<ProtectedRoute><League /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* ==================== PANEL ADMINISTRATIVO ==================== */}
        <Route 
          path="/admin" 
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="questions" element={<QuestionsManagement />} />
          <Route path="subjects" element={<SubjectsManagement />} />
          <Route path="units" element={<UnitsManagement />} />        {/* ← Corregido */}
          <Route path="lessons" element={<LessonsManagement />} />    {/* ← Corregido */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>

      <DuelInviteToast />
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;