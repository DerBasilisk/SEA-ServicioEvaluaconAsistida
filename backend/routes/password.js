const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const User = require("../models/user");
const { sendPasswordResetEmail } = require("../services/email.service");

// POST /api/password/forgot
router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, message: "Email requerido" });

    const user = await User.findOne({ email });

    // Siempre responder igual para no revelar si el email existe
    if (!user) {
      return res.json({ ok: true, message: "Si el email existe, recibirás un link en breve" });
    }

    // Generar token seguro
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hora
    await user.save();

    await sendPasswordResetEmail(email, resetToken);

    res.json({ ok: true, message: "Si el email existe, recibirás un link en breve" });
  } catch (err) {
    console.error("Error en forgot password:", err.message);
    res.status(500).json({ ok: false, message: "Error al enviar el email" });
  }
});

// POST /api/password/reset
router.post("/reset", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ ok: false, message: "Token y contraseña requeridos" });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, message: "La contraseña debe tener al menos 6 caracteres" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ ok: false, message: "Token inválido o expirado" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ ok: true, message: "Contraseña actualizada correctamente" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;