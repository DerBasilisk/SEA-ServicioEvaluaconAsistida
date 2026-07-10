// src/pages/admin/AdminDashboard.jsxveLesson
import { useEffect, useState } from "react";
import {
  Users, BookOpen, ListChecks, Award,
  Download, Layers, BookText,
  ShieldCheck, Clock, RefreshCw, FileDown, Zap
} from "lucide-react";
import api from "../../api/axios";
import useAuthStore from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import toast from 'react-hot-toast';

/* ─── Estilos que consumen las variables de index.css ─── */
const ADMIN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  .admin-dash { font-family: 'Nunito', sans-serif; }

  .admin-stat-card {
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .admin-stat-card:active {
    transform: scale(0.98);
  }

  .admin-glass {
    background: var(--glass-bg);
    border: 1.5px solid var(--glass-border);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 16px 40px var(--glass-shadow);
  }

  .admin-section {
    background: var(--sidebar-bg);
    border: 1.5px solid var(--sidebar-border);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .export-btn {
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    transition: all 0.25s ease;
    cursor: pointer;
  }
  .export-btn:active {
    transform: scale(0.96);
  }

  .action-btn {
    background: var(--card-bg);
    border: 1.5px solid var(--card-border);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
  }
  .action-btn:active {
    transform: scale(0.98);
  }

  .icon-blob {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .admin-stat-card:active .icon-blob,
  .action-btn:active .icon-blob {
    transform: scale(1.05) rotate(3deg);
  }

  /* Spinner */
  .spin { animation: spin 0.9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Mobile optimizations */
  @media (max-width: 640px) {
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  }

  /* Refresh button */
  .refresh-btn {
    background: var(--glass-bg-small);
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
  .refresh-btn:active {
    transform: scale(0.96);
  }
`;

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isManual = false) => {
    try {
      if (isManual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const { data } = await api.get("/admin/stats");
      setStats(data.data);
      setError(null);
      if (window.navigator?.vibrate && isManual) {
        window.navigator.vibrate(50);
      }
    } catch (err) {
      console.error(err);
      setError("Error al cargar las estadísticas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchStats(true);
  };

  const handleExport = async (type, label) => {
    try {
      const response = await api.get(`/admin/export/${type}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${type}-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(50);
      }
    } catch {
      toast.error(`Error al descargar ${label}`);
    }
  };

  useEffect(() => {
    fetchStats(false);
    const iv = setInterval(() => fetchStats(false), 30000);
    return () => clearInterval(iv);
  }, []);

  /* ── Loading ── */
  if (loading && !stats) {
    return (
      <div
        className="admin-dash flex items-center justify-center min-h-screen"
      >
        <style>{ADMIN_CSS}</style>
        <div className="text-center px-4">
          <div
            className="spin w-14 h-14 rounded-full border-4 mx-auto mb-4"
            style={{
              borderColor: "var(--text-accent)",
              borderTopColor: "transparent",
            }}
          />
          <p style={{ color: "var(--text-secondary)" }} className="font-bold text-sm uppercase tracking-widest">
            Cargando estadísticas…
          </p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="admin-dash p-4 flex items-center justify-center min-h-screen">
        <style>{ADMIN_CSS}</style>
        <div
          className="rounded-2xl p-6 border text-center max-w-sm w-full"
          style={{
            background: "var(--danger-bg)",
            borderColor: "var(--incorrect)",
            color: "var(--incorrect)",
          }}
        >
          <p className="font-black text-lg">{error}</p>
          <button
            onClick={() => fetchStats(true)}
            className="mt-4 px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest"
            style={{ background: "var(--incorrect)", color: "#fff" }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  /* ── Datos de tarjetas ── */
  const statCards = [
    {
      label: "Usuarios",
      value: stats?.totalUsers ?? 0,
      icon: <Users className="w-6 h-6" />,
      accent: "var(--text-alternative)",
    },
    {
      label: "Materias",
      value: stats?.totalSubjects ?? 0,
      icon: <BookOpen className="w-6 h-6" />,
      accent: "var(--text-alternative-b)",
    },
    {
      label: "Unidades",
      value: stats?.totalUnits ?? 0,
      icon: <Layers className="w-6 h-6" />,
      accent: "var(--incorrect)",
    },
    {
      label: "Lecciones",
      value: stats?.totalLessons ?? 0,
      icon: <Award className="w-6 h-6" />,
      accent: "var(--text-alternative-a)",
    },
    {
      label: "Preguntas",
      value: stats?.totalQuestions ?? 0,
      icon: <ListChecks className="w-6 h-6" />,
      accent: "var(--text-accent)",
    },
  ];

  const exportItems = [
    { type: "subjects", label: "Materias", sub: "Estructura base", icon: <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />, accent: "var(--text-accent)" },
    { type: "units", label: "Unidades", sub: "Dentro de materias", icon: <Layers className="w-6 h-6 sm:w-7 sm:h-7" />, accent: "var(--text-alternative-a)" },
    { type: "lessons", label: "Lecciones", sub: "Contenido por unidad", icon: <BookText className="w-6 h-6 sm:w-7 sm:h-7" />, accent: "var(--text-alternative)" },
    { type: "questions", label: "Preguntas", sub: "Preguntas generadas", icon: <ListChecks className="w-6 h-6 sm:w-7 sm:h-7" />, accent: "var(--text-alternative-b)" },
  ];

  const quickActions = [
    {
      label: "Revisar Preguntas",
      sub: `${stats?.pendingQuestions ?? 0} esperando aprobación`,
      icon: <ListChecks className="w-8 h-8 sm:w-10 sm:h-10" />,
      route: "/admin/questions",
      accent: "var(--text-accent)",
    },
    {
      label: "Gestionar Usuarios",
      sub: "Ver y moderar usuarios",
      icon: <Users className="w-8 h-8 sm:w-10 sm:h-10" />,
      route: "/admin/users",
      accent: "var(--text-alternative)",
    },
    {
      label: "Contenido",
      sub: "Materias, unidades y lecciones",
      icon: <BookOpen className="w-8 h-8 sm:w-10 sm:h-10" />,
      route: "/admin/subjects",
      accent: "var(--text-alternative-b)",
    },
  ];

  return (
    <div
      className="admin-dash min-h-screen relative overflow-x-hidden"
      style={{color: "var(--text-primary)" }}
    >
      <style>{ADMIN_CSS}</style>

      {/* Blobs decorativos */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] opacity-40"
          style={{ background: "var(--deco-blob)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full blur-[100px] opacity-30"
          style={{ background: "var(--deco-blob2)" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-10 pb-20 space-y-5 sm:space-y-8">

        {/* ── Header con botón de refresh ── */}
        <header className="admin-glass rounded-2xl sm:rounded-3xl p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-2"
                style={{
                  background: "color-mix(in srgb, var(--text-accent) 12%, transparent)",
                  color: "var(--text-accent)",
                  border: "1px solid color-mix(in srgb, var(--text-accent) 30%, transparent)",
                }}
              >
                <ShieldCheck size={10} /> Admin · SEA
              </div>
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-black italic uppercase tracking-tighter leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Bienvenido,{" "}
                <span style={{ color: "var(--text-accent)" }}>
                  {user?.displayName?.split(' ')[0] || user?.username}
                </span>
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <div
                className="hidden sm:flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl"
                style={{
                  background: "var(--glass-bg-small)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--text-secondary)",
                }}
              >
                <Clock size={12} />
                <span>{new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="refresh-btn"
              >
                <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            </div>
          </div>
          
          {/* Hora en móvil debajo */}
          <div className="flex sm:hidden items-center justify-between mt-3 pt-2 border-t" style={{ borderColor: "var(--card-border)" }}>
            <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
              Última actualización: {new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <Clock size={12} style={{ color: "var(--text-muted)" }} />
          </div>
        </header>

        {/* ── Stats: Swiper en móvil, grid en desktop ── */}
        <div className="block lg:hidden">
          <Swiper
            spaceBetween={12}
            slidesPerView={2.2}
            className="stats-swiper"
            pagination={{ clickable: true }}
          >
            {statCards.map((card) => (
              <SwiperSlide key={card.label}>
                <div className="admin-stat-card rounded-2xl p-4 h-full">
                  <div
                    className="icon-blob w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      background: `color-mix(in srgb, ${card.accent} 12%, transparent)`,
                      color: card.accent,
                    }}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-3xl font-black leading-none" style={{ color: "var(--text-primary)" }}>
                      {card.value}
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-wide mt-1" style={{ color: "var(--text-secondary)" }}>
                      {card.label}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Stats grid para desktop */}
        <div className="hidden lg:grid grid-cols-5 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="admin-stat-card rounded-3xl p-6 flex flex-col gap-3">
              <div
                className="icon-blob w-13 h-13 rounded-2xl flex items-center justify-center"
                style={{
                  background: `color-mix(in srgb, ${card.accent} 12%, transparent)`,
                  color: card.accent,
                }}
              >
                {card.icon}
              </div>
              <div>
                <p className="text-4xl font-black leading-none" style={{ color: "var(--text-primary)" }}>
                  {card.value}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-wide mt-1" style={{ color: "var(--text-secondary)" }}>
                  {card.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Exportar CSV ── */}
        <section className="admin-section rounded-2xl sm:rounded-3xl p-4 sm:p-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2
              className="text-base sm:text-2xl font-black italic uppercase tracking-tight flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}
            >
              <Download className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: "var(--text-accent)" }} />
              <span className="hidden sm:inline">Exportar Datos CSV</span>
              <span className="sm:hidden">Exportar</span>
            </h2>
          </div>

          <div className="overflow-x-auto no-scrollbar sm:overflow-visible">
            <div className="flex gap-3 sm:grid sm:grid-cols-4 sm:gap-4 min-w-max sm:min-w-0">
              {exportItems.map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleExport(item.type, item.label)}
                  className="export-btn rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left w-36 sm:w-auto flex-shrink-0"
                >
                  <span style={{ color: item.accent }} className="block mb-2 sm:mb-3">{item.icon}</span>
                  <div>
                    <h3
                      className="font-black text-xs sm:text-base truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.label}
                    </h3>
                    <p
                      className="text-[9px] sm:text-xs font-bold mt-0.5 truncate"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.sub}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Acciones Rápidas ── */}
        <section className="admin-section rounded-2xl sm:rounded-3xl p-4 sm:p-8">
          <h2
            className="text-base sm:text-2xl font-black italic uppercase tracking-tight mb-4 sm:mb-6 flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <Zap className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: "var(--text-accent)" }} />
            Acciones Rápidas
          </h2>

          <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-4">
            {quickActions.map((action) => (
              <button
                key={action.route}
                onClick={() => navigate(action.route)}
                className="action-btn rounded-xl sm:rounded-2xl p-4 sm:p-6 flex items-center gap-4 sm:block"
              >
                <div
                  className="icon-blob shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center sm:mb-4"
                  style={{
                    background: `color-mix(in srgb, ${action.accent} 12%, transparent)`,
                    color: action.accent,
                  }}
                >
                  {action.icon}
                </div>
                <div className="text-left sm:text-left">
                  <h3
                    className="font-black text-sm sm:text-lg leading-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {action.label}
                  </h3>
                  <p
                    className="text-[11px] sm:text-sm font-bold mt-0.5 sm:mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {action.sub}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Footer informativo ── */}
        <div className="text-center pt-4">
          <p
            className="text-[9px] sm:text-[10px] font-bold"
            style={{ color: "var(--text-muted)" }}
          >
            Los datos se actualizan automáticamente cada 30 segundos
          </p>
        </div>
      </div>
    </div>
  );
}