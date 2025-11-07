const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { User } = require("../models/user");
const Notification = require("../models/notification");

async function loadActor(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("email role");
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    req.actor = user;
    next();
  } catch {
    return res.status(500).json({ message: "Auth failed" });
  }
}

// List notifications for current user
router.get("/", auth, loadActor, async (req, res) => {
  try {
    const { unread } = req.query;
    const filter = { toEmail: req.actor.email };
    if (unread === "true") filter.read = false;
    const items = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Failed to list notifications" });
  }
});

// Mark read
router.post("/:id/read", auth, loadActor, async (req, res) => {
  try {
    const n = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: { read: true } },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: "Not found" });
    res.json(n);
  } catch (e) {
    res.status(500).json({ message: "Failed to mark read" });
  }
});

// Create a notification (admin/faculty)
router.post("/", auth, loadActor, async (req, res) => {
  if (!["admin", "faculty"].includes(req.actor.role))
    return res.status(403).json({ message: "Forbidden" });
  try {
    const { toEmail, title, message, link } = req.body || {};
    if (!toEmail || !title)
      return res.status(400).json({ message: "toEmail and title required" });
    const n = await Notification.create({
      toEmail,
      title,
      message,
      link,
      createdBy: req.actor.email,
    });
    const io = req.app.get("io");
    if (io) io.to(`user:${toEmail.toLowerCase()}`).emit("notification:new", n);
    res.status(201).json(n);
  } catch (e) {
    res.status(500).json({ message: "Failed to create notification" });
  }
});

module.exports = router;
