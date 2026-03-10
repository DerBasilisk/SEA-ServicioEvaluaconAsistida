const mongoose = require("mongoose");

const streakSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    current: {
      type: Number,
      default: 0,
      min: 0,
    },
    longest: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Historial de los últimos 30 días (para el calendario visual)
    history: [
      {
        date: { type: Date, required: true },
        xpEarned: { type: Number, default: 0 },
        goalMet: { type: Boolean, default: false }, // alcanzó su dailyGoal
        _id: false,
      },
    ],

    // Último día en que completó actividad
    lastActivityDate: {
      type: Date,
      default: null,
    },

    // "Streak freeze" — permite saltear un día sin perder la racha
    freezes: {
      available: { type: Number, default: 0, min: 0 },
      usedDates: [{ type: Date }], // historial de freezes usados
    },
  },
  {
    timestamps: true,
  }
);

// ── Métodos de instancia ───────────────────────────────────────

/**
 * Registra actividad del día y actualiza la racha.
 * Llamar una vez por día cuando el usuario completa su objetivo diario.
 */
streakSchema.methods.recordActivity = function (xpEarned, dailyGoal) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivity = this.lastActivityDate
    ? new Date(this.lastActivityDate).setHours(0, 0, 0, 0)
    : null;

  const isToday = lastActivity && lastActivity === today.getTime();
  if (isToday) return; // ya se registró hoy

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday = lastActivity && lastActivity === yesterday.getTime();

  if (wasYesterday || this.current === 0) {
    // continúa o inicia la racha
    this.current += 1;
  } else if (lastActivity && lastActivity < yesterday.getTime()) {
    // rompió la racha — intentar usar freeze
    if (this.freezes.available > 0) {
      this.freezes.available -= 1;
      this.freezes.usedDates.push(yesterday);
      this.current += 1; // la racha se mantiene
    } else {
      this.current = 1; // reinicia
    }
  }

  if (this.current > this.longest) this.longest = this.current;
  this.lastActivityDate = today;

  // Guardar en historial (máximo 30 días)
  const goalMet = xpEarned >= dailyGoal;
  this.history.push({ date: today, xpEarned, goalMet });
  if (this.history.length > 30) this.history.shift();
};

/**
 * Verifica si la racha está en riesgo (no hubo actividad hoy)
 */
streakSchema.methods.isAtRisk = function () {
  if (!this.lastActivityDate || this.current === 0) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(this.lastActivityDate);
  last.setHours(0, 0, 0, 0);
  return last.getTime() < today.getTime();
};

module.exports = mongoose.model("Streak", streakSchema);
