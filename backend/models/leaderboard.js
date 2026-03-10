const mongoose = require("mongoose");

const leaderboardEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    xpEarned: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 0,
    },
    previousRank: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const leaderboardSchema = new mongoose.Schema(
  {
    weekStart: {
      type: Date,
      required: true,
      unique: true, // una entrada por semana
    },
    weekEnd: {
      type: Date,
      required: true,
    },
    subject: {
      // null = leaderboard global, ObjectId = leaderboard por materia
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },
    entries: [leaderboardEntrySchema],
    isFinalized: {
      type: Boolean,
      default: false, // true cuando la semana terminó y se otorgaron recompensas
    },
  },
  {
    timestamps: true,
  }
);

// ── Métodos estáticos ──────────────────────────────────────────

/**
 * Obtiene o crea el leaderboard de la semana actual
 */
leaderboardSchema.statics.getCurrentWeek = async function (subjectId = null) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // domingo
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return this.findOneAndUpdate(
    { weekStart, subject: subjectId },
    { $setOnInsert: { weekStart, weekEnd, subject: subjectId, entries: [] } },
    { upsert: true, new: true }
  );
};

/**
 * Agrega XP al leaderboard de la semana actual para un usuario
 */
leaderboardSchema.statics.addXP = async function (userId, xpAmount, subjectId = null) {
  const board = await this.getCurrentWeek(subjectId);

  const entryIndex = board.entries.findIndex(
    (e) => e.user.toString() === userId.toString()
  );

  if (entryIndex >= 0) {
    board.entries[entryIndex].xpEarned += xpAmount;
  } else {
    board.entries.push({ user: userId, xpEarned: xpAmount });
  }

  // Recalcular ranks
  board.entries.sort((a, b) => b.xpEarned - a.xpEarned);
  board.entries.forEach((e, i) => {
    e.previousRank = e.rank || i + 1;
    e.rank = i + 1;
  });

  await board.save();
  return board;
};

leaderboardSchema.index({ weekStart: -1, subject: 1 });

module.exports = mongoose.model("Leaderboard", leaderboardSchema);
