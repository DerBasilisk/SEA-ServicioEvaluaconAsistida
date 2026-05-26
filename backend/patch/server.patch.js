// ─── AGREGAR en server.js ──────────────────────────────────────────────────────
//
// Junto a las demás importaciones de rutas:
const shopRoutes = require("./routes/shop");

// Junto al resto de app.use de rutas:
app.use("/api/shop", shopRoutes);
//
// ──────────────────────────────────────────────────────────────────────────────
