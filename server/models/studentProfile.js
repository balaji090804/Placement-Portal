// models/studentProfile.js
const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema({
  collegeEmail: { type: String, required: true, unique: true },
  name: String,
  contactNumber: String,
  stream: String,
  branch: String,
  resume: String,
  tenthPercentage: Number,
  twelfthPercentage: Number,
  cgpa: Number,
  certifications: [
    {
      name: String,
      url: String,
    },
  ],
  github: String,
  projects: [
    {
      name: String,
      techStack: String,
      description: String,
    },
  ],
  linkedin: String,
  codingProfiles: [
    {
      platform: String,
      url: String,
    },
  ],
  skills: String,
  profilePicture: String,
});

module.exports = mongoose.model("StudentProfile", studentProfileSchema);
