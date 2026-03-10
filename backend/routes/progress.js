const router = require("express").Router();
const { verificarToken } = require("../middlewares/auth.middleware");
const {
  getMyProgress,
  getLeaderboard,
  getAchievements,
  updateDailyGoal,
  refillHearts,
} = require("../controllers/progress");

router.get("/me", verificarToken, getMyProgress);
router.get("/leaderboard", verificarToken, getLeaderboard);
router.get("/achievements", verificarToken, getAchievements);
router.put("/daily-goal", verificarToken, updateDailyGoal);
router.post("/refill-hearts", verificarToken, refillHearts);

module.exports = router;
