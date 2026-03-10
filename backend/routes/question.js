const router = require("express").Router();
const { verificarToken } = require("../middlewares/auth.middleware");
const { isAdmin } = require("../middlewares/admin.middleware");
const {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reviewQuestion,
  generateWithAI,
} = require("../controllers/question");

router.get("/", verificarToken, isAdmin, getQuestions);
router.post("/", verificarToken, isAdmin, createQuestion);
router.post("/generate", verificarToken, isAdmin, generateWithAI);
router.put("/:id", verificarToken, isAdmin, updateQuestion);
router.put("/:id/review", verificarToken, isAdmin, reviewQuestion);
router.delete("/:id", verificarToken, isAdmin, deleteQuestion);

module.exports = router;
