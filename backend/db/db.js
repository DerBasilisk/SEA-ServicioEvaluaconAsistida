import mongoose, { Mongoose } from "mongoose"
import dotenv from "dotenv"

dotenv.config();

const uri =process.env.MONGODB_URI;
mongoose.connect(uri)
.then(()=>console.log("✅┬─┬ノ(ಠ_ಠノ) Conectado a la base de datos"))
.catch(err=>console.log("❌(╯°□°)╯︵ ┻━┻ Error al conectar a la base de datos",err));