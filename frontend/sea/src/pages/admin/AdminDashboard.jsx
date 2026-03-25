// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { Users, BookOpen, ListChecks, Award, TrendingUp } from "lucide-react";
import api from "../../api/axios";
import useAuthStore from "../../store/authStore";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/stats");
      setStats(data.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error al cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-indigo-300">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-6 rounded-2xl">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          Bienvenido, <span className="text-violet-400">{user?.displayName || user?.username}</span>
        </h1>
        <p className="text-indigo-400 mt-2">Panel de Administración • SEA</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 hover:border-violet-500/50 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Usuarios Totales</p>
              <p className="text-4xl font-bold text-white mt-2">{stats?.totalUsers || 0}</p>
            </div>
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 hover:border-violet-500/50 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Materias</p>
              <p className="text-4xl font-bold text-white mt-2">{stats?.totalSubjects || 0}</p>
            </div>
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 hover:border-violet-500/50 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Lecciones</p>
              <p className="text-4xl font-bold text-white mt-2">{stats?.totalLessons || 0}</p>
            </div>
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 hover:border-violet-500/50 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Preguntas Totales</p>
              <p className="text-4xl font-bold text-white mt-2">{stats?.totalQuestions || 0}</p>
              <p className="text-xs text-violet-400 mt-1">
                {stats?.pendingQuestions || 0} pendientes de revisión
              </p>
            </div>
            <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ListChecks className="w-8 h-8 text-violet-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-violet-400" />
          Acciones Rápidas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/admin/questions")}
            className="bg-gray-800 hover:bg-violet-600/20 border border-gray-700 hover:border-violet-500 p-6 rounded-2xl transition-all text-left group"
          >
            <ListChecks className="w-10 h-10 text-violet-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-lg text-white">Revisar Preguntas</h3>
            <p className="text-gray-400 text-sm mt-1">
              {stats?.pendingQuestions || 0} preguntas esperando aprobación
            </p>
          </button>

          <button
            onClick={() => navigate("/admin/users")}
            className="bg-gray-800 hover:bg-blue-600/20 border border-gray-700 hover:border-blue-500 p-6 rounded-2xl transition-all text-left group"
          >
            <Users className="w-10 h-10 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-lg text-white">Gestionar Usuarios</h3>
            <p className="text-gray-400 text-sm mt-1">Ver y moderar usuarios</p>
          </button>

          <button
            onClick={() => navigate("/admin/subjects")}
            className="bg-gray-800 hover:bg-emerald-600/20 border border-gray-700 hover:border-emerald-500 p-6 rounded-2xl transition-all text-left group"
          >
            <BookOpen className="w-10 h-10 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-lg text-white">Contenido</h3>
            <p className="text-gray-400 text-sm mt-1">Materias, unidades y lecciones</p>
          </button>
        </div>
      </div>

      {/* Última actualización */}
      <div className="text-center text-xs text-gray-500">
        Última actualización: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}