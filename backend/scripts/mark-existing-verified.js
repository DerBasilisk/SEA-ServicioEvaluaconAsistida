const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // usa ruta absoluta

const User = require('../models/user');

async function migrate() {
  try {
    // Obtener URI de conexión (acepta varios nombres de variable)
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
    if (!mongoURI) {
      throw new Error('No se encontró variable de conexión a MongoDB (MONGODB_URI, MONGO_URI o DATABASE_URL)');
    }

    await mongoose.connect(mongoURI);
    console.log('✅ Conectado a MongoDB');

    const result = await User.updateMany(
      { emailVerified: { $ne: true } },
      { $set: { emailVerified: true, verificationToken: null, verificationExpires: null } }
    );

    console.log(`✅ Usuarios actualizados: ${result.modifiedCount}`);
    console.log(`📊 Total de usuarios en la colección: ${await User.countDocuments()}`);
    
    await mongoose.disconnect();
    console.log('👋 Desconectado');
  } catch (err) {
    console.error('❌ Error en migración:', err);
    process.exit(1);
  }
}

migrate();