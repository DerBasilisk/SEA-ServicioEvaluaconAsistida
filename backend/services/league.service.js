const LeagueRoom = require("../models/leagueRoom");
const User = require("../models/user");

const LEAGUES = LeagueRoom.LEAGUES;
const PROMOTE_COUNT = 10;
const DEMOTE_COUNT = 10;

/**
 * Procesar ascensos y descensos al inicio de cada semana.
 * Se llama cada lunes a las 00:00.
 */
async function processWeeklyLeagues() {
  // En lugar de calcular la semana anterior exacta,
  // buscá todas las salas no procesadas cuyo weekStart sea anterior a hoy
  const currentWeekStart = LeagueRoom.getWeekStart();

  const rooms = await LeagueRoom.find({
    weekStart: { $lt: currentWeekStart },
    processed: false,
  }).populate("members.user", "username displayName league");

  let processed = 0;

  for (const room of rooms) {
    const sorted = [...room.members].sort((a, b) => b.xpEarned - a.xpEarned);
    const total = sorted.length;

    for (let i = 0; i < total; i++) {
      const member = sorted[i];
      const leagueIndex = LEAGUES.indexOf(room.league);

      if (i < PROMOTE_COUNT && leagueIndex < LEAGUES.length - 1) {
        member.promoted = true;
        const newLeague = LEAGUES[leagueIndex + 1];
        await User.findByIdAndUpdate(member.user._id, { league: newLeague });
        await LeagueRoom.assignUser(member.user._id, newLeague);
      } else if (i >= total - DEMOTE_COUNT && leagueIndex > 0) {
        member.demoted = true;
        const newLeague = LEAGUES[leagueIndex - 1];
        await User.findByIdAndUpdate(member.user._id, { league: newLeague });
        await LeagueRoom.assignUser(member.user._id, newLeague);
      } else {
        await User.findByIdAndUpdate(member.user._id, { league: room.league });
        await LeagueRoom.assignUser(member.user._id, room.league);
      }
    }

    room.processed = true;
    await room.save();
    processed++;
  }

  console.log(`[Leagues] Procesadas ${processed} salas`);
  return processed;
}

/**
 * Agregar XP a un usuario en su sala de liga actual.
 */
async function addLeagueXP(userId, xpAmount) {
  try {
    const weekStart = LeagueRoom.getWeekStart();
    const result = await LeagueRoom.findOneAndUpdate(
      { weekStart, "members.user": userId },
      { $inc: { "members.$.xpEarned": xpAmount } }
    );
    if (!result) {
      // Usuario no está en ninguna sala — asignarle una
      const user = await User.findById(userId).select("league");
      const league = user?.league || "bronze";
      const room = await LeagueRoom.assignUser(userId, league);
      await LeagueRoom.findOneAndUpdate(
        { _id: room._id, "members.user": userId },
        { $inc: { "members.$.xpEarned": xpAmount } }
      );
    }
  } catch (err) {
    console.error("[Leagues] Error agregando XP:", err.message);
  }
}

module.exports = { processWeeklyLeagues, addLeagueXP };