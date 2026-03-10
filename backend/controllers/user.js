const jwt = require("jsonwebtoken");
const User = require("../models/user");

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

// POST /api/users/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ ok: false, message: "Email o contraseña incorrectos" });
    }

    if (!user.isActive) {
      return res.status(403).json({ ok: false, message: "Cuenta desactivada" });
    }

    const token = generateToken(user._id);

    res.json({
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
        streak: user.streak,
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
    const user = await User.findById(req.usuario._id);
    res.json({ ok: true, data: user });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

module.exports = { register, login, getMe };
