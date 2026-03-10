const jwt = require("jsonwebtoken");
const User = require("../models/user");

const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token Requerido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await User.findById(decoded._id).select("-password");

    if (!usuario) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expirado, Inicia Sesión Nuevamente" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token Invalido" });
    }
    res.status(500).json({ message: "Error en la autentificacion", error: error.message });
  }
};

const soloAdmin = (req, res, next) => {
  if (req.usuario?.role !== "admin") {
    return res.status(403).json({ message: "Acceso Denegado: se requiere role admin" });
  }
  next();
};

const soloUser = (req, res, next) => {
  if (req.usuario?.role !== "user") {
    return res.status(403).json({ message: "Acceso Denegado: se requiere role user" });
  }
  next();
};

module.exports = { verificarToken, soloAdmin, soloUser };