const User = require("../models/user");
const Friendship = require("../models/friendship");
const LeagueRoom = require("../models/leagueRoom");

console.log('✅ Controlador friends.js cargado');

// GET /api/friends — lista de amigos aceptados
const getFriends = async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [{ requester: req.usuario._id }, { recipient: req.usuario._id }],
      status: "accepted",
    }).populate("requester recipient", "username displayName xp level avatar hearts gems streak");

    const friends = friendships.map((f) =>
      f.requester._id.toString() === req.usuario._id.toString()
        ? f.recipient
        : f.requester
    );

    res.json({ ok: true, data: friends });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// GET /api/friends/requests — solicitudes pendientes recibidas
const getPendingRequests = async (req, res) => {
  try {
    const requests = await Friendship.find({
      recipient: req.usuario._id,
      status: "pending",
    }).populate("requester", "username displayName avatar level xp");

    res.json({ ok: true, data: requests });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// POST /api/friends/request — enviar solicitud por username
const sendRequest = async (req, res) => {
  console.log('📩 POST /friends/request recibido', req.body);

  try {
    const { username } = req.body;

    if (!username) {
      console.log('❌ Username no proporcionado');
      return res.status(400).json({ ok: false, message: "Username requerido" });
    }

    // Búsqueda más robusta (case insensitive)
    const recipient = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } 
    });

    console.log('👤 Usuario encontrado:', recipient ? recipient.username : null);

    if (!recipient) {
      console.log('❌ Usuario no encontrado:', username);
      return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    }

    if (recipient._id.toString() === req.usuario._id.toString()) {
      console.log('❌ Intento de auto-solicitud');
      return res.status(400).json({ ok: false, message: "No podés agregarte a vos mismo" });
    }

    // Verificar si ya existe una relación
    const existing = await Friendship.findOne({
      $or: [
        { requester: req.usuario._id, recipient: recipient._id },
        { requester: recipient._id, recipient: req.usuario._id },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ ok: false, message: "Ya son amigos" });
      }
      if (existing.status === "pending") {
        return res.status(400).json({ ok: false, message: "Solicitud ya enviada" });
      }
      if (existing.status === "rejected") {
        existing.status = "pending";
        existing.requester = req.usuario._id;
        existing.recipient = recipient._id;
        await existing.save();
        return res.json({ ok: true, message: "Solicitud reenviada" });
      }
    }

    // Crear nueva solicitud
    const newFriendship = await Friendship.create({ 
      requester: req.usuario._id, 
      recipient: recipient._id 
    });

    console.log('✅ Solicitud creada exitosamente');
    res.json({ 
      ok: true, 
      message: `Solicitud enviada a @${recipient.username}`,
      data: newFriendship 
    });

  } catch (err) {
    console.error('💥 ERROR en sendRequest:', err);
    res.status(500).json({ 
      ok: false, 
      message: "Error interno del servidor",
      error: err.message 
    });
  }
};

// PUT /api/friends/request/:id/accept
const acceptRequest = async (req, res) => {
  try {
    const friendship = await Friendship.findOne({
      _id: req.params.id,
      recipient: req.usuario._id,
      status: "pending",
    });
    if (!friendship) return res.status(404).json({ ok: false, message: "Solicitud no encontrada" });

    friendship.status = "accepted";
    await friendship.save();
    res.json({ ok: true, message: "Solicitud aceptada" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// PUT /api/friends/request/:id/reject
const rejectRequest = async (req, res) => {
  try {
    const friendship = await Friendship.findOne({
      _id: req.params.id,
      recipient: req.usuario._id,
      status: "pending",
    });
    if (!friendship) return res.status(404).json({ ok: false, message: "Solicitud no encontrada" });

    friendship.status = "rejected";
    await friendship.save();
    res.json({ ok: true, message: "Solicitud rechazada" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// DELETE /api/friends/:userId — eliminar amigo
const removeFriend = async (req, res) => {
  try {
    await Friendship.findOneAndDelete({
      $or: [
        { requester: req.usuario._id, recipient: req.params.userId },
        { requester: req.params.userId, recipient: req.usuario._id },
      ],
      status: "accepted",
    });
    res.json({ ok: true, message: "Amigo eliminado" });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// GET /api/friends/search?q=username — buscar usuarios
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ ok: true, data: [] });

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { displayName: { $regex: q, $options: "i" } },
      ],
      _id: { $ne: req.usuario._id },
      isActive: true,
    })
      .select("username displayName avatar level xp")
      .limit(8);

    // Agregar estado de amistad a cada resultado
    const withStatus = await Promise.all(users.map(async (u) => {
      const friendship = await Friendship.findOne({
        $or: [
          { requester: req.usuario._id, recipient: u._id },
          { requester: u._id, recipient: req.usuario._id },
        ],
      });
      return {
        ...u.toJSON(),
        friendStatus: friendship?.status || null,
        friendshipId: friendship?._id || null,
        isRequester: friendship?.requester.toString() === req.usuario._id.toString(),
      };
    }));

    res.json({ ok: true, data: withStatus });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// GET /api/friends/leaderboard — tabla semanal de amigos
const getFriendsLeaderboard = async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [{ requester: req.usuario._id }, { recipient: req.usuario._id }],
      status: "accepted",
    });

    const friendIds = friendships.map((f) =>
      f.requester.toString() === req.usuario._id.toString() ? f.recipient : f.requester
    );
    const allIds = [req.usuario._id, ...friendIds];

    const weekStart = LeagueRoom.getWeekStart();

    // Buscar XP de cada usuario en su sala de liga esta semana
    const entries = await Promise.all(allIds.map(async (userId) => {
      const room = await LeagueRoom.findOne({
        weekStart,
        "members.user": userId,
      });
      const member = room?.members.find((m) => m.user.toString() === userId.toString());
      const user = await User.findById(userId).select("username displayName avatar level");
      return {
        user,
        xpEarned: member?.xpEarned || 0,
      };
    }));

    const sorted = entries
      .filter((e) => e.user)
      .sort((a, b) => b.xpEarned - a.xpEarned)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    res.json({ ok: true, data: sorted });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// GET /api/friends/profile/:username — perfil público de un usuario
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
    .select("username displayName banner avatar level xp gems streak achievements league")
    .populate("achievements")
    .populate("activeFrame")
    .populate("activeBackground");

    if (!user) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });

    const friendship = await Friendship.findOne({
      $or: [
        { requester: req.usuario._id, recipient: user._id },
        { requester: user._id, recipient: req.usuario._id },
      ],
    });

    res.json({
      ok: true,
      data: {
        ...user.toJSON(),
        friendStatus: friendship?.status || null,
        friendshipId: friendship?._id || null,
        isRequester: friendship?.requester.toString() === req.usuario._id.toString(),
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

module.exports = {
  getFriends, getPendingRequests, sendRequest,
  acceptRequest, rejectRequest, removeFriend,
  searchUsers, getFriendsLeaderboard, getPublicProfile,
};