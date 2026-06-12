// backend/scripts/clearQuestions.js
require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../models/question');

const clearQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    const result = await Question.deleteMany({});
    console.log(`✅ Eliminadas ${result.deletedCount} preguntas.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al limpiar preguntas:', error);
    process.exit(1);
  }
};

clearQuestions();