const UserProgress = require("../models/userProgress");
const Streak = require("../models/streak");

/**
 * Calcula la configuración adaptativa de una lección para un usuario.
 * 
 * @param {string} userId
 * @param {Object} lesson - documento de lección con difficulty base
 * @returns {Object} { questionCount, difficulty, easyRatio, hardRatio, activityScore }
 */
async function getAdaptiveConfig(userId, lesson) {
  try {
    const [weeklyLessons, streak, recentScores] = await Promise.all([
      // Lecciones completadas en los últimos 7 días
      UserProgress.countDocuments({
        user: userId,
        status: "completed",
        lastCompletedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),

      // Racha actual
      Streak.findOne({ user: userId }),

      // Score promedio de las últimas 10 lecciones completadas
      UserProgress.find({
        user: userId,
        status: "completed",
      })
        .sort({ lastCompletedAt: -1 })
        .limit(10)
        .select("lastScore"),
    ]);

    // ── Calcular score de actividad (0-100) ───────────────────

    // 1. Lecciones últimos 7 días (40%) — máximo útil: 14 lecciones/semana = 2/día
    const weeklyScore = Math.min(100, (weeklyLessons / 14) * 100);

    // 2. Racha (30%) — máximo útil: 30 días
    const streakDays = streak?.current || 0;
    const streakScore = Math.min(100, (streakDays / 30) * 100);

    // 3. Promedio de scores recientes (30%)
    const avgScore = recentScores.length > 0
      ? recentScores.reduce((sum, p) => sum + (p.lastScore || 0), 0) / recentScores.length
      : 50; // neutral si no hay historial

    // Score compuesto ponderado
    const activityScore = Math.round(
      weeklyScore * 0.4 +
      streakScore * 0.3 +
      avgScore * 0.3
    );

    // ── Determinar configuración según score ──────────────────
    let questionCount, difficulty, easyRatio, hardRatio;

    if (activityScore <= 30) {
      // Usuario poco activo o con bajo rendimiento
      // Menos preguntas, más difíciles (para mantener el desafío)
      questionCount = Math.floor(5 + (activityScore / 30) * 3); // 5-8
      difficulty = escalateDifficulty(lesson.difficulty, 1);
      easyRatio = 0.2;
      hardRatio = 0.5;

    } else if (activityScore <= 60) {
      // Usuario moderadamente activo
      // Cantidad y dificultad equilibradas
      questionCount = Math.floor(9 + ((activityScore - 31) / 29) * 4); // 9-13
      difficulty = lesson.difficulty; // mantener dificultad base
      easyRatio = 0.33;
      hardRatio = 0.33;

    } else {
      // Usuario muy activo con buen rendimiento
      // Más preguntas, dificultad ligeramente reducida (flujo y engagement)
      questionCount = Math.floor(14 + ((activityScore - 61) / 39) * 4); // 14-18
      difficulty = escalateDifficulty(lesson.difficulty, -1);
      easyRatio = 0.5;
      hardRatio = 0.2;
    }

    // Clamp entre 5 y 18
    questionCount = Math.max(5, Math.min(18, questionCount));

    return {
      questionCount,
      difficulty,
      easyRatio,
      hardRatio,
      activityScore,
      breakdown: {
        weeklyLessons,
        streakDays,
        avgScore: Math.round(avgScore),
        weeklyScore: Math.round(weeklyScore),
        streakScore: Math.round(streakScore),
      },
    };

  } catch (err) {
    console.error("Error en getAdaptiveConfig:", err.message);
    // Fallback seguro: configuración base de la lección
    return {
      questionCount: lesson.questionCount || 5,
      difficulty: lesson.difficulty || "beginner",
      easyRatio: 0.33,
      hardRatio: 0.33,
      activityScore: 50,
    };
  }
}

/**
 * Sube o baja la dificultad un nivel.
 * @param {string} current - "beginner" | "intermediate" | "advanced"
 * @param {number} delta   - 1 = subir, -1 = bajar
 */
function escalateDifficulty(current, delta) {
  const levels = ["beginner", "intermediate", "advanced"];
  const idx = levels.indexOf(current) ?? 0;
  const newIdx = Math.max(0, Math.min(2, idx + delta));
  return levels[newIdx];
}

/**
 * Selecciona preguntas de la BD respetando la mezcla de dificultades.
 * 
 * @param {Object[]} allQuestions - todas las preguntas activas de la lección
 * @param {number} count          - cantidad total a seleccionar
 * @param {number} easyRatio      - proporción de preguntas fáciles (0-1)
 * @param {number} hardRatio      - proporción de preguntas difíciles (0-1)
 * @returns {Object[]} preguntas seleccionadas y mezcladas
 */
function selectQuestions(allQuestions, count, easyRatio, hardRatio) {
  const easy   = allQuestions.filter((q) => q.difficulty === "easy");
  const medium = allQuestions.filter((q) => q.difficulty === "medium");
  const hard   = allQuestions.filter((q) => q.difficulty === "hard");

  const easyCount  = Math.round(count * easyRatio);
  const hardCount  = Math.round(count * hardRatio);
  const mediumCount = count - easyCount - hardCount;

  const pick = (arr, n) => arr.sort(() => Math.random() - 0.5).slice(0, n);

  const selected = [
    ...pick(easy,   Math.min(easyCount,   easy.length)),
    ...pick(medium, Math.min(mediumCount, medium.length)),
    ...pick(hard,   Math.min(hardCount,   hard.length)),
  ];

  // Si no hay suficientes de alguna dificultad, completar con las demás
  if (selected.length < count) {
    const used = new Set(selected.map((q) => q._id.toString()));
    const remaining = allQuestions
      .filter((q) => !used.has(q._id.toString()))
      .sort(() => Math.random() - 0.5)
      .slice(0, count - selected.length);
    selected.push(...remaining);
  }

  // Mezclar el orden final
  return selected.sort(() => Math.random() - 0.5).slice(0, count);
}

/**
 * Calcula el XP adaptativo según dificultad y cantidad de preguntas.
 * Más preguntas difíciles = más XP base.
 */
function getAdaptiveXPReward(baseXP, config) {
  const difficultyMultiplier = {
    beginner: 1,
    intermediate: 1.3,
    advanced: 1.6,
  };

  const quantityMultiplier = config.questionCount >= 14 ? 1.5
    : config.questionCount >= 9 ? 1.2
    : 1;

  return Math.round(baseXP * (difficultyMultiplier[config.difficulty] || 1) * quantityMultiplier);
}

module.exports = { getAdaptiveConfig, selectQuestions, getAdaptiveXPReward };