const mongoose = require("mongoose");

const ClassSchema = new mongoose.Schema(
  {
    courseName: { type: String, required: true },
    department: { type: String, required: true },
    schedule: { type: String },
    instructor: { type: String },
    room: { type: String },
    studentEmails: { type: [String], default: [] },
    createdBy: { type: String }, // faculty/admin email
    updatedBy: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Class || mongoose.model("Class", ClassSchema);


