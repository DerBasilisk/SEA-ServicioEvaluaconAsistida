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