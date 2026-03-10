const router = require("express").Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const { isAdmin } = require("../middlewares/admin.middleware");
const {
  getSubjects,
  getSubjectBySlug,
  createSubject,
  updateSubject,
  deleteSubject,
} = require("../controllers/subject");

// Rutas públicas autenticadas
router.get("/", verifyToken, getSubjects);
router.get("/:slug", verifyToken, getSubjectBySlug);

// Rutas de administración
router.post("/", verifyToken, isAdmin, createSubject);
router.put("/:id", verifyToken, isAdmin, updateSubject);
router.delete("/:id", verifyToken, isAdmin, deleteSubject);

module.exports = router;
