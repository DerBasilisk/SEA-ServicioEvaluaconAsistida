const router = require("express").Router();
const { verificarToken } = require("../middlewares/auth.middleware");
const { register, login, getMe, checkUsername, changeUsername, changeDisplayName } = require("../controllers/user");

router.post("/register", register);
router.post("/login", login);
router.get("/me", verificarToken, getMe);
router.get("/check-username/:username", checkUsername);
router.put("/username", verificarToken, changeUsername);
router.put("/display-name", verificarToken, changeDisplayName);

module.exports = router;
