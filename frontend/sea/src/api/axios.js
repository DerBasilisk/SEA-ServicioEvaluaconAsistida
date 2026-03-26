// frontend/sea/src/api/axios.js
import axios from "axios";
import useAuthStore from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Inyectar token automáticamente en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sea_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejo global de errores (especialmente 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // Solo redirigir si NO estamos ya en el login
    if (status === 401 && !isLoginPath) {
      const { logout } = useAuthStore.getState();
      logout();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;