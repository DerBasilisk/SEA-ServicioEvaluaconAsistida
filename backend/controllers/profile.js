const User = require("../models/user");

// GET /api/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.usuario._id).populate("achievements");
    res.json({ ok: true, data: user });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// PUT /api/profile
const updateProfile = async (req, res) => {
  try {
    const { username, avatar, dailyGoal, notifications } = req.body;

    // No permitir cambiar email/password por esta ruta
    const user = await User.findByIdAndUpdate(
      req.usuario._id,
      { username, avatar, dailyGoal, notifications },
      { new: true, runValidators: true }
    );

    res.json({ ok: true, data: user });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

// PUT /api/profile/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.usuario._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ ok: false, message: "Contraseña actual incorrecta" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ ok: true, message: "Contraseña actualizada" });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

module.exports = { getProfile, updateProfile, changePassword };
