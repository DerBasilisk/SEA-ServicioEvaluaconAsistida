import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from "lucide-react";
import useAuthStore from "../store/authStore";
import SEA_AUTH_CSS from "./auth-shared.css?inline";
import BackgroundAnimations from "../components/BackgroundAnimations";

export default function VerificationPending() {
  const location = useLocation();
  const email = location.state?.email || "";
  const { resendVerification, loading } = useAuthStore();
  const [resendStatus, setResendStatus] = useState({ sent: false, error: "" });

  const handleResend = async () => {
    if (!email) {
      setResendStatus({ sent: false, error: "No se pudo identificar tu correo. Intenta registrarte nuevamente." });
      return;
    }
    const result = await resendVerification(email);
    if (result.ok) {
      setResendStatus({ sent: true, error: "" });
      setTimeout(() => setResendStatus({ sent: false, error: "" }), 5000);
    } else {
      setResendStatus({ sent: false, error: result.message });
    }
  };

  return (
    <>
      <style>{SEA_AUTH_CSS}</style>
      <div className="sea-auth sea-auth-wrapper">
        <div className="sea-auth-left">
          <BackgroundAnimations />  {/* ← agregar animaciones */}
          
          <div className="sea-logo-badge">
            <div className="sea-logo-inner">
              <img src="/logos/LogoWhite.svg" width="128" alt="SEA" className="brightness-0 invert" />
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