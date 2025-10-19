const mongoose = require("mongoose");

const RecruiterSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  companyWebsite: { type: String, default: "" },
  jobTitle: { type: String, required: true },
  packageOffered: { type: String, required: true },
  interviewDate: { type: Date, required: true },
  jobLocation: { type: String, required: true },
  jobType: { type: String, enum: ["Full-time", "Internship", "Part-time", "Contract"], required: true },
  jobMode: { type: String, enum: ["Remote", "Hybrid", "On-Site"], required: true },
  experienceLevel: { type: String, enum: ["Entry Level", "Mid Level", "Senior Level"], required: true },
  requiredSkills: { type: [String], required: true },
  jobDescription: { type: String, required: true },
  eligibilityCriteria: { type: String },
  selectionProcess: { type: String },
  jobLocationDetails: { type: String },
  registrationLink: { type: String },
  logo: { type: String, default: "https://via.placeholder.com/150" },
  aboutCompany: { type: String },
  jobResponsibilities: { type: String },
  internshipInfo: { type: String },
  additionalNotes: { type: String },
  status: { type: String, enum: ["Upcoming", "Ongoing", "Completed"], default: "Upcoming" },
  postedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Recruiter", RecruiterSchema);
