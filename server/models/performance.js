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
  offersAccepted: { type: Number, default: 0 },
  interviewScores: { type: Number, default: 0 },
  pastInterviews: [
    {
      companyName: String,
      interviewDate: Date,
      technicalScore: Number,
      hrScore: Number,
      overallPerformance: String,
    },
  ],
  mockInterviews: [
    {
      date: Date,
      technicalScore: Number,
      hrScore: Number,
      feedback: String,
    },
  ],
  improvementAreas: [String],
  // Append-only log of actions to compute trends/graphs
  events: [
    {
      type: { type: String, required: true }, // e.g., 'jobApplied', 'dailyCodeSubmitted', 'practiceStarted'
      date: { type: Date, default: Date.now },
      meta: { type: Object, default: {} },
    },
  ],
  lastUpdated: { type: Date, default: Date.now },
});

// Avoid OverwriteModelError in watch/hot-reload scenarios
module.exports =
  mongoose.models.Performance ||
  mongoose.model("Performance", PerformanceSchema);
