const mongoose = require("mongoose");

const PerformanceSchema = new mongoose.Schema({
  studentEmail: { type: String, required: true, unique: true },
  mockTestScores: {
    aptitude: { type: Number, default: 0 },
    coding: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    technical: { type: Number, default: 0 },
  },
  codingChallengesSolved: { type: Number, default: 0 },
  interviewScores: { type: Number, default: 0 }, 
  pastInterviews: [
    {
      companyName: String,
      interviewDate: Date,
      technicalScore: Number,
      hrScore: Number,
      overallPerformance: String
    }
  ],
  mockInterviews: [
    {
      date: Date,
      technicalScore: Number,
      hrScore: Number,
      feedback: String
    }
  ],
  improvementAreas: [String],
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Performance", PerformanceSchema);
