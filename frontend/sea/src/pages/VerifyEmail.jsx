import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import api from "../api/axios";
import SEA_AUTH_CSS from "./auth-shared.css?inline";
import BackgroundAnimations from "../components/BackgroundAnimations";
import { LogoMark } from "../components/LogoMark";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") ?? "error";

  useEffect(() => {
    if (status === "success") {
      setTimeout(() => {
        window.location.href = "/login?verified=true";
      }, 3000);
    }
  }, [status]);

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
        <div className="sea-auth-left">
          <BackgroundAnimations />
          <div className="sea-logo-badge">
            <div className="sea-logo-inner">
              <LogoMark />
            </div>
          </div>

          {/* Opcional: tagline */}
          <div className="sea-auth-tagline-block">
            <h1 className="sea-auth-tagline">Verifica<br />tu correo</h1>
            <p className="sea-auth-tagline-sub">Activación de cuenta</p>
          </div>
        </div>

        <div className="sea-auth-right">
          {/* resto del contenido del panel derecho sin cambios */}
        </div>
      </div>
    </>
  );
}