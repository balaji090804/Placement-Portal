const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    domain: {
      type: String,
      required: true,
      enum: [
        "aptitude",
        "coding",
        "communication",
        "technical",
        "dsa",
        "dbms",
        "os",
        "networking",
      ],
    },
    question: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (arr) {
          return arr.length === 4;
        },
        message: "Must provide exactly 4 options",
      },
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    time: {
      type: Number,
      required: true,
      default: 60, // time in seconds
    },
    createdBy: {
      type: String, // faculty email
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
QuestionSchema.index({ domain: 1, isActive: 1 });
QuestionSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Question", QuestionSchema);
