// backend/scripts/migrate-duel-fields.js
const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" }); // Ajusta la ruta según tu estructura

// Modelos existentes (defínelos o impórtalos según tu proyecto)
// NOTA: Si ya tienes los modelos definidos en /models, puedes importarlos.
// Aquí los definimos ligeramente para no repetir código.
// Pero lo recomendable es usar los mismos archivos que ya tienes.
// Para este script, usaremos definiciones mínimas que coincidan con los esquemas originales.

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/sea";
mongoose.connect(MONGODB_URI);

// Definimos los esquemas con los nuevos campos (para que `updateMany` funcione sin errores)
// Como los modelos ya existen, solo necesitamos referenciarlos.
// Si no existen los archivos, puedes usar esta definición temporal para la migración.
// Pero lo más seguro es importar los modelos reales.

// Opción recomendada: importar los modelos originales (asumiendo que ya están parcheados con los cambios)
// Para que la migración funcione, primero debes haber añadido los campos a los archivos models/*.js
// Si aún no los añadiste, puedes hacerlo ahora o usar este script con definiciones temporales.

// Aquí usaremos referencias dinámicas a los modelos que ya existen en tu aplicación.
// De lo contrario, definimos los esquemas mínimos para que la migración pueda ejecutarse.

let Conversation, Message, User;

try {
  // Intenta cargar los modelos reales
  Conversation = require("../models/conversation");
  Message = require("../models/message");
  User = require("../models/user");
  console.log("✅ Modelos existentes cargados.");
} catch (err) {
  console.warn("⚠️ No se pudieron cargar los modelos, se crearán definiciones temporales.");
  // Definiciones temporales para la migración (solo los campos necesarios)
  const convSchema = new mongoose.Schema({}, { strict: false });
  const msgSchema = new mongoose.Schema({}, { strict: false });
  const userSchema = new mongoose.Schema({}, { strict: false });
  Conversation = mongoose.model("Conversation", convSchema, "conversations");
  Message = mongoose.model("Message", msgSchema, "messages");
  User = mongoose.model("User", userSchema, "users");
}

async function migrate() {
  try {
    console.log("🚀 Iniciando migración de campos para duelos...");

    // 1. Agregar campo `lastDuel` a conversations (valor por defecto null)
    const convResult = await Conversation.updateMany(
      { lastDuel: { $exists: false } },
      { $set: { lastDuel: null } }
    );
    console.log(`📄 Conversaciones actualizadas: ${convResult.modifiedCount}`);

    // Asegurar índice (opcional, pero útil)
    await Conversation.collection.createIndex({ lastDuel: 1 });

    // 2. Agregar campo `duelData` a messages (valor por defecto null)
    //    También extender el enum de `type` no es necesario en documentos existentes,
    //    solo para futuros documentos. Pero podemos dejar duelData como null.
    const msgResult = await Message.updateMany(
      { duelData: { $exists: false } },
      { $set: { duelData: null } }
    );
    console.log(`📄 Mensajes actualizados: ${msgResult.modifiedCount}`);

    // 3. Agregar `duelsStats` a users (por defecto { total:0, wins:0, losses:0 })
    const userResult = await User.updateMany(
      { "duelsStats.total": { $exists: false } },
      { $set: { duelsStats: { total: 0, wins: 0, losses: 0 } } }
    );
    console.log(`👤 Usuarios actualizados: ${userResult.modifiedCount}`);

    // Índice opcional para consultas rápidas por duelsStats (si se necesita)
    await User.collection.createIndex({ "duelsStats.total": -1 });

    console.log("✅ Migración completada exitosamente.");
  } catch (error) {
    console.error("❌ Error en la migración:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Conexión a MongoDB cerrada.");
  }
}

migrate();