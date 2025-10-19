const mongoose = require("mongoose");

const FacultyAnnouncementSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  jobRole: { type: String, required: true },
  dateTime: { type: Date, required: true },
  assignedFacultyEmail: { type: String, required: true },
  isCompleted: { type: Boolean, default: false }
});

module.exports = mongoose.model("FacultyAnnouncement", FacultyAnnouncementSchema);
