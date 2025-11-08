// models/studentProfile.js
const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema({
  collegeEmail: { type: String, required: true, unique: true },
  name: String,
  headline: String,
  summary: String,
  contactNumber: String,
  stream: String,
  branch: String,
  location: String,
  resume: String,
  resumeVerified: { type: Boolean, default: false },
  resumeVerifiedAt: { type: Date },
  resumeVerifiedBy: { type: String }, // verifier email or id
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
  // Naukri-like additions
  totalExperienceMonths: Number,
  employmentHistory: [
    {
      company: String,
      designation: String,
      from: String, // ISO date or month-year string
      to: String, // ISO date or month-year string or "Present"
      current: Boolean,
      description: String,
    },
  ],
  education: [
    {
      degree: String,
      institution: String,
      year: String,
      score: String,
    },
  ],
  preferredRoles: [String],
  preferredLocations: [String],
  noticePeriodDays: Number,
  currentCTC: Number,
  expectedCTC: Number,
  profileVisibility: { type: String, default: "public" },
});

module.exports = mongoose.model("StudentProfile", studentProfileSchema);
