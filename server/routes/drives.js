const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { User } = require("../models/user");
const Drive = require("../models/drive");
const { DRIVE_STATUSES } = require("../models/drive");

function ensureRole(roles) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).select("email role");
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      if (!roles.includes(user.role))
        return res.status(403).json({ message: "Forbidden" });
      req.actor = user;
      next();
    } catch (e) {
      return res.status(500).json({ message: "Role check failed" });
    }
  };
}

// List drives with filters
router.get("/", auth, async (req, res) => {
  try {
    const { status, q } = req.query;
    const filter = { archived: { $ne: true } };
    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };
    const drives = await Drive.find(filter).sort({ createdAt: -1 });
    res.json(drives);
  } catch (e) {
    res.status(500).json({ message: "Failed to list drives" });
  }
});

// Create a drive (admin/faculty) or accept recruiter draft (admin/faculty)
router.post("/", auth, ensureRole(["admin", "faculty"]), async (req, res) => {
  try {
    const payload = req.body || {};
    const drive = await Drive.create({
      ...payload,
      createdBy: req.actor.email,
    });
    const io = req.app.get("io");
    if (io) io.emit("dashboard:update", { scope: "global" });
    res.status(201).json(drive);
  } catch (e) {
    res.status(500).json({ message: "Failed to create drive" });
  }
});

// Update basic fields
router.put("/:id", auth, ensureRole(["admin", "faculty"]), async (req, res) => {
  try {
    const payload = req.body || {};
    const drive = await Drive.findByIdAndUpdate(
      req.params.id,
      { $set: { ...payload, updatedBy: req.actor.email } },
      { new: true }
    );
    if (!drive) return res.status(404).json({ message: "Drive not found" });
    res.json(drive);
  } catch (e) {
    res.status(500).json({ message: "Failed to update drive" });
  }
});

// Transition status
router.post(
  "/:id/transition",
  auth,
  ensureRole(["admin", "faculty"]),
  async (req, res) => {
    try {
      const { to } = req.body || {};
      if (!DRIVE_STATUSES.includes(to))
        return res.status(400).json({ message: "Invalid status" });
      const drive = await Drive.findById(req.params.id);
      if (!drive) return res.status(404).json({ message: "Drive not found" });
      drive.status = to;
      drive.statusTimestamps = drive.statusTimestamps || {};
      drive.statusTimestamps[to] = new Date();
      drive.updatedBy = req.actor.email;
      drive.history = drive.history || [];
      drive.history.push({
        by: req.actor.email,
        action: "status",
        meta: { to },
        at: new Date(),
      });
      await drive.save();
      const io = req.app.get("io");
      if (io) io.emit("dashboard:update", { scope: "global" });
      res.json(drive);
    } catch (e) {
      res.status(500).json({ message: "Failed to transition status" });
    }
  }
);

// Archive
router.post("/:id/archive", auth, ensureRole(["admin"]), async (req, res) => {
  try {
    const drive = await Drive.findByIdAndUpdate(
      req.params.id,
      { $set: { archived: true, updatedBy: req.actor.email } },
      { new: true }
    );
    if (!drive) return res.status(404).json({ message: "Drive not found" });
    res.json(drive);
  } catch (e) {
    res.status(500).json({ message: "Failed to archive drive" });
  }
});

module.exports = router;
