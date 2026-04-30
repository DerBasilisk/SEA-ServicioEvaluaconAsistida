const mongoose = require("mongoose");

/**
 * Subdocumento para cada jugador en un duelo
 */
const duelPlayerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    correct: {
      type: Number,
      default: 0,
      min: 0,
    },
    timeSpent: {
      type: Number, // milisegundos totales que tardó en completar
      default: null,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
    abandoned: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

/**
 * Esquema principal del Duelo
 */
const duelSchema = new mongoose.Schema(
  {
    // Relación con el chat (si el duelo se originó o notificó en una conversación)
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
      index: true,
    },

    // Lección sobre la que trata el duelo
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },

    // Tipo de duelo: directo (1v1) o grupal (más de 2)
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
    },

    // Quién creó el duelo (útil para mostrar en listados)
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Lista de jugadores participantes
    players: [duelPlayerSchema],

    // Ganador del duelo (si terminó normalmente)
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // IDs de las preguntas usadas en el duelo (para auditoría/replay)
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],

    // Estado del duelo
    status: {
      type: String,
      enum: ["waiting", "active", "finished", "abandoned"],
      default: "waiting",
    },

    // Timestamps importantes
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },

    // Máximo de jugadores permitidos (para duelos grupales)
    maxPlayers: {
      type: Number,
      default: 2,
      min: 2,
      max: 10,
    },

    // Turno actual (solo si el duelo es por turnos, opcional)
    currentTurn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Código único para unirse a un duelo grupal (modo "cualquiera puede unirse")
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    // Para duplicar la configuración de preguntas (opcional)
    questionCount: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ───── ÍNDICES ──────────────────────────────────────────────
duelSchema.index({ conversation: 1, createdAt: -1 });
duelSchema.index({ creator: 1, status: 1 });
duelSchema.index({ "players.user": 1, status: 1 });

// ───── MÉTODOS ESTÁTICOS ───────────────────────────────────

/**
 * Crea un duelo directo (1v1) y lo guarda en MongoDB.
 * @param {Object} data - { creatorId, opponentId, lessonId, conversationId? }
 */
duelSchema.statics.createDirect = async function (data) {
  const Duel = this;
  const duel = new Duel({
    conversation: data.conversationId || null,
    lesson: data.lessonId,
    type: "direct",
    creator: data.creatorId,
    players: [
      { user: data.creatorId },
      { user: data.opponentId },
    ],
    status: "waiting",
    maxPlayers: 2,
  });
  await duel.save();
  return duel;
};

/**
 * Crea un duelo grupal (sala de espera) y genera un código de invitación.
 * @param {Object} data - { creatorId, lessonId, maxPlayers?, conversationId? }
 */
duelSchema.statics.createGroup = async function (data) {
  const Duel = this;
  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  const duel = new Duel({
    conversation: data.conversationId || null,
    lesson: data.lessonId,
    type: "group",
    creator: data.creatorId,
    players: [{ user: data.creatorId }],
    status: "waiting",
    maxPlayers: data.maxPlayers || 4,
    inviteCode,
  });
  await duel.save();
  return duel;
};

/**
 * Marca un duelo como iniciado (activo).
 */
duelSchema.methods.start = async function () {
  this.status = "active";
  this.startedAt = new Date();
  await this.save();
  return this;
};

/**
 * Finaliza el duelo, calcula el ganador y guarda estadísticas.
 * @param {Object} results - Opcional, si quieres pasar datos extra (por ejemplo desde Redis)
 */
duelSchema.methods.finish = async function (results = {}) {
  if (this.status === "finished") return this;

  // Actualizar tiempos y puntajes desde `results` si se proveen
  if (results.players) {
    for (const player of this.players) {
      const fresh = results.players.find(p => p.userId?.toString() === player.user.toString());
      if (fresh) {
        player.correct = fresh.correct ?? player.correct;
        player.score = fresh.score ?? player.score;
        player.timeSpent = fresh.timeSpent ?? player.timeSpent;
        player.finishedAt = fresh.finishedAt ? new Date(fresh.finishedAt) : player.finishedAt;
      }
    }
  }

  // Determinar ganador (orden: más aciertos, menor tiempo)
  const sorted = [...this.players].sort((a, b) => {
    if (a.correct !== b.correct) return b.correct - a.correct;
    const aTime = a.timeSpent || Infinity;
    const bTime = b.timeSpent || Infinity;
    return aTime - bTime;
  });
  this.winner = sorted[0]?.user || null;

  this.status = "finished";
  this.endedAt = new Date();

  // Incrementar estadísticas de usuario (si tienes campo duelsStats)
  const User = mongoose.model("User");
  for (const p of this.players) {
    const isWinner = p.user.toString() === this.winner?.toString();
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

  await this.save();
  return this;
};

/**
 * Abandona el duelo (un jugador se rinde)
 */
duelSchema.methods.abandon = async function (userId) {
  const player = this.players.find(p => p.user.toString() === userId.toString());
  if (player) player.abandoned = true;
  this.status = "abandoned";
  this.endedAt = new Date();
  await this.save();
  return this;
};

/**
 * Añade un jugador a un duelo grupal en estado "waiting"
 * @returns {Promise<boolean>} true si se unió, false si ya estaba o sala llena
 */
duelSchema.methods.addPlayer = async function (userId) {
  if (this.status !== "waiting") throw new Error("El duelo ya comenzó o terminó");
  if (this.players.length >= this.maxPlayers) throw new Error("Sala llena");
  if (this.players.some(p => p.user.toString() === userId.toString())) return false;

  this.players.push({ user: userId });
  await this.save();
  return true;
};

module.exports = mongoose.model("Duel", duelSchema);