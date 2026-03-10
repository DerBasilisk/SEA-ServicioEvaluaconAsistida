import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});

// Inyectar token en cada request automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sea_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirigir al login si el token expiró
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("sea_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
