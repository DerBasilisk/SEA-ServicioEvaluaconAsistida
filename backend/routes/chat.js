const express = require("express");
const multer = require("multer");
const { verificarToken } = require("../middlewares/auth.middleware");
const {
  getConversations,
  openDirect,
  createGroup,
  addParticipant,
  leaveGroup,
  getMessages,
  getUnread,
  deleteMessage,
  uploadChatImage,
} = require("../controllers/chat");

const router = express.Router();

// Multer en memoria (igual que upload.js existente)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Solo se permiten imágenes"));
  },
});

// Todas las rutas requieren autenticación
router.use(verificarToken);

// ── Conversaciones ─────────────────────────────────────────────
router.get("/conversations",                       getConversations);
router.post("/conversations/direct",               openDirect);
router.post("/conversations/group",                createGroup);
router.post("/conversations/:id/participants",     addParticipant);
router.delete("/conversations/:id/participants/me", leaveGroup);

// ── Mensajes ───────────────────────────────────────────────────
router.get("/conversations/:id/messages",          getMessages);
router.get("/unread",                              getUnread);
router.delete("/messages/:id",                     deleteMessage);

// ── Subida de imagen ───────────────────────────────────────────
router.post("/upload", upload.single("image"),     uploadChatImage);

module.exports = router;