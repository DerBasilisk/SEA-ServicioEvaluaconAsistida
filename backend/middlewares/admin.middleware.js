/**
 * Middleware que verifica que el usuario sea administrador.
 * Debe usarse DESPUÉS de auth.middleware.js
 */
const isAdmin = (req, res, next) => {
  if (!["admin", "superadmin"].includes(req.usuario?.role)) {
    return res.status(403).json({
      ok: false,
      message: "Acceso restringido a administradores",
    });
  }
  next();
};

const isSuperAdmin = (req, res, next) => {
  if (req.usuario?.role !== "superadmin") {
    return res.status(403).json({ 
      ok: false, 
      message: "Solo el superadmin puede realizar esta acción" 
    });
  }
  next();
};

module.exports = { isAdmin, isSuperAdmin };
