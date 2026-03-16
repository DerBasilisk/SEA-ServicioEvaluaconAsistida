const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { createDuel, getDuel, updateDuel, deleteDuel, createInvite, getInvite, deleteInvite, redis } = require("./services/duel.service");
const { Question, Lesson } = require("./models");
const { getAdaptiveConfig, selectQuestions } = require("./services/adaptive.service");

const MODIFIERS = {
  extra_questions: { id: "extra_questions", label: "Preguntas extra",  icon: "➕", description: "+3 preguntas al oponente"         },
  reduced_time:    { id: "reduced_time",    label: "Tiempo reducido",   icon: "⏱️", description: "El oponente tiene 10s por pregunta" },
  blackout:        { id: "blackout",        label: "Pantalla oscura",   icon: "🌑", description: "3 segundos de pantalla negra"       },
};

function setupDuelSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true },
    path: "/socket.io",
  });

  // Auth middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Sin token"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded._id;
      next();
    } catch {
      next(new Error("Token inválido"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`[Socket] Usuario conectado: ${socket.userId}`);
    socket.join(`user:${socket.userId}`);

    // Al conectar, verificar si hay un duelo pendiente para este usuario
    try {
      const pendingDuelRaw = await redis.get(`pending_duel:${socket.userId}`);
      if (pendingDuelRaw) {
        await redis.del(`duel_result:${socket.userId}`);
        socket.emit("duel:finished", JSON.parse(pendingResultRaw));
        const pendingDuel = JSON.parse(pendingDuelRaw);
        await redis.del(`pending_duel:${socket.userId}`);
        socket.join(`duel:${pendingDuel.duelId}`);
        socket.emit("duel:start", pendingDuel);
        console.log(`[Duel] Duelo pendiente entregado a ${socket.userId}:`, pendingDuel.duelId);
      }
    } catch (err) {
      console.error("[Duel] Error verificando duelo pendiente:", err.message);
    }

    // ── INVITACIÓN ─────────────────────────────────────────────

    socket.on("duel:invite", async ({ friendId, lessonId }) => {
      try {
        const inviteId = uuidv4();
        const invite = {
          inviteId, lessonId,
          requesterId: socket.userId,
          recipientId: friendId,
          createdAt: Date.now(),
        };
        await createInvite(inviteId, invite);
        io.to(`user:${friendId}`).emit("duel:invited", { inviteId, lessonId, requesterId: socket.userId });
        socket.emit("duel:invite_sent", { inviteId });
      } catch (err) {
        socket.emit("duel:error", { message: err.message });
      }
    });

    socket.on("duel:accept", async ({ inviteId }) => {
      try {
        console.log("[Duel] Accept recibido, inviteId:", inviteId);
        const invite = await getInvite(inviteId);
        console.log("[Duel] Invite encontrado:", invite);
        if (!invite) return;

        await deleteInvite(inviteId);

        const duelId = uuidv4();
        const lesson = await Lesson.findById(invite.lessonId).populate({ path: "unit", populate: { path: "subject" } });
        if (!lesson) return socket.emit("duel:error", { message: "Lección no encontrada" });

        let questions = await Question.find({ lesson: lesson._id, isActive: true, isReviewed: true });
        const adaptiveConfig = await getAdaptiveConfig(invite.requesterId, lesson);
        questions = selectQuestions(questions, adaptiveConfig.questionCount, adaptiveConfig.easyRatio, adaptiveConfig.hardRatio);

        const sanitized = questions.map((q) => {
          const obj = q.toJSON();
          if (obj.type === "multiple_choice") {
            obj.options = obj.options.map((o) => ({ _id: o._id, text: o.text })).sort(() => Math.random() - 0.5);
          }
          if (obj.type === "order_items") { obj.shuffledItems = [...obj.items].sort(() => Math.random() - 0.5); delete obj.items; }
          if (obj.type === "match_pairs") {
            obj.leftItems  = obj.pairs.map((p) => ({ _id: p._id, text: p.left  })).sort(() => Math.random() - 0.5);
            obj.rightItems = obj.pairs.map((p) => ({ _id: p._id, text: p.right })).sort(() => Math.random() - 0.5);
            delete obj.pairs;
          }
          delete obj.correctBoolean; delete obj.correctAnswers; delete obj.isCorrect;
          return obj;
        });

        const duelState = {
          duelId,
          lessonId: invite.lessonId,
          lessonName: lesson.name,
          questions: sanitized,
          questionIds: questions.map((q) => q._id.toString()),
          players: {
            [invite.requesterId]: { userId: invite.requesterId, score: 0, correct: 0, currentIndex: 0, finished: false, modifiers: [] },
            [socket.userId]:      { userId: socket.userId,      score: 0, correct: 0, currentIndex: 0, finished: false, modifiers: [] },
          },
          startedAt: Date.now(),
          status: "active",
        };

        await createDuel(duelId, duelState);

        // Payload para ambos jugadores
        const startPayload = {
          duelId,
          questions: sanitized,
          opponentId: null, // se rellena por jugador
        };

        // Unir al receptor al duelo y notificarle
        socket.join(`duel:${duelId}`);
        socket.emit("duel:start", { ...startPayload, opponentId: invite.requesterId });

        // Para el retador: intentar entrega directa, si no guardar como pendiente
        const requesterSockets = await io.in(`user:${invite.requesterId}`).fetchSockets();
        if (requesterSockets.length > 0) {
          requesterSockets.forEach((s) => s.join(`duel:${duelId}`));
          io.to(`user:${invite.requesterId}`).emit("duel:start", { ...startPayload, opponentId: socket.userId });
          console.log(`[Duel] duel:start enviado directamente al retador ${invite.requesterId}`);
        } else {
          // Guardar como pendiente — se entrega cuando reconecte
          await redis.setex(
            `pending_duel:${invite.requesterId}`,
            120, // 2 minutos para reconectar
            JSON.stringify({ ...startPayload, opponentId: socket.userId })
          );
          console.log(`[Duel] Retador desconectado, duelo guardado como pendiente para ${invite.requesterId}`);
        }

      } catch (err) {
        console.error("[Duel] Error en accept:", err);
        socket.emit("duel:error", { message: err.message });
      }
    });

    socket.on("duel:reject", async ({ inviteId }) => {
      const invite = await getInvite(inviteId).catch(() => null);
      if (invite) {
        await deleteInvite(inviteId);
        io.to(`user:${invite.requesterId}`).emit("duel:rejected", { inviteId });
      }
    });

    // ── DURANTE EL DUELO ───────────────────────────────────────

    socket.on("duel:join", async ({ duelId }) => {
      socket.join(`duel:${duelId}`);
      const duel = await getDuel(duelId);
      if (duel) socket.emit("duel:state", duel);
    });

    socket.on("duel:answer", async ({ duelId, questionId, answer }) => {
      try {
        const duel = await getDuel(duelId);
        if (!duel || duel.status !== "active") return;

        const player = duel.players[socket.userId];
        if (!player || player.finished) return;

        const question = await Question.findById(questionId);
        if (!question) return;

        let isCorrect = false;
        switch (question.type) {
          case "multiple_choice": {
            const correct = question.options.find((o) => o.isCorrect);
            isCorrect = correct?._id.toString() === answer; break;
          }
          case "true_false":
            isCorrect = question.correctBoolean === (answer === true || answer === "true"); break;
          case "fill_blank": {
            const userAns = String(answer).trim().toLowerCase();
            isCorrect = question.correctAnswers.map((a) => a.toLowerCase()).includes(userAns); break;
          }
          case "order_items":
            isCorrect = JSON.stringify(answer) === JSON.stringify(question.items); break;
        }

        if (isCorrect) { player.correct += 1; player.score += question.xpValue || 2; }
        player.currentIndex += 1;
        if (player.currentIndex >= duel.questions.length) { player.finished = true; player.finishedAt = Date.now(); player.timeSpent = Date.now() - Number(duel.startedAt);; }

        duel.players[socket.userId] = player;
        await updateDuel(duelId, duel);

        socket.to(`duel:${duelId}`).emit("duel:opponent_progress", {
          userId: socket.userId,
          currentIndex: player.currentIndex,
          score: player.score,
          correct: player.correct,
          finished: player.finished,
        });

        socket.emit("duel:answer_result", {
          isCorrect,
          explanation: question.explanation,
          correctAnswer: question.type === "true_false" ? question.correctBoolean
            : question.type === "fill_blank" ? question.correctAnswers[0]
            : question.type === "multiple_choice" ? question.options.find((o) => o.isCorrect)?.text
            : null,
        });

        const allFinished = Object.values(duel.players).every((p) => p.finished);
        if (allFinished) await endDuel(duelId, duel, io);

      } catch (err) {
        socket.emit("duel:error", { message: err.message });
      }
    });

    socket.on("duel:use_modifier", async ({ duelId, modifierId, targetId }) => {
      try {
        const duel = await getDuel(duelId);
        if (!duel || duel.status !== "active") return;
        const modifier = MODIFIERS[modifierId];
        if (!modifier) return;

        duel.players[targetId].modifiers = duel.players[targetId].modifiers || [];
        duel.players[targetId].modifiers.push({ ...modifier, appliedAt: Date.now() });
        await updateDuel(duelId, duel);

        io.to(`user:${targetId}`).emit("duel:modifier_received", { modifier });
        socket.emit("duel:modifier_used", { modifier, targetId });
      } catch (err) {
        socket.emit("duel:error", { message: err.message });
      }
    });

    socket.on("duel:abandon", async ({ duelId }) => {
      const duel = await getDuel(duelId).catch(() => null);
      if (!duel) return;
      duel.players[socket.userId].abandoned = true;
      duel.status = "abandoned";
      await updateDuel(duelId, duel);
      socket.to(`duel:${duelId}`).emit("duel:opponent_abandoned");
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Usuario desconectado: ${socket.userId}`);
    });
  });

  return io;
}

async function endDuel(duelId, duel, io) {
  console.log("[Duel] endDuel players:", JSON.stringify(Object.values(duel.players).map(p => ({
    userId: p.userId, correct: p.correct, timeSpent: p.timeSpent, finishedAt: p.finishedAt
  }))));
  const players = Object.values(duel.players);
  players.sort((a, b) => {
    if (b.correct !== a.correct) return b.correct - a.correct;
    return (a.finishedAt || Infinity) - (b.finishedAt || Infinity);
  });
  const winner = players[0];
  duel.status = "finished";
  duel.winner = winner.userId;
  await updateDuel(duelId, duel);
  const finishedPayload = {
    winner: winner.userId,
    players: players.map((p) => ({
      userId: p.userId, score: p.score, correct: p.correct,
      total: duel.questions.length, finishedAt: p.finishedAt,
      timeSpent: p.timeSpent || null,
    })),
  };

  io.to(`duel:${duelId}`).emit("duel:finished", finishedPayload);

  // Guardar resultado para jugadores que se reconecten
  for (const p of players) {
    await redis.setex(`duel_result:${p.userId}`, 300, JSON.stringify(finishedPayload));
  };
}

module.exports = { setupDuelSocket };