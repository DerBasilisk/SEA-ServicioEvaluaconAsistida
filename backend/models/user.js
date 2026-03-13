const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, sparse: true },
    
    avatar:   { type: String },

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
    avatar: {
      type: String,
      default: "default_avatar",
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

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
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
  if (this.hearts.current > 0) this.hearts.current -= 1;
  return this.hearts.current;
};

userSchema.methods.refillHearts = function () {
  this.hearts.current = 5;
  this.hearts.lastRefill = new Date();
};

module.exports = mongoose.model("User", userSchema);
