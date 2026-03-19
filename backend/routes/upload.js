const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verificarToken } = require("../middlewares/auth.middleware");
const { uploadAvatar, uploadBanner } = require("../services/upload.service");
const User = require("../models/user");

// Multer en memoria — no guarda en disco
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten imágenes"));
    }
    cb(null, true);
  },
});

// POST /api/upload/avatar
router.post("/avatar", verificarToken, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: "No se recibió ninguna imagen" });

    const result = await uploadAvatar(req.file.buffer, req.usuario._id);

    await User.findByIdAndUpdate(req.usuario._id, { avatar: result.secure_url });

    res.json({ ok: true, data: { avatar: result.secure_url } });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/upload/banner
router.post("/banner", verificarToken, upload.single("banner"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: "No se recibió ninguna imagen" });

    const result = await uploadBanner(req.file.buffer, req.usuario._id);

    await User.findByIdAndUpdate(req.usuario._id, { banner: result.secure_url });

    res.json({ ok: true, data: { banner: result.secure_url } });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Manejo de errores de multer
router.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ ok: false, message: "La imagen no puede superar 5MB" });
  }
  res.status(400).json({ ok: false, message: err.message });
});

module.exports = router;
