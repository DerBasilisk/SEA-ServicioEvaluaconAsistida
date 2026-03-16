const express = require("express");
const router = express.Router();
const { verificarToken } = require("../middlewares/auth.middleware");
const { isAdmin } = require("../middlewares/admin.middleware");
const { getMyLeague, getLeaguesInfo, forceProcess } = require("../controllers/league");

router.use(verificarToken);
router.get("/me",      getMyLeague);
router.get("/info",    getLeaguesInfo);
router.post("/process", isAdmin, forceProcess);

module.exports = router;