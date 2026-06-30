const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const User = require("../models/user");
const { sendPasswordResetEmail } = require("../services/email.service");

// POST /api/password/forgot
router.post("/forgot", async (req, res) => {
  console.log("[forgot] 1. Request recibido", req.body.email);
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, message: "Email requerido" });

    console.log("[forgot] 2. Antes de User.findOne");
    const user = await User.findOne({ email });
    console.log("[forgot] 3. Después de User.findOne, user encontrado:", !!user);

    if (!user) {
      console.log("[forgot] 4. Usuario no existe, respondiendo");
      return res.json({ ok: true, message: "Si el email existe, recibirás un link en breve" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;

    console.log("[forgot] 5. Antes de user.save()");
    await user.save();
    console.log("[forgot] 6. Después de user.save()");

    console.log("[forgot] 7. Antes de sendPasswordResetEmail");
    await sendPasswordResetEmail(email, resetToken);
    console.log("[forgot] 8. Después de sendPasswordResetEmail");

    console.log("[forgot] 9. Respondiendo al cliente");
    res.json({ ok: true, message: "Si el email existe, recibirás un link en breve" });
  } catch (err) {
    console.error("[forgot] ERROR:", err);
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