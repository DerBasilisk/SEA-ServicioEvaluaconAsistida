const router = require("express").Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const {
  getLessonById,
  startLesson,
  answerQuestion,
  completeLesson,
  abandonLesson,
  getLessonsForReview,
} = require("../controllers/lesson");

// Flujo principal de juego
router.get("/review", verifyToken, getLessonsForReview);   // lecciones pendientes de repaso
router.get("/:id", verifyToken, getLessonById);            // metadata de la lección
router.post("/:id/start", verifyToken, startLesson);       // iniciar sesión + obtener preguntas
router.post("/:id/answer", verifyToken, answerQuestion);   // evaluar UNA respuesta
router.post("/:id/complete", verifyToken, completeLesson); // finalizar lección
router.post("/:id/abandon", verifyToken, abandonLesson);   // abandonar lección

module.exports = router;
