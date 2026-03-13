const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL);

const DUEL_TTL = 60 * 30; // 30 minutos máximo por duelo

/**
 * Crear sala de duelo
 */
async function createDuel(duelId, data) {
  await redis.setex(`duel:${duelId}`, DUEL_TTL, JSON.stringify(data));
}

/**
 * Obtener estado del duelo
 */
async function getDuel(duelId) {
  const raw = await redis.get(`duel:${duelId}}`);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Actualizar estado del duelo
 */
async function updateDuel(duelId, data) {
  await redis.setex(`duel:${duelId}`, DUEL_TTL, JSON.stringify(data));
}

/**
 * Eliminar duelo
 */
async function deleteDuel(duelId) {
  await redis.del(`duel:${duelId}`);
}

/**
 * Guardar invitación pendiente
 */
async function createInvite(inviteId, data) {
  await redis.setex(`invite:${inviteId}`, 60 * 2, JSON.stringify(data)); // expira en 2 min
}

async function getInvite(inviteId) {
  const raw = await redis.get(`invite:${inviteId}`);
  return raw ? JSON.parse(raw) : null;
}

async function deleteInvite(inviteId) {
  await redis.del(`invite:${inviteId}`);
}

module.exports = { createDuel, getDuel, updateDuel, deleteDuel, createInvite, getInvite, deleteInvite };