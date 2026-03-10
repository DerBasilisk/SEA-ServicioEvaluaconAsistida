const router = require("express").Router();
const { verificarToken } = require("../middlewares/auth.middleware");
const {
  getLessonById,
  startLesson,
  answerQuestion,
  completeLesson,
  abandonLesson,
  getLessonsForReview,
} = require("../controllers/lesson");

router.get("/review", verificarToken, getLessonsForReview);
router.get("/:id", verificarToken, getLessonById);
router.post("/:id/start", verificarToken, startLesson);
router.post("/:id/answer", verificarToken, answerQuestion);
router.post("/:id/complete", verificarToken, completeLesson);
router.post("/:id/abandon", verificarToken, abandonLesson);

module.exports = router;
