const router = require("express").Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const { isAdmin } = require("../middlewares/admin.middleware");
const {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reviewQuestion,
  generateWithAI,
} = require("../controllers/question");

// Todas son de admin
router.get("/", verifyToken, isAdmin, getQuestions);
router.post("/", verifyToken, isAdmin, createQuestion);
router.post("/generate", verifyToken, isAdmin, generateWithAI);    // generar con IA
router.put("/:id", verifyToken, isAdmin, updateQuestion);
router.put("/:id/review", verifyToken, isAdmin, reviewQuestion);   // aprobar/rechazar IA
router.delete("/:id", verifyToken, isAdmin, deleteQuestion);

module.exports = router;
