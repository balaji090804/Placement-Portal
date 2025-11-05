const express = require("express");
const router = express.Router();

const { User } = require("../models/user");
const Recruiter = require("../models/recruiters");
const CompanyRole = require("../models/companyRole");
const PlacementAnnouncement = require("../models/PlacementAnnouncement");
const StudentSelection = require("../models/StudentSelection");
const FacultyAnnouncement = require("../models/FacultyAnnouncement");
const Placement = require("../models/placement");

// GET /api/admin-dashboard
router.get("/", async (_req, res) => {
  try {
    const now = new Date();
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalStudents,
      totalJobs,
      companyRoles,
      upcomingDrives,
      selectionsToday,
      pendingFacultyAnnouncements,
      totalPlacements,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Recruiter.countDocuments({}),
      CompanyRole.find({}, { appliedStudents: 1 }),
      PlacementAnnouncement.countDocuments({ dateTime: { $gte: now } }),
      StudentSelection.countDocuments({ createdAt: { $gte: since24h } }),
      FacultyAnnouncement.countDocuments({ isCompleted: { $ne: true } }),
      Placement.countDocuments({}),
    ]);

    const totalApplications = companyRoles.reduce(
      (acc, r) =>
        acc + (Array.isArray(r.appliedStudents) ? r.appliedStudents.length : 0),
      0
    );

    return res.json({
      totalStudents,
      totalJobs,
      totalApplications,
      upcomingDrives,
      selectionsToday,
      pendingFacultyAnnouncements,
      totalPlacements,
    });
  } catch (err) {
    console.error("admin-dashboard error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
