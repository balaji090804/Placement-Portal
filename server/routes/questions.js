const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const { User } = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");

// Faculty: Add a new question
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const {
      domain,
      question,
      options,
      correctAnswer,
      explanation,
      difficulty,
      time,
    } = req.body;

    // Validate required fields
    if (!domain || !question || !options || !correctAnswer || !time) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate options array
    if (!Array.isArray(options) || options.length !== 4) {
      return res
        .status(400)
        .json({ message: "Must provide exactly 4 options" });
    }

    // Validate correct answer is one of the options
    if (!options.includes(correctAnswer)) {
      return res
        .status(400)
        .json({ message: "Correct answer must be one of the options" });
    }

    // Fetch user email from database using the user ID from JWT
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newQuestion = new Question({
      domain,
      question,
      options,
      correctAnswer,
      explanation: explanation || "",
      difficulty: difficulty || "medium",
      time,
      createdBy: user.email,
    });

    await newQuestion.save();
    res.status(201).json({
      message: "Question added successfully",
      question: newQuestion,
    });
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get questions by domain (for students to take test)
router.get("/domain/:domain", async (req, res) => {
  try {
    const { domain } = req.params;
    const { limit } = req.query;

    const query = { domain, isActive: true };
    let questions = await Question.find(query)
      .select("-correctAnswer -explanation -createdBy") // Don't send answers to frontend initially
      .sort({ createdAt: -1 });

    // If limit is specified, randomly select questions
    if (limit) {
      const limitNum = parseInt(limit);
      questions = questions.sort(() => 0.5 - Math.random()).slice(0, limitNum);
    }

    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all questions by domain (for faculty to manage)
router.get("/manage/:domain", authMiddleware, async (req, res) => {
  try {
    const { domain } = req.params;

    // Only faculty/admin can view all questions with answers
    if (req.user.role !== "faculty" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const questions = await Question.find({ domain }).sort({ createdAt: -1 });

    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all questions created by current faculty
router.get("/my-questions", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "faculty" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Fetch user email from database using the user ID from JWT
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const questions = await Question.find({ createdBy: user.email }).sort({
      createdAt: -1,
    });

    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get question statistics by domain
router.get("/stats/:domain", async (req, res) => {
  try {
    const { domain } = req.params;

    const stats = await Question.aggregate([
      { $match: { domain, isActive: true } },
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Question.countDocuments({ domain, isActive: true });

    res.json({ total, byDifficulty: stats });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a question (faculty only)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "faculty" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;
    const updates = req.body;

    // Don't allow changing createdBy
    delete updates.createdBy;

    const question = await Question.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json({ message: "Question updated successfully", question });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a question (faculty only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "faculty" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;
    const question = await Question.findByIdAndDelete(id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle question active status
router.patch("/:id/toggle", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "faculty" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;
    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    question.isActive = !question.isActive;
    await question.save();

    res.json({
      message: `Question ${
        question.isActive ? "activated" : "deactivated"
      } successfully`,
      question,
    });
  } catch (error) {
    console.error("Error toggling question:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Verify answers (for test submission)
router.post("/verify", async (req, res) => {
  try {
    const { answers } = req.body; // Array of { questionId, selectedAnswer }

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: "Invalid answers format" });
    }

    const questionIds = answers.map((a) => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });

    const results = answers.map((answer) => {
      const question = questions.find(
        (q) => q._id.toString() === answer.questionId
      );
      if (!question) {
        return {
          questionId: answer.questionId,
          correct: false,
          correctAnswer: null,
        };
      }

      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      return {
        questionId: answer.questionId,
        correct: isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      };
    });

    const score = results.filter((r) => r.correct).length;
    const totalQuestions = answers.length;
    const percentage = (score / totalQuestions) * 100;

    res.json({
      score,
      totalQuestions,
      percentage,
      results,
    });
  } catch (error) {
    console.error("Error verifying answers:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
