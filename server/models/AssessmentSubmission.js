const mongoose = require("mongoose");

const AssessmentSubmissionSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  percentage: { type: Number, required: true },
  timeTaken: { type: Number }, // in seconds
  submittedAt: { type: Date, default: Date.now },
  assessmentType: { type: String, default: "Aptitude Test" }, // Future: can track different assessment types
});

// Index for faster queries
AssessmentSubmissionSchema.index({ studentEmail: 1, submittedAt: -1 });
AssessmentSubmissionSchema.index({ score: -1 });

module.exports = mongoose.model(
  "AssessmentSubmission",
  AssessmentSubmissionSchema
);
