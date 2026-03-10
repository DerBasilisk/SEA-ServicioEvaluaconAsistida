const router = require("express").Router();
const { verificarToken } = require("../middlewares/auth.middleware");
const { getProfile, updateProfile, changePassword } = require("../controllers/profile");

router.get("/", verificarToken, getProfile);
router.put("/", verificarToken, updateProfile);
router.put("/password", verificarToken, changePassword);

module.exports = router;
