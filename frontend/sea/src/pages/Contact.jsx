import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Send, Mail, MessageCircle,
  Github, Instagram, CheckCircle, Loader2,
  AlertCircle, GraduationCap, MapPin, Clock,
} from "lucide-react";
import useThemeStore from "../store/themeStore";
import Footer from "../components/Footer";
import { LogoMark } from "../components/LogoMark";

/* ─────────────────────────────────────────────
   CSS del módulo
───────────────────────────────────────────── */
const CONTACT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,800;1,900&display=swap');

  .sea-contact { font-family: 'Nunito', sans-serif; }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-in  { animation: fadeSlideUp 0.4s ease both; }
  .delay-1     { animation-delay: 0.06s; }
  .delay-2     { animation-delay: 0.12s; }
  .delay-3     { animation-delay: 0.18s; }

  /* Glass card */
  .sea-glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 8px 32px var(--glass-shadow);
  }

  /* Input base */
  .sea-input {
    width: 100%;
    background: var(--card-bg);
    border: 1.5px solid var(--glass-border);
    border-radius: 16px;
    padding: 14px 16px;
    font-size: 13px;
    font-weight: 700;
    font-family: 'Nunito', sans-serif;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    resize: none;
  }
  .sea-input::placeholder {
    color: var(--text-secondary);
    font-weight: 600;
  }
  .sea-input:focus {
    border-color: var(--text-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent) 15%, transparent);
  }
  .sea-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Contact info card hover */
  .info-card {
    background: var(--card-bg);
    border: 1.5px solid var(--glass-border);
    border-radius: 20px;
    padding: 16px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    transition: border-color 0.2s, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .info-card:hover {
    border-color: var(--text-accent);
    transform: translateY(-2px);
  }

  .info-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* Social button */
  .social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 14px;
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-decoration: none;
    background: var(--card-bg);
    border: 1.5px solid var(--glass-border);
    color: var(--text-secondary);
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
  }
  .social-btn:hover {
    border-color: var(--text-accent);
    color: var(--text-accent);
    transform: translateY(-2px) scale(1.03);
  }

  /* Submit button states */
  .submit-btn {
    width: 100%;
    padding: 15px;
    border-radius: 18px;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-family: 'Nunito', sans-serif;
    background: var(--text-accent);
    color: var(--btn-text);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: opacity 0.2s, transform 0.15s;
    box-shadow: 0 8px 24px color-mix(in srgb, var(--text-accent) 30%, transparent);
  }
  .submit-btn:hover:not(:disabled)  { opacity: 0.92; transform: scale(1.01); }
  .submit-btn:active:not(:disabled) { transform: scale(0.98); }
  .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  /* Select dropdown */
  .sea-select {
    -webkit-appearance: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A9CC5' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 38px;
  }
