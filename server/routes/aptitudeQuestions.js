const express = require("express");
const router = express.Router();
const AptitudeQuestion = require("../models/AptitudeQuestion");

// GET all aptitude questions
router.get("/", async (req, res) => {
  try {
    const questions = await AptitudeQuestion.find();
    res.json(questions);
  } catch (error) {
    console.error("Error fetching aptitude questions:", error);
    res.status(500).json({ message: "Error fetching aptitude questions" });
  }
});

// POST a new aptitude question
router.post("/", async (req, res) => {
  try {
    const { question, options, correctAnswer, time } = req.body;
    if (!question || !options || !correctAnswer || !time) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const newQuestion = new AptitudeQuestion({ question, options, correctAnswer, time });
    await newQuestion.save();
    res.json({ message: "Aptitude question added successfully", question: newQuestion });
  } catch (error) {
    console.error("Error adding aptitude question:", error);
    res.status(500).json({ message: "Error adding aptitude question", error: error.message });
  }
});

module.exports = router;
