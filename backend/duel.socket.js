//duel.socket.js
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { createDuel, getDuel, updateDuel, deleteDuel, createInvite, getInvite, deleteInvite, redis, createDuelInMongo, finishDuelInMongo, abandonDuelInMongo } = require("./services/duel.service");
const { Question, Lesson } = require("./models");
const { getAdaptiveConfig, selectQuestions } = require("./services/adaptive.service");
const { sendDuelResultMessage } = require("./services/chat.service");

const MODIFIERS = {
  extra_questions: { id: "extra_questions", label: "Preguntas extra",  icon: "➕", description: "+3 preguntas al oponente"         },
  reduced_time:    { id: "reduced_time",    label: "Tiempo reducido",   icon: "⏱️", description: "El oponente tiene 10s por pregunta" },
  blackout:        { id: "blackout",        label: "Pantalla oscura",   icon: "🌑", description: "3 segundos de pantalla negra"       },
};

let _io = null; // ← NUEVO: referencia al Server compartido

function setupDuelSocket(httpServer) {
  _io = new Server(httpServer, { // ← NUEVO: guardar en _io
    cors: { origin: process.env.FRONTEND_URL, credentials: true },
    path: "/socket.io",
  });

  const io = _io; // alias local para no tocar nada del código original

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

    socket.on("duel:invite", async ({ friendId, lessonId, conversationId }) => {
      try {
        console.log("[Invite] Recibido:", { friendId, lessonId, conversationId, from: socket.userId });
        
        const inviteId = uuidv4();
        const invite = { inviteId, lessonId, requesterId: socket.userId, recipientId: friendId, conversationId, createdAt: Date.now() };
        
        await createInvite(inviteId, invite);
        console.log("[Invite] Guardado en Redis:", inviteId);

        const recipientSockets = await io.in(`user:${friendId}`).fetchSockets();
        console.log("[Invite] Sockets del destinatario:", recipientSockets.length);

        io.to(`user:${friendId}`).emit("duel:invited", { inviteId, lessonId, requesterId: socket.userId, conversationId });
        console.log("[Invite] duel:invited emitido a:", `user:${friendId}`);
        
        socket.emit("duel:invite_sent", { inviteId });
        console.log("[Invite] duel:invite_sent emitido al retador");
      } catch (err) {
        console.error("[Invite] ERROR:", err);
        socket.emit("duel:error", { message: err.message });
      }
    });

    socket.on("duel:accept", async ({ inviteId }) => {
      console.log("[Duel] duel:accept recibido, inviteId:", inviteId, "userId:", socket.userId);
      try {
        const invite = await getInvite(inviteId);
        console.log("[Duel] invite encontrado en Redis:", invite ? "sí" : "NO — ya expiró o no existe");
        if (!invite) return;
        await deleteInvite(inviteId);

        const duelId = uuidv4();
        const lesson = await Lesson.findById(invite.lessonId).populate({ path: "unit", populate: { path: "subject" } });
        console.log("[Duel] Lección encontrada:", lesson?.name);

        let questions = await Question.find({ lesson: lesson._id, isActive: true });
        console.log("[Duel] Preguntas encontradas (isActive+isReviewed):", questions.length);

        // Prueba sin filtros para confirmar
        const allQuestions = await Question.find({ lesson: lesson._id });
        console.log("[Duel] Preguntas totales en esa lección:", allQuestions.length);
        if (!lesson) return socket.emit("duel:error", { message: "Lección no encontrada" });

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
          conversationId: invite.conversationId,
          players: {
            [invite.requesterId]: { userId: invite.requesterId, score: 0, correct: 0, currentIndex: 0, finished: false, modifiers: [] },
            [socket.userId]:      { userId: socket.userId,      score: 0, correct: 0, currentIndex: 0, finished: false, modifiers: [] },
          },
          startedAt: Date.now(),
          status: "active",
        };
        
        await createDuel(duelId, duelState);

        // Persistir en MongoDB
        const mongoDuel = await createDuelInMongo({
          duelId,                                    // usamos el mismo ID
          lessonId: invite.lessonId,
          creatorId: invite.requesterId,
          players: Object.values(duelState.players).map(p => ({
            userId: p.userId,
            score: p.score,
            correct: p.correct,
            finished: p.finished,
          })),
          type: "direct",
          conversationId: invite.conversationId,
          questionIds: duelState.questionIds,
        });
        // Guardar el mongoId en Redis para futuras actualizaciones
        duelState.mongoId = mongoDuel._id.toString();
        await updateDuel(duelId, duelState);

        const startPayload = {
          duelId,
          questions: sanitized,
          opponentId: null,
        };

        socket.join(`duel:${duelId}`);
        socket.emit("duel:accepted", { duelId });
        console.log("[Duel] Emitiendo duel:start al aceptante:", socket.userId);
        socket.emit("duel:start", { ...startPayload, opponentId: invite.requesterId });

        const requesterSockets = await io.in(`user:${invite.requesterId}`).fetchSockets();
        console.log("[Duel] Sockets del retador encontrados:", requesterSockets.length);
        if (requesterSockets.length > 0) {
          requesterSockets.forEach((s) => s.join(`duel:${duelId}`));
          io.to(`user:${invite.requesterId}`).emit("duel:start", { ...startPayload, opponentId: socket.userId });
          console.log(`[Duel] duel:start enviado directamente al retador ${invite.requesterId}`);
        } else {
          await redis.setex(
            `pending_duel:${invite.requesterId}`,
            120,
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
      console.log("[Duel] questions en Redis:", duel?.questions?.length ?? "undefined");
      console.log("[Duel] players en Redis:", Object.keys(duel?.players || {}).length);
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
      await abandonDuelInMongo(duelId, socket.userId); // ← nueva línea
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

  let mongoDuel;
  try {
    await finishDuelInMongo(duelId, {
      players: players.map(p => ({
        userId: p.userId,
        correct: p.correct,
        score: p.score,
        timeSpent: p.timeSpent,
        finishedAt: p.finishedAt,
        abandoned: p.abandoned,
      })),
    });
  } catch (err) {
    console.error("[Duel] Error al guardar en MongoDB:", err);
  }

  if (duel.conversationId) {
    try {
      const { saveMessage } = require("./services/chat.service");
      const winnerData  = players.find(p => p.userId === winner.userId);
      const loserData   = players.find(p => p.userId !== winner.userId);

      const message = await saveMessage({
        conversationId: duel.conversationId,
        senderId: winner.userId,       // el ganador "firma" el mensaje
        type: "duel_result",           // tipo especial para renderizarlo distinto en el chat
        content: `⚔️ Duelo finalizado — Ganador: ${winnerData.correct}✓ vs ${loserData.correct}✓`,
        duelData: {
          duelId,
          winner:         winner.userId,
          winnerCorrect:  winnerData.correct,
          loserCorrect:   loserData.correct,
          totalQuestions: duel.questions.length,
        },
      });

      io.of("/chat").to(`conv:${duel.conversationId}`).emit("chat:message", {
        conversationId: duel.conversationId,
        message: {
          _id:       message._id,
          type:      message.type,
          content:   message.content,
          sender:    message.sender,
          readBy:    message.readBy,
          createdAt: message.createdAt,
          duelData:  message.duelData,
        },
      });
    } catch (err) {
      console.error("[Duel] Error enviando resultado al chat:", err.message);
    }
  }

  const finishedPayload = {
    winner: winner.userId,
    players: players.map((p) => ({
      userId: p.userId, score: p.score, correct: p.correct,
      total: duel.questions.length, finishedAt: p.finishedAt,
      timeSpent: p.timeSpent || null,
    })),
  };

  io.to(`duel:${duelId}`).emit("duel:finished", finishedPayload);

  for (const p of players) {
    await redis.setex(`duel_result:${p.userId}`, 300, JSON.stringify(finishedPayload));
  }
}

// ← NUEVO: exportar getIO para que chat.socket pueda acceder al Server
function getIO() { return _io; }

module.exports = { setupDuelSocket, getIO }; // ← getIO añadido