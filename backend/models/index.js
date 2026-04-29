const User = require("./user");
const Subject = require("./subject");
const Unit = require("./unit");
const Lesson = require("./lesson");
const Question = require("./question");
const UserProgress = require("./userProgress");
const Streak = require("./streak");
const Achievement = require("./achievement");
const Leaderboard = require("./leaderboard");
const Conversation = require("./conversation"); // ← NUEVO
const Message = require("./message");           // ← NUEVO

module.exports = {
  User,
  Subject,
  Unit,
  Lesson,
  Question,
  UserProgress,
  Streak,
  Achievement,
  Leaderboard,
  Conversation, // ← NUEVO
  Message,      // ← NUEVO
};