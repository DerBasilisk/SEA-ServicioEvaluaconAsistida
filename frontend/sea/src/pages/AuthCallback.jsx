import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      loginWithToken(token).then(() => {
        navigate("/", { replace: true });
      });
    } else {
      navigate("/login?error=google", { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-spin">⚙️</div>
        <p className="text-indigo-300">Iniciando sesión...</p>
      </div>
    </div>
  );
}