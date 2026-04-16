const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, sparse: true },
    discordId: { type: String, sparse: true },
    
    avatar: { type: String, default: null },
    banner: { type: String, default: null },
    
    resetPasswordToken:   { type: String },

    resetPasswordExpires: { type: Date },
    displayName: {
      type: String,
      trim: true,
      maxlength: [30, "Máximo 30 caracteres"],
      default: function() { return this.username; },
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: [3, "Mínimo 3 caracteres"],
      maxlength: [20, "Máximo 20 caracteres"],
      match: [/^[a-zA-Z0-9_]+$/, "Solo letras, números y guión bajo"],
    },
    usernameChangedAt: {
      type: Date,
      default: null,
    },
    email: {
      type: String,
      required: [true, "El email es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email inválido"],
    },
    password: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
      minlength: [6, "Mínimo 6 caracteres"],
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "admin","superadmin"],
      default: "student",
    },
    league: {
      type: String,
      enum: ["bronze","silver","gold","sapphire","emerald","diamond","master","champion","heroic"],
      default: "bronze",
    },

    // ── Gamificación ──────────────────────────────────────────
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    gems: {
      // moneda para comprar vidas extras, etc.
      type: Number,
      default: 0,
      min: 0,
    },
    hearts: {
      // vidas (0-5)
      current: { type: Number, default: 5, min: 0, max: 5 },
      lastRefill: { type: Date, default: Date.now },
    },

    // ── Racha ─────────────────────────────────────────────────
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActivityDate: { type: Date, default: null },
      freezeUsed: { type: Boolean, default: false }, // "streak freeze" como Duolingo
    },

    // ── Logros ────────────────────────────────────────────────
    achievements: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Achievement",
      },
    ],

    // Temas favoritos o en uso
    favoriteSubjects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
  ],

    // ── Preferencias ─────────────────────────────────────────
    dailyGoal: {
      type: Number,
      default: 10, // XP diario objetivo
      enum: [10, 20, 30, 50],
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtuals ───────────────────────────────────────────────────
// XP necesario para el próximo nivel (fórmula progresiva)
userSchema.virtual("xpForNextLevel").get(function () {
  return Math.floor(100 * Math.pow(1.5, this.level - 1));
});

userSchema.virtual("xpProgress").get(function () {
  const xpForCurrent = Math.floor(100 * Math.pow(1.5, this.level - 2)) || 0;
  const xpForNext = this.xpForNextLevel;
  return Math.min(100, ((this.xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100);
});

// ── Hooks ──────────────────────────────────────────────────────
userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  const xpForNext = Math.floor(100 * Math.pow(1.5, this.level - 1));
  while (this.xp >= xpForNext) {
    this.level += 1;
  }
});

// ── Métodos de instancia ───────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.addXP = function (amount) {
  this.xp += amount;
  const xpForNext = Math.floor(100 * Math.pow(1.5, this.level - 1));
  const leveledUp = this.xp >= xpForNext;
  if (leveledUp) this.level += 1;
  return { newXP: this.xp, leveledUp, newLevel: this.level };
};

userSchema.methods.loseHeart = function () {
  if (this.hearts.current > 0) {
    this.hearts.current -= 1;
    if (this.hearts.current < 5) {
      this.hearts.lastRefill = new Date(); // registrar cuándo empezó a recuperar
    }
  }
  return this.hearts.current;
};

// Recarga 1 corazón cada 30 minutos automáticamente
userSchema.methods.checkHeartRefill = function () {
  if (this.hearts.current >= 5) return false;

  const REFILL_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos
  const now = Date.now();
  const lastRefill = new Date(this.hearts.lastRefill).getTime();
  const elapsed = now - lastRefill;
  const heartsToAdd = Math.floor(elapsed / REFILL_INTERVAL_MS);

  if (heartsToAdd > 0) {
    this.hearts.current = Math.min(5, this.hearts.current + heartsToAdd);
    this.hearts.lastRefill = new Date(lastRefill + heartsToAdd * REFILL_INTERVAL_MS);
    return true; // hubo cambio
  }
  return false;
};

userSchema.virtual("currentStreak").get(function () {
  if (!this.streak.lastActivityDate) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDay = new Date(this.streak.lastActivityDate);
  lastDay.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - lastDay) / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return this.streak.current; // hoy o ayer, sigue viva
  return 0; // racha rota
});

userSchema.methods.updateStreak = function () {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastActivity = this.streak.lastActivityDate
    ? new Date(this.streak.lastActivityDate)
    : null;

  if (lastActivity) {
    const lastDay = new Date(
      lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate()
    );
    const diffDays = Math.floor((today - lastDay) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return;
    if (diffDays === 1) {
      this.streak.current += 1;
    } else {
      this.streak.current = 1; // ya existía este caso ✓
    }
  } else {
    this.streak.current = 1;
  }

  if (this.streak.current > this.streak.longest) {
    this.streak.longest = this.streak.current;
  }
  this.streak.lastActivityDate = now;
};

userSchema.methods.refillHearts = function () {
  this.hearts.current = 5;
  this.hearts.lastRefill = new Date();
};

module.exports = mongoose.model("User", userSchema);
