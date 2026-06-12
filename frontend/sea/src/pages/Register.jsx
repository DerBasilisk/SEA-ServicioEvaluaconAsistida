import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import useAuthStore from "../store/authStore";
import SEA_AUTH_CSS from "./auth-shared.css?inline";
import BackgroundAnimations from "../components/BackgroundAnimations";
import { LogoMark } from "../components/LogoMark";

export default function Register() {
  const navigate = useNavigate();
  const { register, error, clearError, user, isAuthenticated } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [localError, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user || isAuthenticated()) {
      navigate(user?.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    }
  }, [user, navigate, isAuthenticated]);

  const handleChange = (e) => {
    if (error) clearError();
    if (localError) setLocalError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setLocalError("Las contraseñas no coinciden");
      return;
    }
    setSubmitting(true);
    try {
      const res = await register(form.username, form.email, form.password);
      if (res?.ok) {
        navigate("/verification-pending", { state: { email: form.email } });
      } else {
        setLocalError(res?.message || "Error al registrarse");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <>
      <style>{SEA_AUTH_CSS}</style>

      <div className="sea-auth sea-auth-wrapper">
        {/* ── Panel izquierdo con animaciones ── */}
        <div className="sea-auth-left">
          <BackgroundAnimations />

          <div className="sea-logo-badge">
            <div className="sea-logo-inner">
              <LogoMark width={128} />
            </div>
            <span className="sea-logo-label"></span>
          </div>
          
          {/*
          <div className="sea-auth-tagline-block">
            <h1 className="sea-auth-tagline">
              Empieza<br />tu camino<br />ahora
            </h1>
            <p className="sea-auth-tagline-sub">Registro SEA</p>
          </div>

           Steps o características del registro 
          <div className="sea-auth-info-cards">
            <div className="sea-auth-info-card">
              <div className="sea-auth-info-icon">
                <User size={15} />
              </div>
              <div>
                <p className="sea-auth-info-title">Crea tu cuenta</p>
                <p className="sea-auth-info-desc">Con email o Google</p>
              </div>
            </div>
            <div className="sea-auth-info-card">
              <div className="sea-auth-info-icon" style={{ background: "rgba(255,255,255,0.15)" }}>
                <Mail size={15} />
              </div>
              <div>
                <p className="sea-auth-info-title">Verifica tu correo</p>
                <p className="sea-auth-info-desc">Recibirás un enlace</p>
              </div>
            </div>
            <div className="sea-auth-info-card">
              <div className="sea-auth-info-icon">
                <Lock size={15} />
              </div>
              <div>
                <p className="sea-auth-info-title">Comienza a practicar</p>
                <p className="sea-auth-info-desc">Acceso inmediato tras verificar</p>
              </div>
            </div>
          </div>*/}
        </div>

        {/* ── Panel derecho: formulario de registro ── */}
        <div className="sea-auth-right">
          <div className="sea-auth-right-inner">
            <h2 className="sea-auth-form-title">Nueva Cuenta</h2>
            <p className="sea-auth-form-subtitle">Comienza tu entrenamiento asistido</p>

            {displayError && (
              <div className="sea-auth-alert error sea-auth-shake">{displayError}</div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Username */}
              <div className="sea-auth-field">
                <label className="sea-auth-label">Usuario</label>
                <div style={{ position: "relative" }}>
                  <span className="sea-auth-input-icon-left"><User size={16} /></span>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    placeholder="¿Cómo te llamamos?"
                    className="sea-auth-input"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="sea-auth-field">
                <label className="sea-auth-label">Correo electrónico</label>
                <div style={{ position: "relative" }}>
                  <span className="sea-auth-input-icon-left"><Mail size={16} /></span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="tu@email.com"
                    className="sea-auth-input"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>

              {/* Contraseñas en grid (usando flex o grid, pero manteniendo estilo) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div className="sea-auth-field" style={{ marginBottom: 0 }}>
                  <label className="sea-auth-label">Contraseña</label>
                  <div style={{ position: "relative" }}>
                    <span className="sea-auth-input-icon-left"><Lock size={16} /></span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••"
                      className="sea-auth-input"
                      style={{ paddingLeft: 42 }}
                    />
                  </div>
                </div>
                <div className="sea-auth-field" style={{ marginBottom: 0 }}>
                  <label className="sea-auth-label">Confirmar</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirm"
                      value={form.confirm}
                      onChange={handleChange}
                      required
                      placeholder="••••••"
                      className="sea-auth-input"
                      style={{ paddingRight: 42 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="sea-auth-input-icon-right"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={submitting} className="sea-auth-btn">
                {submitting ? "Sincronizando..." : "Crear mi cuenta →"}
              </button>
            </form>

            <p className="sea-auth-footer">
              ¿Ya eres parte de SEA?{" "}
              <Link to="/login">Iniciar sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}