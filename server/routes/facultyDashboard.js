const express = require("express");
const router = express.Router();

const { User } = require("../models/user");
const Assignment = require("../models/assignment");
const FacultyAnnouncement = require("../models/FacultyAnnouncement");
// NOTE: use lowercase path to avoid case-sensitive duplicate module issues
const Performance = require("../models/performance");
const Lecture = require("../models/lecture");

// GET /api/faculty-dashboard?facultyEmail=...
// Returns real-time stats for the faculty dashboard
router.get("/", async (req, res) => {
  try {
    const facultyEmail = (req.query.facultyEmail || "").trim().toLowerCase();
    if (!facultyEmail) {
      return res.status(400).json({ message: "facultyEmail is required" });
    }

    const now = new Date();

    const [
      totalStudents,
      recentAssignments,
      facultyAnnouncements,
      avgAgg,
      upcomingLectures,
    ] = await Promise.all([
      // Global student count (could be refined later to per-faculty)
      User.countDocuments({ role: "student" }),
      // Last 5 assignments created by this faculty
      Assignment.find({ facultyEmail }).sort({ assignedAt: -1 }).limit(5),
      // Last 5 announcements assigned to this faculty
      FacultyAnnouncement.find({ assignedFacultyEmail: facultyEmail })
        .sort({ dateTime: -1 })
        .limit(5),
      // Average interview score across all performance docs
      Performance.aggregate([
        { $group: { _id: null, avg: { $avg: "$interviewScores" } } },
      ]),
      // Count of upcoming lectures scheduled by this faculty (dateTime in future)
      Lecture.countDocuments({ facultyEmail, dateTime: { $gte: now } }),
    ]);

    const averageInterviewScore = avgAgg?.[0]?.avg ?? 0;

    return res.json({
      totalStudents,
      averageInterviewScore,
      upcomingLectures,
      recentAssignments,
      announcements: facultyAnnouncements,
    });
  } catch (err) {
    console.error("Error building faculty dashboard stats:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
