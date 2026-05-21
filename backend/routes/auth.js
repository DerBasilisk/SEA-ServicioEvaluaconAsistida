const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("../Auth.account");
const { verificarToken  } = require("../middlewares/auth.middleware");
const User = require("../models/user");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../services/email.service");

const generateToken = (id) =>
  jwt.sign({ _id: id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// GET /api/auth/google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// GET /api/auth/discord
router.get(
  "/discord",
  passport.authenticate("discord", { session: false })
);

// GET /api/auth/google/callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google`,
  }),
  (req, res) => {
    const token = generateToken(req.user._id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// GET /api/auth/discord/callback
router.get(
  "/discord/callback",
  passport.authenticate("discord", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=discord`,
  }),
  (req, res) => {
    const token = generateToken(req.user._id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// ========== REGISTRO CON EMAIL/PASSWORD + VERIFICACIÓN ==========
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ ok: false, message: "Todos los campos son requeridos" });
    }

    // Verificar si ya existe el usuario o email
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ ok: false, message: "El email o nombre de usuario ya está registrado" });
    }

    // Generar token de verificación (expira en 24h)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = new User({
      username,
      email,
      password,
      emailVerified: false,
      verificationToken,
      verificationExpires,
    });

    await user.save();

    // Enviar correo de verificación (ignorar error si no se puede enviar, pero se puede loguear)
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailErr) {
      console.error("Error enviando email de verificación:", emailErr);
      // No fallamos el registro, pero podrías devolver un warning
    }

    res.status(201).json({
      ok: true,
      message: "Usuario registrado. Revisa tu correo para verificar la cuenta.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Error interno del servidor" });
  }
});

// ========== VERIFICACIÓN DE EMAIL ==========
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.redirect(`${process.env.FRONTEND_URL}/verify-email?error=missing_token`);
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/verify-email?error=invalid_or_expired`);
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // Redirigir al frontend con mensaje de éxito
    res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
  } catch (error) {
    console.error(error);
    res.redirect(`${process.env.FRONTEND_URL}/verify-email?error=server_error`);
  }
});

// ========== REENVÍO DE CORREO DE VERIFICACIÓN ==========
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ ok: false, message: "Email requerido" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    }
    if (user.emailVerified) {
      return res.status(400).json({ ok: false, message: "La cuenta ya está verificada" });
    }

    // Generar nuevo token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationExpires = verificationExpires;
    await user.save();

    await sendVerificationEmail(email, verificationToken);

    res.json({ ok: true, message: "Correo de verificación reenviado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Error al reenviar verificación" });
  }
});

router.delete("/delete-account", verificarToken , async (req, res) => {
  try {
    await User.findByIdAndDelete(req.usuario._id);
    res.json({ ok: true, message: "Cuenta eliminada" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.get("/fix-leagues", async (req, res) => {
  const LeagueRoom = require("../models/leagueRoom");
  await LeagueRoom.updateMany(
    {},
    { $pull: { members: { user: null } } }
  );
  res.json({ ok: true, message: "Salas limpiadas" });
});

router.get("/fix-avatars", async (req, res) => {
  const User = require("../models/user");
  await User.updateMany({ avatar: "default_avatar" }, { $set: { avatar: null } });
  res.json({ ok: true });
});

module.exports = router;