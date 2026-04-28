import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Link2, Trash2, AlertTriangle, Eye,
  CheckCircle2, Volume2, VolumeX, SkipBack, SkipForward,
  Play, Pause, Shuffle,
} from "lucide-react";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import useThemeStore from "../store/themeStore";
import useAudioStore from "../store/audioStore";
import api from "../api/axios";

/* ─── Estilos Globales ────────────────────────────────────────────────────── */
const SETTINGS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

  .sea-settings { font-family: 'Nunito', sans-serif; }

  /* Animación de entrada por sección */
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sea-section {
    animation: fadeSlideUp 0.35s ease both;
  }
  .sea-section:nth-child(1) { animation-delay: 0.05s; }
  .sea-section:nth-child(2) { animation-delay: 0.10s; }
  .sea-section:nth-child(3) { animation-delay: 0.15s; }
  .sea-section:nth-child(4) { animation-delay: 0.20s; }
  .sea-section:nth-child(5) { animation-delay: 0.25s; }

  .sea-glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 2px solid var(--glass-border);
    box-shadow: 0 20px 50px var(--glass-shadow);
  }

  .sea-input {
    background: var(--sidebar-bg);
    border: 2px solid white;
    transition: all 0.3s ease;
  }
  .sea-input:focus {
    border-color: #2B7FE8;
    box-shadow: 0 0 15px var(--glass-shadow);
    outline: none;
  }

  .danger-zone {
    background: var(--danger-bg);
    border: 2px solid var(--negative);
    color: var(--negative);
  }

  /* Hover en items de lista */
  .sea-list-item {
    transition: background 0.2s ease, transform 0.15s ease;
  }
  .sea-list-item:hover { background: var(--card-bg); }
  .sea-list-item:active { transform: scale(0.99); }

  /* Toggle accesible */
  .sea-toggle:focus-visible {
    outline: 2px solid #2B7FE8;
    outline-offset: 2px;
  }

  /* ── Mobile responsive ──────────────────────────────────────────────────── */
  @media (max-width: 640px) {
    .sea-settings main {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
      padding-top: 1.5rem !important;
    }
    .sea-glass-card,
    .danger-zone {
      border-radius: 1.5rem !important;
      padding: 1.25rem !important;
    }
    .sea-settings h1  { font-size: 1.75rem !important; }
    .sea-settings .danger-zone button { width: 100%; justify-content: center; }

    /* Confirm buttons — stack vertical */
    .delete-confirm-btns { flex-direction: column !important; }

    /* Icono social más pequeño */
    .social-item-icon { width: 2.5rem !important; height: 2.5rem !important; }

    /* Fila daltonismo — stack vertical */
    .colorblind-row {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 1rem !important;
    }
    .colorblind-type-select { grid-template-columns: 1fr 1fr !important; }

    /* Player: controles más grandes en mobile */
    .player-controls button { padding: 0.75rem !important; }

    /* Banner texto más legible */
    .unlock-banner p { font-size: 11px !important; }
  }
