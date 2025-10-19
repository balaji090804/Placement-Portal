const mongoose = require("mongoose");

const AttendanceRecordSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  jobRole: { type: String, required: true },
  students: [
    {
      studentName: String,
      rollNo: String,
    }
  ],
  uploadedBy: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AttendanceRecord", AttendanceRecordSchema);
