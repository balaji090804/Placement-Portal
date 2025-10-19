const express = require("express");
const Performance = require("../models/Performance");
const router = express.Router();

// Fetch student performance by email (auto-create if missing)
router.get("/:email", async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();
    console.log("📡 Searching for:", email);

    let performance = await Performance.findOne({ studentEmail: email });

    if (!performance) {
      console.log("❌ No performance data found for:", email);
      console.log("📌 Returning default performance data...");

      // Sample past interviews
      const pastInterviewsSample = [
        {
          companyName: "Google",
          interviewDate: new Date("2024-01-15"),
          technicalScore: 85,
          hrScore: 80,
          overallPerformance: "Good"
        },
        {
          companyName: "Amazon",
          interviewDate: new Date("2024-02-10"),
          technicalScore: 78,
          hrScore: 85,
          overallPerformance: "Satisfactory"
        }
      ];

      // Sample mock interviews
      const mockInterviewsSample = [
        {
          date: new Date("2024-01-05"),
          technicalScore: 80,
          hrScore: 75,
          feedback: "Needs improvement in system design."
        },
        {
          date: new Date("2024-02-02"),
          technicalScore: 85,
          hrScore: 80,
          feedback: "Good confidence, but work on problem-solving speed."
        }
      ];

      // Default data
      performance = {
        studentEmail: email,
        mockTestScores: { aptitude: 80, coding: 75, communication: 85, technical: 90 },
        codingChallengesSolved: 20,
        interviewScores: 88,
        pastInterviews: pastInterviewsSample,
        mockInterviews: mockInterviewsSample,
        improvementAreas: ["System Design", "Problem Solving Speed"]
      };

      console.log("✅ Default performance record created.");
    }

    res.json(performance);
  } catch (error) {
    console.error("❌ Error fetching performance:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
