const { UserProgress, User, Streak, Achievement, Leaderboard } = require("../models");

// GET /api/progress/me
// Dashboard completo del usuario: XP, racha, logros, lecciones pendientes de repaso
const getMyProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("achievements");

    const streak = await Streak.findOne({ user: req.user._id });

    const today = new Date();
    const reviewsDue = await UserProgress.countDocuments({
      user: req.user._id,
      status: "completed",
      "spacedRepetition.nextReviewDate": { $lte: today },
    });

    const completedLessons = await UserProgress.countDocuments({
      user: req.user._id,
      status: "completed",
    });

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyXP = await UserProgress.aggregate([
      {
        $match: {
          user: req.user._id,
          lastCompletedAt: { $gte: weekStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalXPEarned" } } },
    ]);

    res.json({
      ok: true,
      data: {
        user: {
          username: user.username,
          avatar: user.avatar,
          xp: user.xp,
          level: user.level,
          xpForNextLevel: user.xpForNextLevel,
          xpProgress: user.xpProgress,
          gems: user.gems,
          hearts: user.hearts,
          dailyGoal: user.dailyGoal,
        },
        streak: streak
          ? {
              current: streak.current,
              longest: streak.longest,
              isAtRisk: streak.isAtRisk(),
              freezesAvailable: streak.freezes.available,
              history: streak.history.slice(-7), // últimos 7 días
            }
          : { current: 0, longest: 0, isAtRisk: false },
        stats: {
          completedLessons,
          reviewsDue,
          weeklyXP: weeklyXP[0]?.total || 0,
          achievementsCount: user.achievements.length,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// GET /api/progress/leaderboard
// Top 10 de la semana actual
const getLeaderboard = async (req, res) => {
  try {
    const board = await Leaderboard.getCurrentWeek(req.query.subjectId || null);
    await board.populate("entries.user", "username avatar level");

    const myEntry = board.entries.find(
      (e) => e.user?._id?.toString() === req.user._id.toString()
    );

    res.json({
      ok: true,
      data: {
        weekStart: board.weekStart,
        weekEnd: board.weekEnd,
        top10: board.entries.slice(0, 10),
        myRank: myEntry?.rank || null,
        myXP: myEntry?.xpEarned || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// GET /api/progress/achievements
// Todos los logros disponibles con estado desbloqueado/bloqueado
const getAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("achievements");
    const allAchievements = await Achievement.find({ isActive: true });

    const unlockedIds = user.achievements.map((a) => a._id.toString());

    const data = allAchievements.map((a) => ({
      ...a.toJSON(),
      unlocked: unlockedIds.includes(a._id.toString()),
    }));

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// PUT /api/progress/daily-goal
// Actualizar objetivo diario de XP
const updateDailyGoal = async (req, res) => {
  try {
    const { dailyGoal } = req.body;
    const validGoals = [10, 20, 30, 50];

    if (!validGoals.includes(Number(dailyGoal))) {
      return res.status(400).json({
        ok: false,
        message: `dailyGoal debe ser uno de: ${validGoals.join(", ")}`,
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { dailyGoal },
      { new: true }
    );

    res.json({ ok: true, data: { dailyGoal: user.dailyGoal } });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// POST /api/progress/refill-hearts
// Canjear gemas para recargar vidas
const refillHearts = async (req, res) => {
  try {
    const REFILL_COST = 50; // gemas
    const user = await User.findById(req.user._id);

    if (user.hearts.current >= 5) {
      return res.status(400).json({ ok: false, message: "Ya tenés 5 vidas" });
    }
    if (user.gems < REFILL_COST) {
      return res.status(400).json({
        ok: false,
        message: `Necesitás ${REFILL_COST} gemas. Tenés ${user.gems}`,
      });
    }

    user.gems -= REFILL_COST;
    user.refillHearts();
    await user.save();

    res.json({
      ok: true,
      data: { hearts: user.hearts.current, gems: user.gems },
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

module.exports = {
  getMyProgress,
  getLeaderboard,
  getAchievements,
  updateDailyGoal,
  refillHearts,
};
