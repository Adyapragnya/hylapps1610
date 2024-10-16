const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LoginUserSchema = new Schema({
  role: { type: String, required: true }, // 'hyla admin', 'organization admin', 'organization user', 'guest'
  email: { type: String, required: true, unique: true }, // Email for login
  password: { type: String, required: true }, // Hashed password
}, { timestamps: true });

module.exports = mongoose.model('LoginUsers', LoginUserSchema);
