const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { User } = require("../models/user");
const ClassModel = require("../models/class");
const StudentProfile = require("../models/studentProfile");

async function actor(req) {
  const u = await User.findById(req.user._id).select("email role");
  if (!u) throw new Error("Unauthorized");
  return u;
}

// GET /api/classes - list classes
router.get("/", auth, async (req, res) => {
  try {
    const list = await ClassModel.find({}).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: "Failed to list classes" });
  }
});

// POST /api/classes - create class (faculty/admin)
router.post("/", auth, async (req, res) => {
  try {
    const u = await actor(req);
    if (!["faculty", "admin"].includes(u.role))
      return res.status(403).json({ message: "Forbidden" });
    const { courseName, department, schedule, instructor, room } = req.body || {};
    if (!courseName || !department)
      return res.status(400).json({ message: "courseName and department required" });
    const doc = await ClassModel.create({
      courseName,
      department,
      schedule,
      instructor,
      room,
      createdBy: u.email,
      updatedBy: u.email,
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: "Failed to create class" });
  }
});

// POST /api/classes/:id/students - add student to class (faculty/admin)
router.post("/:id/students", auth, async (req, res) => {
  try {
    const u = await actor(req);
    if (!["faculty", "admin"].includes(u.role))
      return res.status(403).json({ message: "Forbidden" });
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "email required" });
    const cls = await ClassModel.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (!cls.studentEmails.includes(email)) cls.studentEmails.push(email);
    cls.updatedBy = u.email;
    await cls.save();
    res.json(cls);
  } catch (e) {
    res.status(500).json({ message: "Failed to add student" });
  }
});

module.exports = router;

// GET /api/classes/branches - distinct branch/department values from profiles
router.get("/branches", auth, async (req, res) => {
  try {
    const values = await StudentProfile.distinct("branch");
    const cleaned = (values || [])
      .map((v) => (v || "").toString().trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    res.json({ branches: cleaned });
  } catch (e) {
    res.status(500).json({ message: "Failed to load branches" });
  }
});


