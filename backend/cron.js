const cron = require("node-cron");
const { processWeeklyLeagues } = require("./services/league.service");

/**
 * Ejecutar cada lunes a las 00:00
 * Cron: "0 0 * * 1"
 */
function setupCronJobs() {
  cron.schedule("0 0 * * 1", async () => {
    console.log("[Cron] Procesando ligas semanales...");
    try {
      const count = await processWeeklyLeagues();
      console.log(`[Cron] Ligas procesadas: ${count} salas`);
    } catch (err) {
      console.error("[Cron] Error procesando ligas:", err.message);
    }
  }, {
    timezone: "America/Bogota",
  });

  console.log("[Cron] Jobs registrados");
}

module.exports = { setupCronJobs };