// backend/test-ai.js
require('dotenv').config();
const { generateQuestions } = require('../services/ai.service');

async function test() {
  try {
    const questions = await generateQuestions({
      subjectName: "Matemáticas",
      unitName: "Números Naturales",
      lessonName: "Suma",
      topicHint: "Suma de dos números de dos cifras",
      difficulty: "easy",
      count: 3,
      allowedTypes: ["multiple_choice", "true_false", "fill_blank", "match_pairs"]
    });

    console.log("\n=== PREGUNTAS GENERADAS ===");
    console.dir(questions, { depth: null });

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

test();