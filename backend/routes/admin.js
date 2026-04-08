// backend/routes/admin.js
const express = require("express");
const router = express.Router();

const { verificarToken } = require("../middlewares/auth.middleware");
const { isAdmin } = require("../middlewares/admin.middleware");
const ctrl = require("../controllers/admin");

router.use(verificarToken, isAdmin);

// Stats
router.get("/stats", ctrl.getStats);

// Usuarios
router.get("/users", ctrl.getUsers);
router.get("/users/:id/progress", ctrl.getUserProgress);
router.put("/users/:id", ctrl.updateUser);
router.put("/users/:id/ban", ctrl.banUser);
router.delete("/users/:id", ctrl.deleteUser);

// Materias
router.get("/subjects", ctrl.getSubjects);
router.post("/subjects", ctrl.createSubject);
router.put("/subjects/:id", ctrl.updateSubject);
router.delete("/subjects/:id", ctrl.deleteSubject);

// Unidades
router.get("/units", ctrl.getAllUnits);
router.get("/subjects/:subjectId/units", ctrl.getUnits);
router.post("/subjects/:subjectId/units", ctrl.createUnit);
router.put("/units/:id", ctrl.updateUnit);
router.delete("/units/:id", ctrl.deleteUnit);

// Lecciones
router.get("/lessons", ctrl.getAllLessons);
router.get("/units/:unitId/lessons", ctrl.getLessons);
router.post("/units/:unitId/lessons", ctrl.createLesson);
router.put("/lessons/:id", ctrl.updateLesson);
router.delete("/lessons/:id", ctrl.deleteLesson);

// Preguntas - CORREGIDO (quitamos createQuestion por ahora)
router.get("/questions", ctrl.getQuestions);
router.put("/questions/:id", ctrl.updateQuestion);
router.put("/questions/:id/review", ctrl.reviewQuestion);
router.delete("/questions/:id", ctrl.deleteQuestion);

// Import/Export
router.get("/export/subjects", ctrl.exportSubjects);
router.get("/export/units", ctrl.exportUnits);
router.get("/export/lessons", ctrl.exportLessons);
router.get("/export/questions", ctrl.exportQuestions);

// Generación de preguntas con IA
router.post("/questions/generate", ctrl.generateWithAI);
router.post("/questions", ctrl.createQuestion);

router.put("/questions/:id/clear-reports", ctrl.clearReports);

module.exports = router;