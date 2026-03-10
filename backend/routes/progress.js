const router = require("express").Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const {
  getMyProgress,
  getLeaderboard,
  getAchievements,
  updateDailyGoal,
  refillHearts,
} = require("../controllers/progress");

router.get("/me", verifyToken, getMyProgress);                  // dashboard del usuario
router.get("/leaderboard", verifyToken, getLeaderboard);        // top 10 semanal
router.get("/achievements", verifyToken, getAchievements);      // todos los logros
router.put("/daily-goal", verifyToken, updateDailyGoal);        // cambiar objetivo diario
router.post("/refill-hearts", verifyToken, refillHearts);       // comprar vidas con gemas

module.exports = router;
