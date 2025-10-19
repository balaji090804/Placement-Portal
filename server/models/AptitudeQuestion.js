const mongoose = require("mongoose");

const AptitudeQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  time: { type: Number, required: true } // time in seconds for this question (or total test time)
});

module.exports = mongoose.model("AptitudeQuestion", AptitudeQuestionSchema);
