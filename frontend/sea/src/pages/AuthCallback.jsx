import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import useAuthStore from "../store/authStore";

const CALLBACK_CSS = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in {
    animation: fade-in 0.4s ease-out;
  }
`;

const AUTH_TIMEOUT_MS = 8000;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuthStore();

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error || !token) {
      navigate("/login?error=google", { replace: true });
      return;
    }

    // Failsafe: si el backend no responde, no dejamos al usuario colgado
    const timeoutId = setTimeout(() => {
      if (isMounted) navigate("/login?error=timeout", { replace: true });
    }, AUTH_TIMEOUT_MS);

    loginWithToken(token)
      .then((result) => {
        if (!isMounted) return;
        clearTimeout(timeoutId);
        if (result?.ok) {
          navigate(result.isAdmin ? "/admin" : "/", { replace: true });
        } else {
          navigate("/login?error=token", { replace: true });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        clearTimeout(timeoutId);
        navigate("/login?error=token", { replace: true });
      });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [loginWithToken, navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-gradient)" }}
    >
      <style>{CALLBACK_CSS}</style>

      <div className="flex flex-col items-center fade-in">
        <Loader2 size={32} className="text-[#2B7FE8] animate-spin mb-4" />
        <p className="text-[--text-primary] text-sm font-medium">
          Iniciando sesión...
        </p>
      </div>
    </div>
  );
}