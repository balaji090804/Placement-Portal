const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { User } = require("../models/user");
const Drive = require("../models/drive");

async function ensureRecruiter(req, res, next) {
  try {
    const u = await User.findById(req.user._id).select("email role");
    if (!u) return res.status(401).json({ message: "Unauthorized" });
    if (u.role !== "recruiter")
      return res.status(403).json({ message: "Forbidden" });
    req.actor = u;
    next();
  } catch {
    return res.status(500).json({ message: "Auth failed" });
  }
}

// Recruiter creates a draft drive; admin/faculty can later publish
router.post("/drives", auth, ensureRecruiter, async (req, res) => {
  try {
    const payload = req.body || {};
    const drive = await Drive.create({
      ...payload,
      status: "Draft",
      createdBy: req.actor.email,
    });
    res.status(201).json(drive);
  } catch (e) {
    res.status(500).json({ message: "Failed to create draft drive" });
  }
});

// List only drives created by this recruiter
router.get("/drives", auth, ensureRecruiter, async (req, res) => {
  try {
    const items = await Drive.find({ createdBy: req.actor.email }).sort({
      createdAt: -1,
    });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Failed to list drives" });
  }
});

// Update draft drive
router.put("/drives/:id", auth, ensureRecruiter, async (req, res) => {
  try {
    const d = await Drive.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.actor.email, status: "Draft" },
      { $set: { ...req.body } },
      { new: true }
    );
    if (!d)
      return res
        .status(404)
        .json({ message: "Drive not found or not editable" });
    res.json(d);
  } catch (e) {
    res.status(500).json({ message: "Failed to update" });
  }
});

module.exports = router;
