const mongoose = require("mongoose");

const InterviewRequestSchema = new mongoose.Schema({
  studentName: String,
  studentEmail: String,
  meetingLink: String,
  date: String,
  time: String,
  status: { type: String, default: "Pending" },
});

module.exports = mongoose.model("InterviewRequest", InterviewRequestSchema);
