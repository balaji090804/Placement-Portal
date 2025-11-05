const express = require("express");
const router = express.Router();
const Leaderboard = require("../models/leaderboard");
const AssessmentSubmission = require("../models/AssessmentSubmission");
const auth = require("../middleware/authMiddleware");

// Legacy endpoint - Get top 5 performers (kept for backward compatibility)
router.get("/", async (req, res) => {
  try {
    const topPerformers = await Leaderboard.find().sort({ score: -1 }).limit(5);
    res.json(topPerformers);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST - Submit assessment score
router.post("/submit", auth, async (req, res) => {
  try {
    const { studentName, studentEmail, score, totalQuestions, timeTaken } =
      req.body;

    if (
      !studentName ||
      !studentEmail ||
      score === undefined ||
      !totalQuestions
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const percentage = ((score / totalQuestions) * 100).toFixed(2);

    const submission = new AssessmentSubmission({
      studentName,
      studentEmail,
      score,
      totalQuestions,
      percentage: parseFloat(percentage),
      timeTaken,
      assessmentType: "Aptitude Test",
    });

    await submission.save();

    // Also update or create in legacy Leaderboard model for backward compatibility
    const existingRecord = await Leaderboard.findOne({ email: studentEmail });
    if (existingRecord) {
      // Update if new score is better
      if (score > existingRecord.score) {
        existingRecord.score = score;
        existingRecord.updatedAt = Date.now();
        await existingRecord.save();
      }
    } else {
      await Leaderboard.create({
        name: studentName,
        email: studentEmail,
        score,
      });
    }

    res.json({
      message: "Score submitted successfully!",
      submission,
      rank: await getStudentRank(studentEmail),
    });
  } catch (error) {
    console.error("Error submitting assessment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET - Overall leaderboard (top performers across all assessments)
router.get("/overall", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    // Aggregate to get best score per student
    const leaderboard = await AssessmentSubmission.aggregate([
      {
        $sort: { score: -1, submittedAt: -1 },
      },
      {
        $group: {
          _id: "$studentEmail",
          studentName: { $first: "$studentName" },
          bestScore: { $max: "$score" },
          bestPercentage: { $max: "$percentage" },
          totalQuestions: { $first: "$totalQuestions" },
          attempts: { $sum: 1 },
          lastAttempt: { $max: "$submittedAt" },
        },
      },
      {
        $sort: { bestScore: -1, lastAttempt: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    // Add rank
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      studentName: entry.studentName,
      studentEmail: entry._id,
      bestScore: entry.bestScore,
      bestPercentage: entry.bestPercentage,
      totalQuestions: entry.totalQuestions,
      attempts: entry.attempts,
      lastAttempt: entry.lastAttempt,
    }));

    res.json(rankedLeaderboard);
  } catch (error) {
    console.error("Error fetching overall leaderboard:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET - Student's personal stats and rank
router.get("/mystats", auth, async (req, res) => {
  try {
    const studentEmail = req.user.email;

    const submissions = await AssessmentSubmission.find({ studentEmail })
      .sort({ submittedAt: -1 })
      .limit(10);

    if (submissions.length === 0) {
      return res.json({
        totalAttempts: 0,
        bestScore: 0,
        averageScore: 0,
        rank: null,
        recentSubmissions: [],
      });
    }

    const bestScore = Math.max(...submissions.map((s) => s.score));
    const averageScore = (
      submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length
    ).toFixed(2);
    const rank = await getStudentRank(studentEmail);

    res.json({
      totalAttempts: submissions.length,
      bestScore,
      averageScore: parseFloat(averageScore),
      rank,
      recentSubmissions: submissions.map((s) => ({
        score: s.score,
        percentage: s.percentage,
        totalQuestions: s.totalQuestions,
        timeTaken: s.timeTaken,
        submittedAt: s.submittedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching student stats:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET - Faculty analytics
router.get("/analytics", auth, async (req, res) => {
  try {
    if (req.user.role !== "faculty" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Faculty/Admin only" });
    }

    const totalSubmissions = await AssessmentSubmission.countDocuments();
    const uniqueStudents = await AssessmentSubmission.distinct("studentEmail");

    // Average scores
    const avgResult = await AssessmentSubmission.aggregate([
      {
        $group: {
          _id: null,
          averageScore: { $avg: "$score" },
          averagePercentage: { $avg: "$percentage" },
        },
      },
    ]);

    // Score distribution
    const scoreDistribution = await AssessmentSubmission.aggregate([
      {
        $bucket: {
          groupBy: "$percentage",
          boundaries: [0, 20, 40, 60, 80, 100],
          default: "100+",
          output: {
            count: { $sum: 1 },
            students: { $addToSet: "$studentEmail" },
          },
        },
      },
    ]);

    // Top performers
    const topPerformers = await AssessmentSubmission.aggregate([
      {
        $sort: { score: -1 },
      },
      {
        $group: {
          _id: "$studentEmail",
          studentName: { $first: "$studentName" },
          bestScore: { $max: "$score" },
          bestPercentage: { $max: "$percentage" },
        },
      },
      {
        $sort: { bestScore: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Recent activity
    const recentActivity = await AssessmentSubmission.find()
      .sort({ submittedAt: -1 })
      .limit(20)
      .select("studentName studentEmail score percentage submittedAt");

    res.json({
      totalSubmissions,
      uniqueStudents: uniqueStudents.length,
      averageScore:
        avgResult.length > 0 ? avgResult[0].averageScore.toFixed(2) : 0,
      averagePercentage:
        avgResult.length > 0 ? avgResult[0].averagePercentage.toFixed(2) : 0,
      scoreDistribution,
      topPerformers: topPerformers.map((p, idx) => ({
        rank: idx + 1,
        studentName: p.studentName,
        studentEmail: p._id,
        bestScore: p.bestScore,
        bestPercentage: p.bestPercentage,
      })),
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper function to get student rank
async function getStudentRank(studentEmail) {
  try {
    const leaderboard = await AssessmentSubmission.aggregate([
      {
        $sort: { score: -1 },
      },
      {
        $group: {
          _id: "$studentEmail",
          bestScore: { $max: "$score" },
        },
      },
      {
        $sort: { bestScore: -1 },
      },
    ]);

    const rank = leaderboard.findIndex((entry) => entry._id === studentEmail);
    return rank >= 0 ? rank + 1 : null;
  } catch (error) {
    console.error("Error calculating rank:", error);
    return null;
  }
}

module.exports = router;
