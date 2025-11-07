const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { User } = require("../models/user");
const Application = require("../models/application");
const Drive = require("../models/drive");
const Notification = require("../models/notification");
const StudentProfile = require("../models/studentProfile");

async function loadActor(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select(
      "email role firstName lastName"
    );
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    req.actor = user;
    next();
  } catch {
    return res.status(500).json({ message: "Auth failed" });
  }
}

// List applications
// - student: own
// - admin/faculty: filter by driveId or all
router.get("/", auth, loadActor, async (req, res) => {
  try {
    const { driveId } = req.query;
    let filter = {};
    if (req.actor.role === "student") {
      filter.studentEmail = req.actor.email;
    }
    if (driveId) filter.driveId = driveId;
    const items = await Application.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Failed to list applications" });
  }
});

// Simple analytics: counts by status, optionally by driveId
router.get("/analytics", auth, loadActor, async (req, res) => {
  try {
    const { driveId } = req.query;
    const match = {};
    if (driveId) match.driveId = driveId;
    const pipeline = [
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ];
    const rows = await Application.aggregate(pipeline);
    const byStatus = rows.reduce((acc, r) => ((acc[r._id] = r.count), acc), {});
    const total = rows.reduce((s, r) => s + r.count, 0);
    res.json({ byStatus, total });
  } catch (e) {
    res.status(500).json({ message: "Analytics failed" });
  }
});

// CSV export (admin/faculty)
router.get("/export/csv", auth, loadActor, async (req, res) => {
  if (!["admin", "faculty"].includes(req.actor.role))
    return res.status(403).json({ message: "Forbidden" });
  try {
    const { driveId } = req.query;
    const filter = {};
    if (driveId) filter.driveId = driveId;
    const items = await Application.find(filter).lean();
    const headers = [
      "_id",
      "driveId",
      "studentEmail",
      "studentName",
      "status",
      "notes",
      "createdAt",
    ];
    const csv = [headers.join(",")]
      .concat(
        items.map((i) =>
          headers
            .map((h) =>
              (i[h] instanceof Date ? i[h].toISOString() : i[h] ?? "")
                .toString()
                .replace(/"/g, '""')
            )
            .map((v) => `"${v}"`)
            .join(",")
        )
      )
      .join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="applications.csv"'
    );
    res.send(csv);
  } catch (e) {
    res.status(500).json({ message: "Export failed" });
  }
});

// Student applies to a drive
router.post("/apply", auth, loadActor, async (req, res) => {
  if (req.actor.role !== "student")
    return res.status(403).json({ message: "Forbidden" });
  try {
    const { driveId } = req.body || {};
    if (!driveId) return res.status(400).json({ message: "driveId required" });
    const drive = await Drive.findById(driveId);
    if (!drive) return res.status(404).json({ message: "Drive not found" });
    // Basic eligibility checks: application window and status
    const now = new Date();
    if (drive.status !== "ApplicationsOpen")
      return res.status(400).json({ message: "Applications not open" });
    if (
      drive.applicationWindow?.opensAt &&
      now < new Date(drive.applicationWindow.opensAt)
    )
      return res.status(400).json({ message: "Applications not yet open" });
    if (
      drive.applicationWindow?.closesAt &&
      now > new Date(drive.applicationWindow.closesAt)
    )
      return res.status(400).json({ message: "Applications closed" });
    // Basic profile presence check
    const profile = await StudentProfile.findOne({
      collegeEmail: req.actor.email,
    });
    if (!profile)
      return res
        .status(400)
        .json({ message: "Complete your profile before applying" });
    // Prevent duplicate
    const exists = await Application.findOne({
      driveId,
      studentEmail: req.actor.email,
    });
    if (exists) return res.status(409).json({ message: "Already applied" });
    const app = await Application.create({
      driveId,
      studentEmail: req.actor.email,
      studentName: `${req.actor.firstName || ""} ${
        req.actor.lastName || ""
      }`.trim(),
    });
    const io = req.app.get("io");
    if (io) io.emit("dashboard:update", { scope: "global" });
    res.status(201).json(app);
  } catch (e) {
    res.status(500).json({ message: "Failed to apply" });
  }
});

// Update application status (admin/faculty)
router.patch("/:id/status", auth, loadActor, async (req, res) => {
  if (!["admin", "faculty"].includes(req.actor.role))
    return res.status(403).json({ message: "Forbidden" });
  try {
    const { status, notes } = req.body || {};
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: "Application not found" });
    app.status = status || app.status;
    app.notes = notes ?? app.notes;
    app.history = app.history || [];
    app.history.push({
      by: req.actor.email,
      action: "status",
      meta: { status },
      at: new Date(),
    });
    await app.save();
    // Notify student on key milestones
    if (["Shortlisted", "InterviewScheduled", "Offered"].includes(app.status)) {
      try {
        await Notification.create({
          toEmail: app.studentEmail,
          title: `Application update: ${app.status}`,
          message: notes || `Your application status changed to ${app.status}`,
          link: `/StudentDashboard/Applications`,
          createdBy: req.actor.email,
        });
        const io = req.app.get("io");
        if (io)
          io.to(`user:${app.studentEmail.toLowerCase()}`).emit(
            "notification:new",
            { title: `Application update: ${app.status}` }
          );
      } catch {}
    }
    const io = req.app.get("io");
    if (io) io.emit("dashboard:update", { scope: "global" });
    res.json(app);
  } catch (e) {
    res.status(500).json({ message: "Failed to update status" });
  }
});

module.exports = router;
