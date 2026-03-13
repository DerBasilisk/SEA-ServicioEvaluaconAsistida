const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const { connectDB } = require("./db/db");

// Rutas
const userRoutes = require("./routes/user");
const profileRoutes = require("./routes/profile");
const subjectRoutes = require("./routes/subject");
const lessonRoutes = require("./routes/lesson");
const questionRoutes = require("./routes/question");
const progressRoutes = require("./routes/progress");
const passport = require("./Auth.google");

const app = express();

// ── Middlewares globales ───────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(morgan("dev"));
app.use(passport.initialize());

// ── Rutas ──────────────────────────────────────────────────────
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/auth", require("./routes/auth"));
app.use("/api/password", require("./routes/password"));
app.use("/api/friends", require("./routes/friends"));

// ── Health check ───────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "SEA API corriendo", timestamp: new Date() });
});

// ── Manejo de rutas no encontradas ────────────────────────────
app.use((req, res) => {
  res.status(404).json({ ok: false, message: "Ruta no encontrada" });
});

// ── Manejo global de errores ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    ok: false,
    message: err.message || "Error interno del servidor",
  });
});

// ── Arranque ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
});
