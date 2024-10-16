// models/Alert.js
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  geofence: { type: String, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  message: { type: String, required: true },
  attachToVessel: { type: Boolean, default: false },
  vesselSelected: [{ type: String }],
  whatsapp: { type: Boolean, default: false },
  email: { type: Boolean, default: false },
  
}, { timestamps: true });

const Alert = mongoose.model('Alert', alertSchema);
module.exports = Alert;
