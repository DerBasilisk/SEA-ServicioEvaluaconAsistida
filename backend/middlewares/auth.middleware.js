//middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import user from "../models/user.js";

export const verificarToken = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({message:"Token Requerido"})
        }

        const token = authHeader.split(" ")[1];
        console.log("Authorization header:", authHeader);
        console.log("Token extraído:", token);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("🔑 Token decodificado:", decoded);

        // Buscar por _id (que es lo que viene en el token)
        const usuario = await user.findById(decoded._id).select("-password");

        if (!usuario) {
            console.log("❌ Usuario NO encontrado");
            console.log("📌 decoded._id:", decoded._id);
            
            // Mostrar usuarios en DB para debug
            const usuarios = await user.find().limit(3).select("id _id correo");
            console.log("📋 Usuarios en DB:", JSON.stringify(usuarios, null, 2));
            
            return res.status(401).json({ message: "Usuario no encontrado" })
        }

        console.log("✅ Usuario encontrado:", usuario.correo);

        req.usuario = usuario;
        next();
        
    } catch (error) {
        console.error("❌ Error completo:", error);
        if(error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expirado, Inicia Sesión Nuevamente"});
        }
        if(error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Token Invalido"});
        }
        res.status(500).json({ message:"Error en la autentificacion", error: error.message})
    }
};

export const soloAdmin = (req,res, next) => {
    if(req.usuario?.rol !== "admin") {
        return res.status(403).json({ message: "Acceso Denegado: se requiere rol admin "});
    }
    next();
};

export const soloUser = (req,res, next) => {
    if(req.usuario?.rol !== "user") {
        return res.status(403).json({ message: "Acceso Denegado: se requiere rol user "});
    }
    next();
};