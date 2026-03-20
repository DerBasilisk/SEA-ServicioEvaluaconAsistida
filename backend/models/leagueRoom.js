const mongoose = require("mongoose");

const LEAGUES = ["bronze", "silver", "gold", "sapphire", "emerald", "diamond", "master", "champion", "heroic"];

const LEAGUE_CONFIG = {
  bronze:   { name: "Bronce",    icon: "🥉", color: "#cd7f32", order: 0 },
  silver:   { name: "Plata",     icon: "🥈", color: "#c0c0c0", order: 1 },
  gold:     { name: "Oro",       icon: "🥇", color: "#ffd700", order: 2 },
  sapphire: { name: "Zafiro",    icon: "💙", color: "#0f52ba", order: 3 },
  emerald:  { name: "Esmeralda", icon: "💚", color: "#50c878", order: 4 },
  diamond:  { name: "Diamante",  icon: "💎", color: "#b9f2ff", order: 5 },
  master:   { name: "Maestro",   icon: "🔮", color: "#9b59b6", order: 6 },
  champion: { name: "Campeón",   icon: "👑", color: "#f1c40f", order: 7 },
  heroic:   { name: "Heroico",   icon: "⚔️", color: "#ff4444", order: 8 },
};

const memberSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  xpEarned:   { type: Number, default: 0 },
  promoted:   { type: Boolean, default: false },
  demoted:    { type: Boolean, default: false },
  joinedAt:   { type: Date, default: Date.now },
}, { _id: false });

const leagueRoomSchema = new mongoose.Schema({
  league:     { type: String, enum: LEAGUES, required: true },
  weekStart:  { type: Date, required: true },
  members:    [memberSchema],
  processed:  { type: Boolean, default: false },
  roomNumber: { type: Number, required: true },
}, { timestamps: true });

leagueRoomSchema.index({ league: 1, weekStart: 1, roomNumber: 1 }, { unique: true });
leagueRoomSchema.index({ "members.user": 1, weekStart: 1 });

leagueRoomSchema.statics.LEAGUES = LEAGUES;
leagueRoomSchema.statics.LEAGUE_CONFIG = LEAGUE_CONFIG;

leagueRoomSchema.statics.getWeekStart = function() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Asignar usuario a una sala de liga
leagueRoomSchema.statics.assignUser = async function(userId, league = "bronze") {
  const weekStart = this.getWeekStart();
  const ROOM_SIZE = 30;

  // Verificar si ya está en una sala esta semana
  const existing = await this.findOne({
    weekStart,
    "members.user": userId,
  });
  if (existing) return existing;

  // Buscar sala con espacio
  let room = await this.findOne({
    league,
    weekStart,
    processed: false,
    $expr: { $lt: [{ $size: "$members" }, ROOM_SIZE] },
  });

  if (!room) {
    // Crear nueva sala
    const lastRoom = await this.findOne({ league, weekStart }).sort("-roomNumber");
    const roomNumber = lastRoom ? lastRoom.roomNumber + 1 : 1;
    room = await this.create({ league, weekStart, roomNumber, members: [] });
  }

  room.members.push({ user: userId, xpEarned: 0 });
  await room.save();
  return room;
};

module.exports = mongoose.model("LeagueRoom", leagueRoomSchema);