const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Task = require("../models/task");
const { User } = require("../models/user");
const Performance = require("../models/performance");

async function appendEvent(studentEmail, type, meta = {}) {
  if (!studentEmail) return;
  try {
    let doc = await Performance.findOne({ studentEmail });
    if (!doc) doc = new Performance({ studentEmail });
    doc.events = doc.events || [];
    doc.events.push({ type, meta, date: new Date() });
    // Simple score nudges
    if (type === "taskCompleted") {
      doc.mockTestScores.aptitude = Math.min(
        100,
        (doc.mockTestScores.aptitude || 0) + 1
      );
    }
    doc.lastUpdated = new Date();
    await doc.save();
  } catch (e) {
    console.warn("appendEvent failed", e.message);
  }
}

// GET /api/tasks - list current user's tasks
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("email");
    const email = user?.email;
    if (!email)
      return res.status(400).json({ message: "Email not found for user" });
    const tasks = await Task.find({ studentEmail: email }).sort({
      createdAt: -1,
    });
    return res.json(tasks);
  } catch (err) {
    console.error("GET /api/tasks error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/tasks - create task
router.post("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("email");
    const email = user?.email;
    if (!email)
      return res.status(400).json({ message: "Email not found for user" });
    const { text, priority = "Medium", dueDate } = req.body || {};
    if (!text || !String(text).trim())
      return res.status(400).json({ message: "Text is required" });
    const task = await Task.create({
      studentEmail: email,
      text: String(text).trim(),
      priority,
      dueDate,
    });
    appendEvent(email, "taskCreated", { taskId: String(task._id) });
    // Realtime notify
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${email}`).emit("task:created", task);
      io.to(`user:${email}`).emit("dashboard:update", {
        scope: "student",
        email,
      });
    }
    return res.status(201).json(task);
  } catch (err) {
    console.error("POST /api/tasks error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// PUT /api/tasks/:id - update task
router.put("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("email");
    const email = user?.email;
    if (!email)
      return res.status(400).json({ message: "Email not found for user" });
    const { text, priority, dueDate, status } = req.body || {};
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, studentEmail: email },
      {
        $set: {
          ...(text !== undefined ? { text } : {}),
          ...(priority ? { priority } : {}),
          ...(dueDate ? { dueDate } : {}),
          ...(status ? { status } : {}),
        },
      },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${email}`).emit("task:updated", task);
      io.to(`user:${email}`).emit("dashboard:update", {
        scope: "student",
        email,
      });
    }
    return res.json(task);
  } catch (err) {
    console.error("PUT /api/tasks/:id error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// PATCH /api/tasks/:id/toggle - toggle completion
router.patch("/:id/toggle", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("email");
    const email = user?.email;
    if (!email)
      return res.status(400).json({ message: "Email not found for user" });
    const task = await Task.findOne({
      _id: req.params.id,
      studentEmail: email,
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
    task.status = task.status === "Completed" ? "Pending" : "Completed";
    await task.save();
    if (task.status === "Completed")
      await appendEvent(email, "taskCompleted", { taskId: String(task._id) });
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${email}`).emit("task:toggled", task);
      io.to(`user:${email}`).emit("dashboard:update", {
        scope: "student",
        email,
      });
    }
    return res.json(task);
  } catch (err) {
    console.error("PATCH /api/tasks/:id/toggle error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("email");
    const email = user?.email;
    if (!email)
      return res.status(400).json({ message: "Email not found for user" });
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      studentEmail: email,
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${email}`).emit("task:deleted", { _id: req.params.id });
      io.to(`user:${email}`).emit("dashboard:update", {
        scope: "student",
        email,
      });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/tasks/:id error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
