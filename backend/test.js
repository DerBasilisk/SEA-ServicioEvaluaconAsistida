const mongoose = require('mongoose');
require('dotenv').config();

console.log('URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado'))
  .catch(err => console.log('❌ Error:', err));