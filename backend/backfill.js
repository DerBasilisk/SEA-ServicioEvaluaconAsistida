require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("./models/question"); // ajusta el path

async function backfill() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Conectado a MongoDB");

  const result = await Question.updateMany(
    { type: "free_text", evaluationCriteria: { $exists: false } },
    { $set: { 
        evaluationCriteria: "Evalúa si la respuesta demuestra comprensión del tema.",
        maxScore: 10,
        isCodeExercise: false
    }}
  );

  console.log(`✅ ${result.modifiedCount} preguntas actualizadas`);
  await mongoose.disconnect();
}

backfill().catch(console.error);