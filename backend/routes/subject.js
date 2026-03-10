const router = require("express").Router();
const { verificarToken } = require("../middlewares/auth.middleware");
const { isAdmin } = require("../middlewares/admin.middleware");
const {
  getSubjects,
  getSubjectBySlug,
  createSubject,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjects");

// Rutas públicas autenticadas
router.get("/", verificarToken, getSubjects);
router.get("/:slug", verificarToken, getSubjectBySlug);

// Rutas de administración
router.post("/", verificarToken, isAdmin, createSubject);
router.put("/:id", verificarToken, isAdmin, updateSubject);
router.delete("/:id", verificarToken, isAdmin, deleteSubject);

module.exports = router;
