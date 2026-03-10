/**
 * Middleware que verifica que el usuario sea administrador.
 * Debe usarse DESPUÉS de auth.middleware.js
 */
const isAdmin = (req, res, next) => {
  if (req.usuario?.role !== "admin") {
    return res.status(403).json({
      ok: false,
      message: "Acceso restringido a administradores",
    });
  }
  next();
};

module.exports = { isAdmin };
