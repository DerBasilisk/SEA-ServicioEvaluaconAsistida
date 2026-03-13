import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Zap, Flame, Diamond, Heart, Trophy, Medal, Star, PersonStanding } from "lucide-react";
import Navbar from "../components/Navbar";
import UsernameInput from "../components/UsernameInput";
import useAuthStore from "../store/authStore";
import api from "../api/axios";

const rarityConfig = {
  common:    { border: "border-indigo-700",      bg: "bg-indigo-900/40",    text: "text-indigo-300", label: "Común"      },
  rare:      { border: "border-blue-500/50",     bg: "bg-blue-500/10",      text: "text-blue-400",   label: "Raro"       },
  epic:      { border: "border-purple-500/50",   bg: "bg-purple-500/10",    text: "text-purple-400", label: "Épico"      },
  legendary: { border: "border-yellow-500/50",   bg: "bg-yellow-500/10",    text: "text-yellow-400", label: "Legendario" },
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, fetchMe } = useAuthStore();

  const [displayName, setDisplayName]       = useState(user?.displayName || user?.username || "");
  const [newUsername, setNewUsername]       = useState(user?.username || "");
  const [savingDisplay, setSavingDisplay]   = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [msg, setMsg]                       = useState(null);
  const [editOpen, setEditOpen]             = useState(false);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleSaveDisplayName = async () => {
    setSavingDisplay(true);
    try {
      await api.put("/users/display-name", { displayName });
      await fetchMe();
      showMsg("ok", "Nombre actualizado");
    } catch (err) {
      showMsg("error", err.response?.data?.message || "Error al guardar");
    } finally {
      setSavingDisplay(false);
    }
  };

  const handleSaveUsername = async () => {
    if (newUsername === user?.username) return;
    setSavingUsername(true);
    try {
      await api.put("/users/username", { username: newUsername });
      await fetchMe();
      showMsg("ok", "Username actualizado");
    } catch (err) {
      showMsg("error", err.response?.data?.message || "Error al guardar");
    } finally {
      setSavingUsername(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  if (!user) return null;

  const achievements = user.achievements || [];

  const daysUntilChange = () => {
    if (!user?.usernameChangedAt) return null;
    const days = Math.ceil(30 - (Date.now() - new Date(user.usernameChangedAt)) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : null;
  };
  const daysLeft = daysUntilChange();

  return (
    <div className="min-h-screen bg-indigo-950 pb-20">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Card de usuario */}
        <div className="bg-indigo-900 border border-indigo-700 rounded-3xl p-8 mb-6 text-center relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-white">
            <Trophy size={120} />
          </div>
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-tr from-violet-600 to-fuchsia-500 rounded-full flex items-center justify-center text-white text-4xl font-black mx-auto mb-4 border-4 border-indigo-800 shadow-lg">
              {(user.displayName || user.username)?.[0]?.toUpperCase()}
            </div>
            <h1 className="text-white font-black text-3xl">{user.displayName || user.username}</h1>
            <p className="text-indigo-400 text-sm mb-1">@{user.username}</p>
            <p className="text-indigo-300 mb-4">{user.email}</p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-500/20 border border-violet-500/30 text-violet-300 rounded-full text-sm font-bold uppercase tracking-wider">
              <Medal size={16} />
              Nivel {user.level}
            </div>

            {/* Botón editar perfil */}
            <button
              onClick={() => setEditOpen(!editOpen)}
              className="mt-4 flex items-center gap-2 mx-auto text-indigo-400 hover:text-white text-sm transition"
            >
              ✏️ {editOpen ? "Cerrar edición" : "Editar perfil"}
            </button>
          </div>
        </div>

        {/* Panel de edición */}
        {editOpen && (
          <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-6 mb-6 space-y-5">
            <h2 className="text-white font-bold text-lg">Editar perfil</h2>

            {msg && (
              <div className={`rounded-xl px-4 py-3 text-sm font-bold text-center ${
                msg.type === "ok"
                  ? "bg-emerald-900 text-emerald-300 border border-emerald-600"
                  : "bg-red-900 text-red-300 border border-red-600"
              }`}>
                {msg.text}
              </div>
            )}

            {/* Nombre visible */}
            <div className="space-y-2">
              <label className="text-indigo-300 text-sm font-medium">
                Nombre visible
                <span className="text-indigo-500 ml-2 font-normal">— visible para todos, cambiable en cualquier momento</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={30}
                placeholder="Tu nombre visible"
                className="w-full bg-indigo-800 border-2 border-indigo-600 focus:border-violet-400 text-white rounded-xl px-4 py-3 outline-none transition placeholder-indigo-500"
              />
              <div className="flex justify-between items-center">
                <span className="text-indigo-600 text-xs">{displayName.length}/30</span>
                <button
                  onClick={handleSaveDisplayName}
                  disabled={savingDisplay || !displayName.trim()}
                  className="bg-violet-500 hover:bg-violet-400 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-sm transition active:scale-95"
                >
                  {savingDisplay ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>

            <div className="border-t border-indigo-700" />

            {/* Username */}
            <div className="space-y-2">
              <label className="text-indigo-300 text-sm font-medium">
                Username
                <span className="text-indigo-500 ml-2 font-normal">
                  — {daysLeft ? `próximo cambio en ${daysLeft} días` : "cambiable una vez cada 30 días"}
                </span>
              </label>
              <UsernameInput
                value={newUsername}
                onChange={setNewUsername}
                disabled={!!daysLeft}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveUsername}
                  disabled={savingUsername || !!daysLeft || newUsername === user?.username || newUsername.length < 3}
                  className="bg-violet-500 hover:bg-violet-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-xl text-sm transition active:scale-95"
                >
                  {savingUsername ? "Guardando..." : daysLeft ? `En ${daysLeft} días` : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Zap className="text-violet-400" />}    label="XP Total" value={user.xp} />
          <StatCard icon={<Flame className="text-orange-500" />}  label="Racha"    value={`${user.streak?.current || 0} días`} />
          <StatCard icon={<Diamond className="text-cyan-400" />}  label="Gemas"    value={user.gems} />
          <StatCard icon={<Heart className="text-red-500" />}     label="Vidas"    value={`${user.hearts?.current ?? 5}/5`} />
        </div>

        <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <PersonStanding className="text-yellow-500" size={24} fill="currentColor" />
              Amigos
            </h2>
            <Link to="/friends" className="text-indigo-400 text-sm font-medium">
              Ver amigos →
            </Link>
          </div>
        {/* Logros */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="text-yellow-500" size={24} fill="currentColor" />
              Tus Logros
            </h2>
            <span className="text-indigo-400 text-sm font-medium">{achievements.length} desbloqueados</span>
          </div>

          {achievements.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {achievements.map((achievement) => {
                const style = rarityConfig[achievement.rarity] || rarityConfig.common;
                return (
                  <div
                    key={achievement.key}
                    className={`${style.bg} border ${style.border} rounded-2xl p-4 flex items-center gap-4 transition-all hover:scale-[1.01]`}
                  >
                    <div className="w-14 h-14 bg-indigo-950 rounded-xl flex items-center justify-center text-3xl shadow-inner">
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="text-white font-bold">{achievement.name}</h3>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${style.text}`}>
                          {style.label}
                        </span>
                      </div>
                      <p className="text-indigo-300/80 text-sm">{achievement.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-indigo-900/30 border border-dashed border-indigo-700 rounded-2xl p-10 text-center">
              <Trophy className="mx-auto text-indigo-700 mb-3" size={40} />
              <p className="text-indigo-400 italic">Completa lecciones para ganar insignias</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full group flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-indigo-900/50 border border-indigo-700/50 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm hover:border-indigo-500 transition-colors">
      <div className="mb-2 p-2 bg-indigo-950 rounded-lg">{icon}</div>
      <div className="font-black text-xl text-white">{value}</div>
      <div className="text-indigo-400 text-[10px] uppercase font-bold tracking-widest">{label}</div>
    </div>
  );
}