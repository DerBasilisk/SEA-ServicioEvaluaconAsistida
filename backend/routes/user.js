const router = require("express").Router();
const { verificarToken } = require("../middlewares/auth.middleware");
const { register, login, getMe, checkUsername, changeUsername, changeDisplayName, toggleFavoriteSubject, verifyEmail, resendVerification } = require("../controllers/user");

router.post("/register", register);
router.post("/login", login);
router.get("/me", verificarToken, getMe);
router.get("/check-username/:username", checkUsername);
router.put("/username", verificarToken, changeUsername);
router.put("/display-name", verificarToken, changeDisplayName);
router.post("/toggle-favorite", verificarToken, toggleFavoriteSubject);
// En user.routes.js — agrega esta ruta
router.get("/reset-password", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.redirect(`${process.env.FRONTEND_URL}/reset-password?error=missing`);
  // Solo redirige al frontend pasando el token para que el form lo use
  res.redirect(`${process.env.FRONTEND_URL}/reset-password?token=${token}`);
});
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

module.exports = router;
