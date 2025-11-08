const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { User } = require("../models/user");
const Lecture = require("../models/lecture");

async function actor(req) {
  const u = await User.findById(req.user._id).select("email role");
  if (!u) throw new Error("Unauthorized");
  return u;
}

// GET /api/lectures - list lectures (optionally filtered by facultyEmail & upcoming=true)
router.get("/", auth, async (req, res) => {
  try {
    const { facultyEmail, upcoming } = req.query || {};
    const filter = {};
    if (facultyEmail) filter.facultyEmail = facultyEmail.toLowerCase();
    if (upcoming === "true") filter.dateTime = { $gte: new Date() };

    const list = await Lecture.find(filter).sort({ dateTime: 1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: "Failed to list lectures" });
  }
});

// POST /api/lectures - create a lecture (faculty/admin)
router.post("/", auth, async (req, res) => {
  try {
    const u = await actor(req);
    if (!["faculty", "admin"].includes(u.role))
      return res.status(403).json({ message: "Forbidden" });

    const { title, dateTime, classId, durationMinutes, room, description } =
      req.body || {};
    if (!title || !dateTime) {
      return res.status(400).json({ message: "title and dateTime required" });
    }

    const doc = await Lecture.create({
      title,
      dateTime,
      classId: classId || undefined,
      durationMinutes,
      room,
      description,
      facultyEmail: u.email,
      createdBy: u.email,
      updatedBy: u.email,
    });

    // Emit dashboard update for real-time refresh
    const io = req.app.get("io");
    if (io) {
      io.emit("dashboard:update", {
        scope: "global",
        type: "lecture:created",
        lectureId: doc._id,
      });
    }

    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: "Failed to create lecture" });
  }
});

module.exports = router;
