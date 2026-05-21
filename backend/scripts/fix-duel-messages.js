// backend/scripts/fix-duel-messages.js
const mongoose = require("mongoose");
require("dotenv").config();

const Message = require("../models/message");
const Duel    = require("../models/duel");
const User    = require("../models/user"); // ← necesario para populate

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Conectado a MongoDB");

  const broken = await Message.find({
    type: "duel_result",
    "duelData.resultSummary": { $exists: false },
  });

  console.log(`Mensajes a reparar: ${broken.length}`);

  for (const msg of broken) {
    // Buscar el duelo por conversación y fecha aproximada (±5 min)
    const duel = await Duel.findOne({
      conversation: msg.conversation,
      status: "finished",
      endedAt: {
        $gte: new Date(msg.createdAt.getTime() - 5 * 60 * 1000),
        $lte: new Date(msg.createdAt.getTime() + 5 * 60 * 1000),
      },
    }).populate("players.user");

    if (!duel) {
      console.log(`  [skip] ${msg._id} — duelo no encontrado por conversación+fecha`);
      continue;
    }

    const sorted = [...duel.players].sort((a, b) =>
      b.correct !== a.correct
        ? b.correct - a.correct
        : (a.timeSpent || Infinity) - (b.timeSpent || Infinity)
    );

    const winner = sorted[0];
    const loser  = sorted[1];

    const durationSec =
      duel.endedAt && duel.startedAt
        ? Math.floor((new Date(duel.endedAt) - new Date(duel.startedAt)) / 1000)
        : null;

    msg.duelData = {
      duelId: duel.duelId || duel._id.toString(),
      resultSummary: {
        winnerName:     winner?.user?.username || "Jugador",
        loserName:      loser?.user?.username  || "Rival",
        winnerCorrect:  winner?.correct ?? 0,
        loserCorrect:   loser?.correct  ?? 0,
        totalQuestions: duel.questions?.length ?? 0,
        duration:       durationSec,
      },
    };

    msg.markModified("duelData");
    await msg.save();
    console.log(`  ✅ Reparado: ${msg._id} — ${winner?.user?.username} vs ${loser?.user?.username}`);
  }

  console.log("Migración completa");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});