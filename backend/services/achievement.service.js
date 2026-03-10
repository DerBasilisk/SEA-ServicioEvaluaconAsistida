const { Achievement, User, UserProgress } = require("../models");

/**
 * Verifica y otorga logros al usuario según su estado actual.
 * Se llama al completar una lección.
 *
 * @returns {Array} Nuevos logros desbloqueados en esta sesión
 */
const checkAndGrantAchievements = async (user, streak, lastProgress) => {
  const allAchievements = await Achievement.find({ isActive: true });
  const alreadyUnlocked = new Set(user.achievements.map((a) => a.toString()));

  const completedLessons = await UserProgress.countDocuments({
    user: user._id,
    status: "completed",
  });

  const perfectLessons = await UserProgress.countDocuments({
    user: user._id,
    status: "completed",
    bestScore: 100,
  });

  const newlyUnlocked = [];

  for (const achievement of allAchievements) {
    if (alreadyUnlocked.has(achievement._id.toString())) continue;

    const { type, threshold } = achievement.condition;
    let met = false;

    switch (type) {
      case "streak_days":
        met = streak.current >= threshold;
        break;
      case "total_xp":
        met = user.xp >= threshold;
        break;
      case "lessons_completed":
        met = completedLessons >= threshold;
        break;
      case "perfect_lessons":
        met = perfectLessons >= threshold;
        break;
      case "daily_goal_days":
        met = streak.history.filter((h) => h.goalMet).length >= threshold;
        break;
    }

    if (met) {
      // Otorgar logro y recompensa
      user.achievements.push(achievement._id);
      user.xp += achievement.reward.xp;
      user.gems += achievement.reward.gems;
      newlyUnlocked.push({
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        rarity: achievement.rarity,
        reward: achievement.reward,
      });
    }
  }

  if (newlyUnlocked.length > 0) {
    await user.save();
  }

  return newlyUnlocked;
};

module.exports = { checkAndGrantAchievements };
