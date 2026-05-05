// backend/services/duel.service.js
const Redis = require("ioredis");
const Duel = require("../models/duel");        // ← nuevo modelo
const User = require("../models/user");         // para actualizar estadísticas

const redis = new Redis(process.env.REDIS_URL);

const DUEL_TTL = 60 * 30; // 30 minutos

// ──────────────── Funciones existentes (Redis) ────────────────
async function createDuel(duelId, data) {
  await redis.setex(`duel:${duelId}`, DUEL_TTL, JSON.stringify(data));
}

async function getDuel(duelId) {
  const raw = await redis.get(`duel:${duelId}`);
  return raw ? JSON.parse(raw) : null;
}

async function updateDuel(duelId, data) {
  await redis.setex(`duel:${duelId}`, DUEL_TTL, JSON.stringify(data));
}

async function deleteDuel(duelId) {
  await redis.del(`duel:${duelId}`);
}

async function createInvite(inviteId, data) {
  await redis.setex(`invite:${inviteId}`, 60 * 2, JSON.stringify(data));
}

async function getInvite(inviteId) {
  const raw = await redis.get(`invite:${inviteId}`);
  return raw ? JSON.parse(raw) : null;
}

async function deleteInvite(inviteId) {
  await redis.del(`invite:${inviteId}`);
}

// ──────────────── NUEVAS FUNCIONES (MongoDB) ────────────────

/**
 * Crea un duelo en MongoDB (persistente).
 * @param {Object} data - { duelId (opcional, se genera automático si no se da), lessonId, creatorId, players, conversationId?, type, maxPlayers? }
 * @returns {Promise<Object>} documento de Duel
 */
async function createDuelInMongo(data) {
  // Si ya viene un duelId (el mismo que en Redis), lo usamos como _id
  const duelData = {
    duelId: data.duelId || undefined,         // permite usar el mismo ID de Redis como _id de Mongo
    lesson: data.lessonId,
    creator: data.creatorId,
    players: data.players.map(p => ({
      user: p.userId,
      score: p.score || 0,
      correct: p.correct || 0,
      finished: p.finished || false,
      abandoned: p.abandoned || false,
    })),
    type: data.type || "direct",
    conversation: data.conversationId || null,
    maxPlayers: data.maxPlayers || 2,
    status: "active",        // se inicia directamente
    startedAt: new Date(),
    questions: data.questionIds || [],   // array de ObjectId
  };
  const duel = new Duel(duelData);
  await duel.save();
  return duel;
}

/**
 * Finaliza un duelo en MongoDB: calcula ganador, actualiza estadísticas de usuarios.
 * @param {string} duelId - ID del duelo (mismo que en Redis)
 * @param {Object} finalStats - Objeto con los resultados finales de cada jugador (desde Redis)
 * @returns {Promise<Object>} documento actualizado
 */
async function finishDuelInMongo(duelId, finalStats) {
  // Primero obtenemos el duelo de MongoDB
  let duel = await Duel.findOne({ duelId });
  if (!duel) {
    // Si no existe, puede ser que solo tengamos el ID de Redis y no se haya persistido aún.
    // En ese caso, creamos un documento a partir de los datos de Redis.
    const redisDuel = await getDuel({ duelId });
    if (!redisDuel) throw new Error(`Duelo ${duelId} no encontrado en Redis`);
    duel = await createDuelInMongo({
      duelId,
      lessonId: redisDuel.lessonId,
      creatorId: redisDuel.players[Object.keys(redisDuel.players)[0]]?.userId,
      players: Object.values(redisDuel.players).map(p => ({ userId: p.userId, score: p.score, correct: p.correct, finished: p.finished })),
      type: "direct",
      questionIds: redisDuel.questionIds,
    });
  }

  // Actualizar cada jugador con los datos finales
  for (const player of duel.players) {
    const fresh = finalStats.players?.find(p => p.userId === player.user.toString());
    if (fresh) {
      player.correct = fresh.correct;
      player.score = fresh.score;
      player.timeSpent = fresh.timeSpent;
      player.finishedAt = fresh.finishedAt ? new Date(fresh.finishedAt) : null;
      player.abandoned = fresh.abandoned || false;
    }
  }

  // Calcular ganador (mayor correct, menor tiempo)
  const sorted = [...duel.players].sort((a, b) => {
    if (a.correct !== b.correct) return b.correct - a.correct;
    const aTime = a.timeSpent || Infinity;
    const bTime = b.timeSpent || Infinity;
    return aTime - bTime;
  });
  duel.winner = sorted[0]?.user || null;
  duel.status = "finished";
  duel.endedAt = new Date();
  await duel.save();

  // Actualizar estadísticas de cada usuario (si tienes el campo duelsStats en User)
  for (const p of duel.players) {
    const isWinner = p.user.toString() === duel.winner?.toString();
    await User.updateOne(
      { _id: p.user },
      {
        $inc: {
          "duelsStats.total": 1,
          "duelsStats.wins": isWinner ? 1 : 0,
          "duelsStats.losses": isWinner ? 0 : 1,
        },
      }
    );
  }

  return duel;
}

/**
 * Marca un duelo como abandonado en MongoDB.
 */
async function abandonDuelInMongo(duelId, userId) {
  const duel = await Duel.findOne({ duelId });
  if (!duel) return null;
  const player = duel.players.find(p => p.user.toString() === userId);
  if (player) player.abandoned = true;
  duel.status = "abandoned";
  duel.endedAt = new Date();
  await duel.save();
  return duel;
}

/**
 * Obtiene un duelo desde MongoDB (historial)
 */
async function getDuelFromMongo(duelId) {
  return await Duel.findOne({ duelId }).populate("players.user lesson questions");
}

// ──────────────── Exportaciones ────────────────
module.exports = {
  // Redis
  createDuel,
  getDuel,
  updateDuel,
  deleteDuel,
  createInvite,
  getInvite,
  deleteInvite,
  redis,
  // MongoDB
  createDuelInMongo,
  finishDuelInMongo,
  abandonDuelInMongo,
  getDuelFromMongo,
};