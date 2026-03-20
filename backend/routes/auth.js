const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("../Auth.account");
const { verificarToken  } = require("../middlewares/auth.middleware");
const User = require("../models/user");

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