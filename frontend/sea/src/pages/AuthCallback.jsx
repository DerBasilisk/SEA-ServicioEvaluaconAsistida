// src/pages/AuthCallback.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      navigate("/login?error=google", { replace: true });
      return;
    }

    if (token) {
      loginWithToken(token).then((result) => {
        if (result?.ok) {
          // Redirección inteligente según rol
          if (result.isAdmin) {
            navigate("/admin", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        } else {
          // Si falló el loginWithToken
          navigate("/login?error=token", { replace: true });
        }
      });
    } else {
      navigate("/login?error=google", { replace: true });
    }
  }, [loginWithToken, navigate]);

  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-6 animate-spin">⚙️</div>
        <p className="text-indigo-300 text-lg">Verificando credenciales...</p>
        <p className="text-indigo-400 text-sm mt-2">Por favor espera un momento</p>
      </div>
    </div>
  );
}