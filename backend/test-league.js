require('dotenv').config();
const mongoose = require('mongoose');
const { processWeeklyLeagues } = require('./services/league.service'); // Ajusta el nombre
const LeagueRoom = require("./models/leagueRoom");
const User = require("./models/user");

async function test() {
  try {
    const url = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tu_db';
    await mongoose.connect(url);
    console.log("✅ Conectado a MongoDB");

    // IDs que me pasaste
    const id1 = "69bd9e946ee5300a9cbb61cf"; // keinermauric_0296
    const id2 = "69bdc193f87302c311818acb"; // derrbasilisk

    // Limpieza previa de salas de test anteriores para evitar conflictos
    await LeagueRoom.deleteMany({ roomNumber: 999 });

    // Fecha de la semana pasada
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    console.log("🛠️ Creando sala de prueba...");
    
    await LeagueRoom.create({
      league: 'bronze',
      weekStart: lastWeek,
      processed: false,
      roomNumber: 999,
      members: [
        { user: id1, xpEarned: 1000 }, // Debería subir (promoted)
        { user: id2, xpEarned: 50 }    // Se queda o baja (según tus constantes)
      ]
    });

    console.log("🚀 Ejecutando processWeeklyLeagues()...");
    
    const procesadas = await processWeeklyLeagues();
    
    console.log(`\n✨ Resultado: ${procesadas} salas procesadas.`);
    
    // Verificación rápida en consola
    const user1 = await User.findById(id1);
    console.log(`📊 Usuario 1 (${user1.username}): Liga actual -> ${user1.league}`);

  } catch (error) {
    console.error("❌ Error en el test:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Conexión cerrada.");
  }
}

test();