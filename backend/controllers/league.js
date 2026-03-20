const LeagueRoom = require("../models/leagueRoom");
const User = require("../models/user");
const { processWeeklyLeagues } = require("../services/league.service");

const LEAGUE_CONFIG = LeagueRoom.LEAGUE_CONFIG;
const PROMOTE_COUNT = 10;
const DEMOTE_COUNT = 10;

// GET /api/leagues/me — sala actual del usuario
const getMyLeague = async (req, res) => {
  try {
    const weekStart = LeagueRoom.getWeekStart();

    let room = await LeagueRoom.findOne({
      weekStart,
      "members.user": req.usuario._id,
    }).populate("members.user", "username displayName avatar level xp league");

    // Si no tiene sala, asignarle una
    if (!room) {
      const user = await User.findById(req.usuario._id).select("league");
      const league = user?.league || "bronze";
      room = await LeagueRoom.assignUser(req.usuario._id, league);
      room = await LeagueRoom.findById(room._id)
        .populate("members.user", "username displayName avatar level xp league");
    }

    // Ordenar miembros por XP
    const sortedMembers = [...room.members]
      .filter((m) => m.user !== null)
      .sort((a, b) => b.xpEarned - a.xpEarned)
      .map((m, i) => ({
        rank: i + 1,
        user: m.user,
        xpEarned: m.xpEarned,
        promoted: m.promoted,
        demoted: m.demoted,
        isMe: m.user._id.toString() === req.usuario._id.toString(),
      }));

    const myRank = sortedMembers.find((m) => m.isMe);
    const total = sortedMembers.length;
    const config = LEAGUE_CONFIG[room.league];

    // Calcular días hasta el reset (próximo lunes)
    const now = new Date();
    const nextMonday = new Date(weekStart);
    nextMonday.setDate(nextMonday.getDate() + 7);
    const daysLeft = Math.ceil((nextMonday - now) / (1000 * 60 * 60 * 24));

    res.json({
      ok: true,
      data: {
        league: room.league,
        leagueName: config.name,
        leagueIcon: config.icon,
        leagueColor: config.color,
        roomNumber: room.roomNumber,
        members: sortedMembers,
        myRank: myRank?.rank || null,
        myXP: myRank?.xpEarned || 0,
        total,
        promoteZone: PROMOTE_COUNT,
        demoteZone: total - DEMOTE_COUNT,
        daysLeft,
        weekStart,
      },
    });
  } catch (err) {
  console.error('[getMyLeague ERROR]', err);
  res.status(500).json({ ok: false, message: err.message });
  }
};



// GET /api/leagues/info — info de todas las ligas
const getLeaguesInfo = async (req, res) => {
  try {
    const user = await User.findById(req.usuario._id).select("league");
    res.json({
      ok: true,
      data: {
        currentLeague: user?.league || "bronze",
        leagues: Object.entries(LEAGUE_CONFIG).map(([key, val]) => ({ key, ...val })),
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// POST /api/leagues/process — admin: forzar procesamiento semanal
const forceProcess = async (req, res) => {
  try {
    const count = await processWeeklyLeagues();
    res.json({ ok: true, message: `Procesadas ${count} salas` });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

module.exports = { getMyLeague, getLeaguesInfo, forceProcess };