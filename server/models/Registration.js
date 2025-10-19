const mongoose = require("mongoose");

const RegistrationSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  studentName: { type: String, required: true },
  registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Registration", RegistrationSchema);
