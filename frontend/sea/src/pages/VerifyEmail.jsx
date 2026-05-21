// frontend/sea/src/pages/VerifyEmail.jsx
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import api from "../api/axios";

const VERIFY_CSS = `
  @keyframes verify-fade {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
  }
  .verify-card {
    background: var(--glass-bg);
    backdrop-filter: blur(24px);
    border: 1.5px solid var(--glass-border);
    box-shadow: 0 24px 64px var(--glass-shadow);
    animation: verify-fade 0.4s ease;
  }
`;

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");
  const [status, setStatus] = useState("loading"); // loading, success, error

  useEffect(() => {
    if (errorParam) {
      setStatus("error");
      return;
    }
    if (!token) {
      setStatus("error");
      return;
    }

    // Llamar al endpoint de verificación
    api
      .get(`/users/verify-email?token=${token}`)
      .then(() => {
        setStatus("success");
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          window.location.href = "/login?verified=true";
        }, 3000);
      })
      .catch((err) => {
        console.error("Verification error", err);
        setStatus("error");
      });
  }, [token, errorParam]);

  const getContent = () => {
    switch (status) {
      case "loading":
        return {
          icon: <Loader size={64} className="animate-spin text-[var(--text-accent)]" />,
          title: "Verificando tu cuenta...",
          message: "Por favor espera, estamos validando tu correo.",
          button: null,
        };
      case "success":
        return {
          icon: <CheckCircle size={64} className="text-green-500" />,
          title: "¡Cuenta verificada!",
          message: "Tu correo ha sido confirmado exitosamente. Serás redirigido al inicio de sesión en unos segundos.",
          button: (
            <Link to="/login" className="inline-block mt-6 px-6 py-2 bg-[var(--text-accent)] text-white rounded-xl font-bold">
              Ir a iniciar sesión ahora
            </Link>
          ),
        };
      case "error":
        return {
          icon: <XCircle size={64} className="text-rose-500" />,
          title: "Error de verificación",
          message: "El enlace es inválido o ha expirado. Solicita un nuevo correo de verificación.",
          button: (
            <Link to="/verification-pending" className="inline-block mt-6 px-6 py-2 bg-[var(--text-accent)] text-white rounded-xl font-bold">
              Solicitar nuevo enlace
            </Link>
          ),
        };
      default:
        return null;
    }
  };

  const content = getContent();
  if (!content) return null;

  return (
    <>
      <style>{VERIFY_CSS}</style>
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "var(--bg-gradient)" }}
      >
        <div className="verify-card rounded-[2.5rem] p-8 md:p-10 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">{content.icon}</div>
          <h1 className="text-2xl font-black tracking-tighter uppercase text-[var(--text-primary)] mb-3">
            {content.title}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{content.message}</p>
          {content.button && <div>{content.button}</div>}
        </div>
      </div>
    </>
  );
}