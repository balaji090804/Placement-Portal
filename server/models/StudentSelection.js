const mongoose = require("mongoose");

const StudentSelectionSchema = new mongoose.Schema({
  studentEmail: { type: String, required: true },
  studentName: { type: String },
  companyName: { type: String, required: true },
  jobRole: { type: String, required: true },
  roundNumber: { type: Number, required: true },
  nextRoundVenue: { type: String, required: true },
  nextRoundTime: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("StudentSelection", StudentSelectionSchema);
