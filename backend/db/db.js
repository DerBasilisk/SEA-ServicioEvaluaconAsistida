const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅┬─┬ノ(ಠ_ಠノ) Conectado a la base de datos");
  } catch (err) {
    console.error("❌(╯°□°)╯︵ ┻━┻ Error al conectar a la base de datos", err);
    process.exit(1);
  }
};

module.exports = { connectDB };