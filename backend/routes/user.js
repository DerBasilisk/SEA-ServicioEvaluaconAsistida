const router = require("express").Router();
const { verificarToken } = require("../middlewares/auth.middleware");
const { register, login, getMe } = require("../controllers/user");

router.post("/register", register);
router.post("/login", login);
router.get("/me", verificarToken, getMe);

module.exports = router;
