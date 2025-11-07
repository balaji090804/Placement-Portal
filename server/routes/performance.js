const express = require("express");
const Performance = require("../models/performance");
const { recordPerformanceEvent } = require("../utils/performanceEvent");
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
          overallPerformance: "Good",
        },
        {
          companyName: "Amazon",
          interviewDate: new Date("2024-02-10"),
          technicalScore: 78,
          hrScore: 85,
          overallPerformance: "Satisfactory",
        },
      ];

      // Sample mock interviews
      const mockInterviewsSample = [
        {
          date: new Date("2024-01-05"),
          technicalScore: 80,
          hrScore: 75,
          feedback: "Needs improvement in system design.",
        },
        {
          date: new Date("2024-02-02"),
          technicalScore: 85,
          hrScore: 80,
          feedback: "Good confidence, but work on problem-solving speed.",
        },
      ];

      // Default data
      performance = {
        studentEmail: email,
        mockTestScores: {
          aptitude: 80,
          coding: 75,
          communication: 85,
          technical: 90,
        },
        codingChallengesSolved: 20,
        interviewScores: 88,
        pastInterviews: pastInterviewsSample,
        mockInterviews: mockInterviewsSample,
        improvementAreas: ["System Design", "Problem Solving Speed"],
      };

      console.log("✅ Default performance record created.");
    }

    res.json(performance);
  } catch (error) {
    console.error("❌ Error fetching performance:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// --- New APIs below ---

// GET /api/performance/:email/events/summary?months=12
// Returns monthly counts per event type for the current year (or last N months window)
router.get("/:email/events/summary", async (req, res) => {
  try {
    const email = String(req.params.email || "")
      .trim()
      .toLowerCase();
    const months = Math.max(1, Math.min(12, parseInt(req.query.months) || 12));
    const perf = await Performance.findOne(
      { studentEmail: email },
      { events: 1 }
    ).lean();
    const now = new Date();
    const labels = [];
    const series = {};

    // Build labels as last N months ending current month
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString(undefined, { month: "short" }));
    }

    const events = Array.isArray(perf?.events) ? perf.events : [];
    events.forEach((ev) => {
      const d = new Date(ev.date);
      if (isNaN(d)) return;
      // compute index in last N months window
      const diffMonths =
        (now.getFullYear() - d.getFullYear()) * 12 +
        (now.getMonth() - d.getMonth());
      const idx = months - 1 - diffMonths;
      if (idx >= 0 && idx < months) {
        if (!series[ev.type]) {
          series[ev.type] = Array(months).fill(0);
        }
        series[ev.type][idx] += 1;
      }
    });

    return res.json({ labels, series });
  } catch (err) {
    console.error("/api/performance/:email/events/summary error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/performance/event
// Body: { email, type, meta }
// Creates or updates performance doc, appends event, and updates simple counters
router.post("/event", async (req, res) => {
  try {
    const { email, type, meta } = req.body || {};
    if (!email || !type) {
      return res.status(400).json({ message: "email and type are required" });
    }
    await recordPerformanceEvent(req.app, email, type, meta || {});
    return res.json({ ok: true });
  } catch (err) {
    console.error("/api/performance/event error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
