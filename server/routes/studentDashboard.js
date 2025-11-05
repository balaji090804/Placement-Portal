const express = require("express");
const router = express.Router();

const Task = require("../models/task");
const Performance = require("../models/performance");
const CompanyRole = require("../models/companyRole");
const PlacementAnnouncement = require("../models/PlacementAnnouncement");

// GET /api/student-dashboard?studentEmail=...
router.get("/", async (req, res) => {
  try {
    const studentEmail = (req.query.studentEmail || "").trim().toLowerCase();
    if (!studentEmail) {
      return res.status(400).json({ message: "studentEmail is required" });
    }

    const [tasksTotal, tasksCompleted, performance, appliedRoles] =
      await Promise.all([
        Task.countDocuments({ studentEmail }),
        Task.countDocuments({ studentEmail, status: "Completed" }),
        Performance.findOne({ studentEmail }),
        CompanyRole.find(
          { "appliedStudents.email": studentEmail },
          { companyName: 1, jobRole: 1 }
        ),
      ]);

    const roleFilters = appliedRoles.map((r) => ({
      companyName: r.companyName,
      jobRole: r.jobRole,
    }));
    const upcomingAnnouncements = roleFilters.length
      ? await PlacementAnnouncement.countDocuments({
          $or: roleFilters,
          dateTime: { $gte: new Date() },
        })
      : 0;

    return res.json({
      tasks: { total: tasksTotal, completed: tasksCompleted },
      applications: appliedRoles.length,
      upcomingAnnouncements,
      performance: performance || null,
    });
  } catch (err) {
    console.error("student-dashboard error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
