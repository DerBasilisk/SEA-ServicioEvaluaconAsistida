import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import api from "../api/axios";
import SEA_AUTH_CSS from "./auth-shared.css?inline";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");
  const [status, setStatus] = useState("loading"); // loading | success | error

  useEffect(() => {
    if (errorParam || !token) { setStatus("error"); return; }
    api
      .get(`/users/verify-email?token=${token}`)
      .then(() => {
        setStatus("success");
        setTimeout(() => { window.location.href = "/login?verified=true"; }, 3000);
      })
      .catch(() => setStatus("error"));
  }, [token, errorParam]);

  const panels = {
    loading: {
      tagline: ["Verificando", "tu cuenta,", "espera..."],
      sub: "Procesando verificación",
      icon: <Loader2 size={32} color="#2B7FE8" className="animate-spin" />,
      iconType: "loading",
      title: "Verificando tu cuenta...",
      message: "Por favor espera mientras validamos tu correo electrónico.",
      button: null,
    },
    success: {
      tagline: ["¡Cuenta", "verificada", "con éxito!"],
      sub: "Ya puedes ingresar",
      icon: <CheckCircle size={32} color="#22c55e" />,
      iconType: "success",
      title: "¡Cuenta verificada!",
      message: "Tu correo ha sido confirmado. Serás redirigido al inicio de sesión en unos segundos.",
      button: (
        <Link to="/login" style={{ textDecoration: "none" }}>
          <button className="sea-auth-btn">Ir al inicio de sesión →</button>
        </Link>
      ),
    },
    error: {
      tagline: ["Enlace", "inválido", "o expirado"],
      sub: "Error de verificación",
      icon: <XCircle size={32} color="#ef4444" />,
      iconType: "error",
      title: "Error de verificación",
      message: "El enlace es inválido o ha expirado. Solicita un nuevo correo de verificación desde la página anterior.",
      button: (
        <Link to="/verification-pending" style={{ textDecoration: "none" }}>
          <button className="sea-auth-btn">Solicitar nuevo enlace →</button>
        </Link>
      ),
    },
  };

  const p = panels[status];

  return (
    <>
      <style>{SEA_AUTH_CSS}</style>

      <div className="sea-auth sea-auth-wrapper">

        {/* ── Panel izquierdo ── */}
        <div className="sea-auth-left">
          <div className="sea-logo-badge">
            <div className="sea-logo-inner">
              <img src="/logos/LogoWhite.svg" width="64" alt="SEA" className="brightness-0 invert" />
            </div>
            <span className="sea-logo-label">Plataforma educativa</span>
          </div>

          <div className="sea-auth-tagline-block">
            <h1 className="sea-auth-tagline">
              {p.tagline[0]}<br />{p.tagline[1]}<br />{p.tagline[2]}
            </h1>
            <p className="sea-auth-tagline-sub">{p.sub}</p>
          </div>

          <div className="sea-auth-info-cards" />
        </div>

        {/* ── Panel derecho ── */}
        <div className="sea-auth-right">
          <div className="sea-auth-right-inner" style={{ textAlign: "center" }}>

            <div className={`sea-auth-status-icon ${p.iconType}`} style={{ margin: "0 auto 1.5rem" }}>
              {p.icon}
            </div>

            <h2 className="sea-auth-form-title" style={{ textAlign: "center" }}>{p.title}</h2>
            <p style={{ fontSize: 13, color: "#7A9CC5", fontWeight: 600, marginBottom: "2rem", lineHeight: 1.7, textAlign: "center" }}>
              {p.message}
            </p>

            {status === "success" && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#7A9CC5", fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
                <Loader2 size={13} className="animate-spin" style={{ color: "#2B7FE8" }} />
                Redirigiendo automáticamente...
              </div>
            )}

            {p.button}

            <p className="sea-auth-footer" style={{ marginTop: p.button ? 16 : 0 }}>
              <Link to="/login" style={{ color: "#7A9CC5", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <ArrowLeft size={12} /> Volver al inicio de sesión
              </Link>
            </p>

          </div>
        </div>

      </div>
    </>
  );
}