const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("../Auth.account");

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

module.exports = router;