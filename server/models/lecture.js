const mongoose = require("mongoose");

// A scheduled lecture or class session (distinct from placement announcements)
const LectureSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g. "Data Structures - Week 5"
    dateTime: { type: Date, required: true },
    facultyEmail: { type: String, required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" }, // optional link to a class
    durationMinutes: { type: Number },
    room: { type: String },
    description: { type: String },
    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Lecture || mongoose.model("Lecture", LectureSchema);
