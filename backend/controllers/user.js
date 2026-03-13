const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Streak = require("../models/streak");

const generateToken = (id) =>
  jwt.sign({ _id: id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/users/register
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ ok: false, message: "El email o username ya está en uso" });
    }

    const user = await User.create({ username, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      ok: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        xp: user.xp,
        level: user.level,
        hearts: user.hearts,
        gems: user.gems,
      },
      token,
    });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscamos al usuario y poblamos sus logros de una vez
    const user = await User.findOne({ email })
      .select("+password")
      .populate("achievements"); // <--- Importante aquí también

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ ok: false, message: "Email o contraseña incorrectos" });
    }

    // Buscamos la racha para enviarla en el login
    const streak = await Streak.findOne({ user: user._id });

    const token = generateToken(user._id);

    res.json({
      ok: true,
      data: {
        ...user.toJSON(), // Enviamos todo el objeto (ya poblado)
        password: undefined, // Por seguridad
        streak: { current: streak?.current || 0, longest: streak?.longest || 0 }
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// GET /api/users/me
const getMe = async (req, res) => {
  try {
    // Nota: Asegúrate de que el middleware de auth use 'usuario' o 'user' consistentemente
    const user = await User.findById(req.usuario._id).populate("achievements");
    const streak = await Streak.findOne({ user: req.usuario._id });

    if (!user) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });

    res.json({
      ok: true,
      data: {
        ...user.toJSON(),
        streak: { current: streak?.current || 0, longest: streak?.longest || 0 },
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const checkUsername = async (req, res) => {
  try {
    const { username } = req.params;
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.json({ ok: true, available: false, reason: "Formato inválido" });
    }
    const exists = await User.findOne({ username: username.toLowerCase() });
    res.json({ ok: true, available: !exists });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const changeUsername = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ ok: false, message: "Username requerido" });
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ ok: false, message: "Solo letras, números y guión bajo (3-20 caracteres)" });
    }

    const user = await User.findById(req.usuario._id);

    // Verificar cooldown de 30 días
    if (user.usernameChangedAt) {
      const daysSinceChange = (Date.now() - user.usernameChangedAt) / (1000 * 60 * 60 * 24);
      if (daysSinceChange < 30) {
        const daysLeft = Math.ceil(30 - daysSinceChange);
        return res.status(400).json({ ok: false, message: `Podés cambiar el username en ${daysLeft} días` });
      }
    }

    // Verificar disponibilidad
    const exists = await User.findOne({ username: username.toLowerCase(), _id: { $ne: user._id } });
    if (exists) return res.status(400).json({ ok: false, message: "Ese username ya está en uso" });

    user.username = username.toLowerCase();
    user.usernameChangedAt = new Date();
    await user.save();

    res.json({ ok: true, data: { username: user.username } });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

const changeDisplayName = async (req, res) => {
  try {
    const { displayName } = req.body;
    if (!displayName?.trim()) return res.status(400).json({ ok: false, message: "Nombre requerido" });
    if (displayName.length > 30) return res.status(400).json({ ok: false, message: "Máximo 30 caracteres" });

    const user = await User.findByIdAndUpdate(
      req.usuario._id,
      { displayName: displayName.trim() },
      { new: true }
    );

    res.json({ ok: true, data: { displayName: user.displayName } });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};


module.exports = { register, login, getMe, checkUsername, changeUsername, changeDisplayName };