`;

/* ─── Componente Principal ──────────────────────────────────────────────── */
export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput]             = useState("");
  const [deleting, setDeleting]                   = useState(false);
  const [msg, setMsg]                             = useState(null);

  const { colorblind, toggleColorblind, colorblindType, setColorblindType } =
    useThemeStore();

  const {
    musicEnabled, sfxEnabled, volume, trackIndex, shuffle, tracks,
    toggleMusic, toggleSfx, setVolume, nextTrack, prevTrack,
    setTrackIndex, toggleShuffle,
  } = useAudioStore();

  const handleDeleteAccount = async () => {
    if (deleteInput !== user?.username) return;
    setDeleting(true);
    try {
      await api.delete("/auth/delete-account");
      logout();
      navigate("/login");
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Error al eliminar la cuenta" });
      setTimeout(() => setMsg(null), 3000);
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div
      className="sea-settings min-h-screen pb-20 relative overflow-hidden"
      style={{ background: "var(--bg-gradient)" }}
    >
      <style>{SETTINGS_CSS}</style>

      {/* Decoración de fondo */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] rounded-full bg-white/20 blur-[100px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full bg-blue-400/10 blur-[100px]" />
      </div>

      <Navbar />

      <main className="max-w-3xl mx-auto px-6 pt-12 relative z-10">

        {/* Título */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-2 h-10 bg-[#2B7FE8] rounded-full shadow-[0_0_15px_rgba(43,127,232,0.5)]" />
          <h1 className="text-4xl font-black text-[--text-primary] uppercase italic tracking-tighter">
            Panel de Control
          </h1>
        </div>

        {/* Mensaje de estado */}
        {msg && (
          <div
            role="alert"
            className={`mb-6 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center animate-bounce shadow-lg ${
              msg.type === "ok"
                ? "bg-emerald-100 text-emerald-600"
                : "bg-rose-100 text-rose-600"
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* ── Identidades Vinculadas ─────────────────────────────────────── */}
        <section className="sea-section sea-glass-card rounded-[2.5rem] p-8 mb-8">
          <SectionHeader icon={<Link2 size={20} className="text-[#2B7FE8]" />}
            title="Identidades Vinculadas"
            subtitle="Sincronización de protocolos de acceso externo"
          />
          <div className="grid gap-4 mt-8">
            <SocialItem
              name="Google"
              active={!!user.googleId}
              icon="https://www.google.com/favicon.ico"
            />
          </div>
        </section>

        {/* ── Banner desbloqueo audio ────────────────────────────────────── */}
        <AudioUnlockBanner />

        {/* ── Música de Fondo ───────────────────────────────────────────── */}
        <section className="sea-section sea-glass-card rounded-[2.5rem] p-8 mb-8">
          <SectionHeader
            icon={
              musicEnabled && volume > 0
                ? <Volume2 size={20} className="text-[#2B7FE8]" />
                : <VolumeX  size={20} className="text-[#2B7FE8]" />
            }
            title="Música de Fondo"
            subtitle="Control de ambientación sonora"
          />

          {/* Mini reproductor */}
          <div className="p-5 bg-[--glass-bg] border-2 border-[--glass-border] rounded-[1.8rem] mb-3 mt-8">

            {/* Track actual + toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="min-w-0 flex-1 mr-4">
                <p className="text-[--text-primary] font-black italic uppercase text-sm truncate">
                  {tracks[trackIndex]?.title ?? "—"}
                </p>
                <p className="text-[9px] font-black text-[#7A9CC5] uppercase tracking-widest mt-0.5">
                  {trackIndex + 1} / {tracks.length}
                </p>
              </div>
              <Toggle
                checked={musicEnabled}
                onToggle={toggleMusic}
                ariaLabel="Activar música de fondo"
              />
            </div>

            {/* Controles de reproducción */}
            <div className="player-controls flex items-center justify-center gap-4 mb-4">
              <button
                onClick={toggleShuffle}
                title="Aleatorio"
                aria-pressed={shuffle}
                className={`p-2 rounded-xl transition-all ${
                  shuffle
                    ? "text-[#2B7FE8] bg-[#2B7FE8]/10"
                    : "text-[#7A9CC5] hover:text-[--text-primary]"
                }`}
              >
                <Shuffle size={16} />
              </button>
              <button
                onClick={prevTrack}
                aria-label="Pista anterior"
                className="p-2 text-[--text-primary] hover:text-[#2B7FE8] transition-colors"
              >
                <SkipBack size={20} />
              </button>
              <button
                onClick={toggleMusic}
                aria-label={musicEnabled ? "Pausar" : "Reproducir"}
                className="w-12 h-12 bg-[#2B7FE8] hover:bg-blue-600 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95"
              >
                {musicEnabled ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                onClick={nextTrack}
                aria-label="Pista siguiente"
                className="p-2 text-[--text-primary] hover:text-[#2B7FE8] transition-colors"
              >
                <SkipForward size={20} />
              </button>
            </div>

            {/* Lista de pistas */}
            <div className="space-y-1.5">
              {tracks.map((track, i) => (
                <button
                  key={track.id}
                  onClick={() => setTrackIndex(i)}
                  className={`sea-list-item w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left ${
                    i === trackIndex
                      ? "bg-[#2B7FE8]/10 border-2 border-[#2B7FE8]/30 text-[--text-primary]"
                      : "hover:bg-[--glass-bg] text-[--text-secondary]"
                  }`}
                >
                  <span className={`text-[9px] font-black uppercase tracking-widest w-4 flex-shrink-0 ${
                    i === trackIndex ? "text-[#2B7FE8]" : "text-[#7A9CC5]"
                  }`}>
                    {i === trackIndex && musicEnabled ? "▶" : i + 1}
                  </span>
                  <span className="font-black italic uppercase text-[11px] truncate">
                    {track.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Control de volumen */}
          <div className={`flex items-center gap-4 p-5 bg-[--glass-bg] border-2 border-[--glass-border] rounded-[1.8rem] mb-3 transition-opacity duration-200 ${
            musicEnabled ? "opacity-100" : "opacity-40 pointer-events-none"
          }`}>
            {volume === 0
              ? <VolumeX size={18} className="text-[#7A9CC5] flex-shrink-0" />
              : <Volume2 size={18} className="text-[#2B7FE8] flex-shrink-0" />}
            <input
              type="range" min="0" max="1" step="0.01"
              value={volume}
              aria-label="Volumen de música"
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 accent-[#2B7FE8]"
            />
            <span className="text-[--text-primary] font-black text-sm min-w-[3rem] text-right tabular-nums">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Efectos de sonido */}
          <div className="sea-list-item flex items-center justify-between p-5 bg-[--glass-bg] border-2 border-[--glass-border] rounded-[1.8rem]">
            <div>
              <p className="text-[--text-primary] font-black italic uppercase text-sm">
                Efectos de sonido
              </p>
              <p className="text-[9px] font-black text-[#7A9CC5] uppercase tracking-widest mt-0.5">
                Aciertos, errores y logros
              </p>
            </div>
            <Toggle
              checked={sfxEnabled}
              onToggle={toggleSfx}
              ariaLabel="Activar efectos de sonido"
            />
          </div>
        </section>

        {/* ── Accesibilidad Visual ───────────────────────────────────────── */}
        <section className="sea-section sea-glass-card rounded-[2.5rem] p-8 mb-8">
          <SectionHeader
            icon={<Eye size={20} className="text-[#2B7FE8]" />}
            title="Accesibilidad Visual"
            subtitle="Ajustes de percepción cromática"
          />

          {/* Toggle daltónico */}
          <div className="colorblind-row flex items-center justify-between p-5 bg-[--glass-bg] border-2 border-[--glass-border] rounded-[1.8rem] mb-3 mt-8">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5" aria-hidden="true">
                <div className="w-5 h-5 rounded-full border border-slate-200"
                  style={{ background: colorblind ? "#0077BB" : "#10B981" }} />
                <div className="w-5 h-5 rounded-full border border-slate-200"
                  style={{ background: colorblind ? "#EE7733" : "#EF4444" }} />
                {colorblind && (
                  <div className="w-5 h-5 rounded-full border border-slate-200"
                    style={{ background: "#CC79A7" }} />
                )}
              </div>
              <div>
                <p className="text-[--text-primary] font-black italic uppercase text-sm tracking-tight">
                  Modo Daltónico
                </p>
                <p className="text-[9px] font-black text-[#7A9CC5] uppercase tracking-widest mt-0.5">
                  {colorblind ? "Activo · Paleta Okabe-Ito" : "Paleta estándar"}
                </p>
              </div>
            </div>
            <Toggle
              checked={colorblind}
              onToggle={toggleColorblind}
              ariaLabel="Activar modo daltónico"
            />
          </div>

          {/* Selector de tipo — solo si está activo */}
          {colorblind && (
            <div className="p-5 bg-[--glass-bg] border-2 border-[--glass-border] rounded-[1.8rem] animate-in slide-in-from-top-2 duration-200">
              <p className="text-[9px] font-black text-[#7A9CC5] uppercase tracking-widest mb-3">
                Tipo de daltonismo
              </p>
              <div className="colorblind-type-select grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COLORBLIND_TYPES.map(({ id, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => setColorblindType(id)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                      colorblindType === id
                        ? "border-[#2B7FE8] bg-[#2B7FE8]/10 text-[--text-primary]"
                        : "border-[--glass-border] text-[--text-secondary] hover:border-[#2B7FE8]/40"
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-tight">{label}</p>
                    <p className="text-[9px] text-[#7A9CC5] mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Seguridad de Nodo (próximamente) ──────────────────────────── */}
        <section className="sea-section sea-glass-card rounded-[2.5rem] p-8 mb-12 border-dashed border-white/50">
          <div className="flex items-center justify-between opacity-60">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-[#2B7FE8]" />
              <h2 className="text-[--text-primary] font-black italic uppercase text-xl">
                Seguridad de Nodo
              </h2>
            </div>
            <span className="bg-white/50 px-3 py-1 rounded-lg text-[9px] font-black text-[#7A9CC5] uppercase">
              Próximamente
            </span>
          </div>
        </section>

        {/* ── Zona de Peligro ───────────────────────────────────────────── */}
        <section className="sea-section danger-zone rounded-[2.5rem] p-8 relative overflow-hidden mb-4">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle size={24} className="text-[--negative]" />
            <h2 className="text-[--negative] font-black italic uppercase text-xl tracking-tighter">
              Protocolo de Eliminación
            </h2>
          </div>

          <p className="text-[--negative]/60 text-[10px] font-bold uppercase tracking-widest mb-8 leading-relaxed max-w-md">
            Esta acción desmantelará tu perfil permanentemente. Todos los créditos, XP y
            condecoraciones serán purgados del sistema.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-3 bg-[--danger-bg] hover:bg-[--negative] hover:text-[--btn-text] border-2 border-[--negative] text-[--negative] font-black text-[10px] uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-sm active:scale-95"
            >
              <Trash2 size={16} />
              Iniciar Secuencia de Borrado
            </button>
          ) : (
            <div className="bg-[var(--glass-bg)] backdrop-blur-md rounded-3xl p-6 border-2 border-rose-500/20 animate-in slide-in-from-top-4 duration-300">
              <p className="text-rose-600 text-xs font-black uppercase mb-4">
                Confirma tu identidad escribiendo:{" "}
                <span className="text-[--text-primary] lowercase text-lg italic underline">
                  {user.username}
                </span>
              </p>

              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder={user.username}
                autoComplete="off"
                className="w-full sea-input rounded-2xl px-6 py-4 text-[--text-primary] font-bold mb-4"
              />

              {/* ← clase aplicada correctamente al div de botones */}
              <div className="delete-confirm-btns flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteInput !== user.username}
                  className="flex-[2] bg-rose-600 hover:bg-rose-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-rose-200"
                >
                  {deleting ? "Purgando Datos…" : "Confirmar Purga"}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-500 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl transition-all"
                >
                  Abortar
                </button>
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

/* ─── Constantes ──────────────────────────────────────────────────────────── */
const COLORBLIND_TYPES = [
  { id: "deuteranopia",  label: "Deuteranopía",  desc: "Verde" },
  { id: "protanopia",    label: "Protanopía",    desc: "Rojo"  },
  { id: "tritan",        label: "Tritanopía",    desc: "Azul"  },
  { id: "achromatopsia", label: "Acromatopsia",  desc: "Total" },
];

/* ─── Sub-componentes ─────────────────────────────────────────────────────── */

/** Encabezado de sección reutilizable */
function SectionHeader({ icon, title, subtitle }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-1">
        {icon}
        <h2 className="text-[--text-primary] font-black italic uppercase text-xl">{title}</h2>
      </div>
      <p className="text-[#7A9CC5] text-[10px] font-black uppercase tracking-[0.2em] ml-8">
        {subtitle}
      </p>
    </>
  );
}

/** Toggle reutilizable (accesible) */
function Toggle({ checked, onToggle, ariaLabel }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`sea-toggle relative w-14 h-7 rounded-full transition-colors duration-300 flex-shrink-0 ${
        checked ? "bg-[#2B7FE8]" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
          checked ? "translate-x-7" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/** Item de red social */
function SocialItem({ name, active, icon }) {
  return (
    <div className="sea-list-item flex items-center justify-between p-5 bg-[--glass-bg] border-2 border-[--glass-border] rounded-[1.8rem] group">
      <div className="flex items-center gap-4">
        <div className="social-item-icon w-12 h-12 bg-white rounded-2xl p-2.5 shadow-sm border-2 border-slate-100 group-hover:rotate-6 transition-transform flex-shrink-0">
          <img src={icon} alt={name} className="w-full h-full object-contain" />
        </div>
        <div>
          <p className="text-[--text-primary] font-black italic uppercase text-sm tracking-tight">
            {name}
          </p>
          <p className="text-[9px] font-black text-[#7A9CC5] uppercase tracking-widest mt-0.5">
            {active ? "Conexión Establecida" : "Pendiente de Sincronía"}
          </p>
        </div>
      </div>
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all flex-shrink-0 ${
        active
          ? "bg-emerald-50 border-emerald-100 text-emerald-500"
          : "bg-slate-50 border-slate-100 text-slate-300"
      }`}>
        {active
          ? <CheckCircle2 size={14} />
          : <div className="w-3.5 h-3.5 border-2 border-slate-200 rounded-full" />}
        <span className="text-[9px] font-black uppercase tracking-widest">
          {active ? "Activo" : "Locked"}
        </span>
      </div>
    </div>
  );
}

/**
 * Banner de desbloqueo de audio para navegadores con autoplay bloqueado.
 * Aparece cuando la música está habilitada en el store pero aún no hubo interacción.
 */
function AudioUnlockBanner() {
  const { musicEnabled } = useAudioStore();
  const [dismissed, setDismissed] = useState(false);

  if (!musicEnabled || dismissed) return null;

  return (
    <div
      role="status"
      className="unlock-banner mb-6 flex items-center justify-between gap-4 p-4 bg-[#2B7FE8]/10 border-2 border-[#2B7FE8]/30 rounded-2xl animate-in slide-in-from-top-2 duration-300"
    >
      <p className="text-[#2B7FE8] text-[10px] font-black uppercase tracking-widest leading-relaxed">
        🎵 Haz click aquí para activar la música de fondo
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Cerrar aviso de música"
        className="text-[#2B7FE8] text-[10px] font-black uppercase tracking-widest hover:underline flex-shrink-0"
      >
        OK
      </button>
    </div>
  );
}