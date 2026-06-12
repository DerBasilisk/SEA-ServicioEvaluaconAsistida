const express = require("express");
const router = express.Router();
const { sendContactEmail } = require("../services/email.service");

router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message)
    return res.status(400).json({ error: "Campos incompletos" });
  try {
    await sendContactEmail({ name, email, subject, message });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al enviar" });
  }
});

module.exports = router;