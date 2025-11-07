const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { User } = require("../models/user");
const InterviewSlot = require("../models/interviewSlot");

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

// List slots (optionally by drive)
router.get("/", auth, loadActor, async (req, res) => {
  try {
    const { driveId } = req.query;
    const filter = {};
    if (driveId) filter.driveId = driveId;
    const slots = await InterviewSlot.find(filter).sort({ slotStart: 1 });
    res.json(slots);
  } catch (e) {
    res.status(500).json({ message: "Failed to list slots" });
  }
});

// Create slot (admin/faculty)
router.post("/", auth, loadActor, async (req, res) => {
  if (!["admin", "faculty"].includes(req.actor.role))
    return res.status(403).json({ message: "Forbidden" });
  try {
    const { driveId, slotStart, slotEnd, capacity, notes } = req.body || {};
    if (!driveId || !slotStart || !slotEnd)
      return res
        .status(400)
        .json({ message: "driveId, slotStart, slotEnd required" });
    const slot = await InterviewSlot.create({
      driveId,
      slotStart,
      slotEnd,
      capacity: capacity || 1,
      notes,
      createdBy: req.actor.email,
    });
    const io = req.app.get("io");
    if (io) io.emit("dashboard:update", { scope: "global" });
    res.status(201).json(slot);
  } catch (e) {
    res.status(500).json({ message: "Failed to create slot" });
  }
});

// Book slot (student)
router.post("/:id/book", auth, loadActor, async (req, res) => {
  if (req.actor.role !== "student")
    return res.status(403).json({ message: "Forbidden" });
  try {
    const slot = await InterviewSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });
    const already = (slot.bookedEmails || []).includes(req.actor.email);
    if (already) return res.status(409).json({ message: "Already booked" });
    if ((slot.bookedEmails || []).length >= slot.capacity)
      return res.status(409).json({ message: "Slot full" });
    slot.bookedEmails.push(req.actor.email);
    await slot.save();
    const io = req.app.get("io");
    if (io) io.emit("dashboard:update", { scope: "global" });
    res.json(slot);
  } catch (e) {
    res.status(500).json({ message: "Failed to book slot" });
  }
});

// Cancel booking (student)
router.post("/:id/cancel", auth, loadActor, async (req, res) => {
  if (req.actor.role !== "student")
    return res.status(403).json({ message: "Forbidden" });
  try {
    const slot = await InterviewSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });
    slot.bookedEmails = (slot.bookedEmails || []).filter(
      (e) => e !== req.actor.email
    );
    await slot.save();
    const io = req.app.get("io");
    if (io) io.emit("dashboard:update", { scope: "global" });
    res.json(slot);
  } catch (e) {
    res.status(500).json({ message: "Failed to cancel" });
  }
});

module.exports = router;