`;

/* ─────────────────────────────────────────────
   Datos de contacto e info
───────────────────────────────────────────── */
const INFO_ITEMS = [
  {
    icon: <Mail size={16} />,
    color: "#2B7FE8",
    bg: "rgba(43,127,232,0.12)",
    label: "Correo del equipo",
    value: "no-reply@sealearn.online",
    sub: "Respuesta en 24–48 h hábiles",
  },
  {
    icon: <GraduationCap size={16} />,
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    label: "Institución",
    value: "SENA – Centro de Formación",
    sub: "Programa ADSO · Ficha activa",
  },
  {
    icon: <MapPin size={16} />,
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.12)",
    label: "Ubicación",
    value: "Colombia",
    sub: "Proyecto académico nacional",
  },
  {
    icon: <Clock size={16} />,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    label: "Horario de atención",
    value: "Lunes – Viernes",
    sub: "8:00 AM – 5:00 PM (COT)",
  },
];

const SUBJECTS = [
  "Consulta general",
  "Reporte de error",
  "Solicitud de nueva función",
  "Problema con mi cuenta",
  "Sugerencia de mejora",
  "Otro",
];

/* ─────────────────────────────────────────────
   Componente principal
───────────────────────────────────────────── */
export default function Contact() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const isValid =
    form.name.trim() &&
    form.email.includes("@") &&
    form.subject &&
    form.message.trim().length >= 10;

  const handleSubmit = async () => {
    if (!isValid || status === "loading") return;
    setStatus("loading");

    try {
      // Llama al endpoint del backend que usa email_service.js
      // Ajusta la ruta según tu configuración de api/axios
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Error al enviar");
      setStatus("success");
    } catch (err) {
      setErrorMsg("No se pudo enviar el mensaje. Intenta de nuevo.");
      setStatus("error");
    }
  };

  return (
    <div
      className="sea-contact min-h-screen relative overflow-x-hidden"
      style={{ background: "var(--bg-gradient)", color: "var(--text-primary)" }}
    >
      <style>{CONTACT_CSS}</style>

      {/* Blobs decorativos */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-[-5%] left-[-10%] w-[60%] h-[45%] rounded-full"
          style={{ background: "var(--deco-blob)", filter: "blur(100px)", opacity: 0.5 }}
        />
        <div
          className="absolute bottom-[-5%] right-[-10%] w-[55%] h-[40%] rounded-full"
          style={{ background: "var(--deco-blob2)", filter: "blur(110px)", opacity: 0.5 }}
        />
      </div>

      {/* ── Navbar mínima ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4 flex items-center gap-3"
        style={{
          borderBottom: "1.5px solid var(--glass-border)",
          background: "var(--glass-bg)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Volver atrás"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all
                     hover:scale-105 active:scale-95"
          style={{
            background: "var(--card-bg)",
            border: "1.5px solid var(--glass-border)",
            color: "var(--text-secondary)",
          }}
        >
          <ArrowLeft size={15} />
        </button>
        <div className="flex items-center gap-2">
          <LogoMark/>

          <span
            className="text-[10px] font-black uppercase tracking-[0.25em]"
            style={{ color: "var(--text-secondary)" }}
          >
            Contacto
          </span>
        </div>
      </nav>

      {/* ── Contenido principal ── */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16 md:pt-28">

        {/* Encabezado de página */}
        <div className="text-center mb-10 md:mb-14 animate-in">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-[9px] font-black uppercase tracking-[0.25em]"
            style={{
              background: "color-mix(in srgb, var(--text-accent) 10%, transparent)",
              border: "1.5px solid color-mix(in srgb, var(--text-accent) 25%, transparent)",
              color: "var(--text-accent)",
            }}
          >
            <MessageCircle size={12} />
            Estamos para ayudarte
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-[1.05] mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Habla con <span style={{ color: "var(--text-accent)" }}>el equipo.</span>
          </h1>
          <p
            className="text-sm md:text-base font-bold max-w-lg mx-auto leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            ¿Tienes dudas, encontraste un error o quieres proponer una mejora?
            Cuéntanos y lo atenderemos lo antes posible.
          </p>
        </div>

        {/* ── Grid principal ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">

          {/* ── Columna izquierda: info + redes ── */}
          <aside className="lg:col-span-2 space-y-4 animate-in delay-1">

            {/* Info cards */}
            <div className="sea-glass-card rounded-[2rem] p-5 sm:p-6 space-y-3">
              <h2
                className="text-[9px] font-black uppercase tracking-[0.25em] mb-4"
                style={{ color: "var(--text-secondary)" }}
              >
                Información de contacto
              </h2>
              {INFO_ITEMS.map((item) => (
                <div key={item.label} className="info-card">
                  <div
                    className="info-icon"
                    aria-hidden="true"
                    style={{ background: item.bg, color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p
                      className="text-[9px] font-black uppercase tracking-[0.15em] mb-0.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.label}
                    </p>
                    <p
                      className="text-[12px] font-black"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.value}
                    </p>
                    <p
                      className="text-[9px] font-semibold mt-0.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* SENA badge */}
            <div
              className="sea-glass-card rounded-[2rem] p-5 sm:p-6 flex items-start gap-4"
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                aria-hidden="true"
                style={{ background: "rgba(16,185,129,0.1)", border: "1.5px solid rgba(16,185,129,0.2)" }}
              >
                🎓
              </div>
              <div>
                <p
                  className="text-[10px] font-black uppercase tracking-[0.15em] mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Proyecto SENA ADSO
                </p>
                <p
                  className="text-[11px] font-semibold leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Sistema SEA fue desarrollado por aprendices del programa Análisis y
                  Desarrollo de Software del SENA como proyecto de formación.
                </p>
              </div>
            </div>

            {/* Redes sociales */}
            <div className="sea-glass-card rounded-[2rem] p-5 sm:p-6">
              <h2
                className="text-[9px] font-black uppercase tracking-[0.25em] mb-4"
                style={{ color: "var(--text-secondary)" }}
              >
                Redes del proyecto
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="mailto:no-reply@sealearn.online"
                  className="social-btn col-span-2"
                  aria-label="Enviar correo directo"
                >
                  <Mail size={14} />
                  Correo directo
                </a>
              </div>
            </div>
          </aside>

          {/* ── Columna derecha: formulario ── */}
          <div className="lg:col-span-3 animate-in delay-2">
            <div className="sea-glass-card rounded-[2rem] p-6 sm:p-8">

              {status === "success" ? (
                /* Estado de éxito */
                <div className="flex flex-col items-center justify-center py-12 text-center gap-5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    aria-hidden="true"
                    style={{ background: "rgba(16,185,129,0.1)", border: "1.5px solid rgba(16,185,129,0.3)" }}
                  >
                    <CheckCircle size={28} style={{ color: "#10B981" }} />
                  </div>
                  <div>
                    <h3
                      className="text-xl font-black uppercase italic tracking-tighter mb-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      ¡Mensaje enviado!
                    </h3>
                    <p
                      className="text-sm font-semibold leading-relaxed max-w-sm mx-auto"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Recibimos tu mensaje. El equipo de SEA te responderá en las próximas 24–48 horas hábiles.
                    </p>
                  </div>
                  <button
                    onClick={() => { setStatus(null); setForm({ name: "", email: "", subject: "", message: "" }); }}
                    className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02]"
                    style={{ background: "var(--text-accent)", color: "var(--btn-text)" }}
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                /* Formulario */
                <>
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-1">
                      <div
                        className="w-1.5 h-6 rounded-full"
                        style={{ background: "var(--text-accent)" }}
                        aria-hidden="true"
                      />
                      <h2
                        className="text-lg sm:text-xl font-black uppercase italic tracking-tighter"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Envíanos un mensaje
                      </h2>
                    </div>
                    <p
                      className="text-[11px] font-bold ml-4 pl-3.5"
                      style={{
                        color: "var(--text-secondary)",
                        borderLeft: "1.5px solid var(--glass-border)",
                      }}
                    >
                      Todos los campos son requeridos
                    </p>
                  </div>

                  {/* Error banner */}
                  {status === "error" && (
                    <div
                      className="flex items-center gap-3 p-3.5 rounded-2xl mb-5 text-[11px] font-bold"
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1.5px solid rgba(239,68,68,0.25)",
                        color: "#EF4444",
                      }}
                      role="alert"
                    >
                      <AlertCircle size={15} className="shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  <div className="space-y-4">

                    {/* Nombre + Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="contact-name"
                          className="block text-[9px] font-black uppercase tracking-[0.2em]"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Nombre completo
                        </label>
                        <input
                          id="contact-name"
                          name="name"
                          type="text"
                          placeholder="Tu nombre"
                          value={form.name}
                          onChange={handleChange}
                          disabled={status === "loading"}
                          className="sea-input"
                          autoComplete="name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="contact-email"
                          className="block text-[9px] font-black uppercase tracking-[0.2em]"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Correo electrónico
                        </label>
                        <input
                          id="contact-email"
                          name="email"
                          type="email"
                          placeholder="tu@correo.com"
                          value={form.email}
                          onChange={handleChange}
                          disabled={status === "loading"}
                          className="sea-input"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    {/* Asunto */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-subject"
                        className="block text-[9px] font-black uppercase tracking-[0.2em]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Tipo de consulta
                      </label>
                      <select
                        id="contact-subject"
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        disabled={status === "loading"}
                        className="sea-input sea-select"
                      >
                        <option value="" disabled>
                          Selecciona una categoría
                        </option>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Mensaje */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-message"
                        className="block text-[9px] font-black uppercase tracking-[0.2em]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Mensaje{" "}
                        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                          (mín. 10 caracteres)
                        </span>
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        rows={5}
                        placeholder="Escribe tu mensaje aquí con todos los detalles que consideres necesarios…"
                        value={form.message}
                        onChange={handleChange}
                        disabled={status === "loading"}
                        className="sea-input"
                      />
                      {/* Contador de caracteres */}
                      <p
                        className="text-right text-[9px] font-black"
                        style={{
                          color:
                            form.message.length < 10
                              ? "var(--text-secondary)"
                              : "#10B981",
                        }}
                        aria-live="polite"
                      >
                        {form.message.length} / 10 mín.
                      </p>
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleSubmit}
                      disabled={!isValid || status === "loading"}
                      className="submit-btn"
                      aria-label="Enviar mensaje de contacto"
                    >
                      {status === "loading" ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Enviando…
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          Enviar mensaje
                        </>
                      )}
                    </button>

                    <p
                      className="text-center text-[9px] font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Al enviar este formulario aceptas que el equipo de SEA te contacte por correo electrónico.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}