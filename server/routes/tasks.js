const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Task = require("../models/task");
const { User } = require("../models/user");
const StudentProfile = require("../models/studentProfile");
const { recordPerformanceEvent } = require("../utils/performanceEvent");
// Faculty assignment support: allows faculty to create tasks for any student with due date

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
    await recordPerformanceEvent(req.app, email, "taskCreated", {
      taskId: String(task._id),
    });
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

// POST /api/tasks/assign - faculty/admin assigns task to a student
router.post("/assign", auth, async (req, res) => {
  try {
    const actor = await User.findById(req.user._id).select(
      "email role firstName lastName"
    );
    if (!actor?.email)
      return res.status(400).json({ message: "Actor email not found" });
    if (!["faculty", "admin"].includes(actor.role))
      return res.status(403).json({ message: "Forbidden" });
    const { studentEmail, classId, department, branch, text, priority = "Medium", dueDate } = req.body || {};
    if (!text || !String(text).trim())
      return res.status(400).json({ message: "text required" });

    const assignedBy = actor.firstName
      ? `${actor.firstName}${actor.lastName ? " " + actor.lastName : ""}`
      : actor.email;

    // Assign to class if classId provided
    if (classId && !studentEmail) {
      const ClassModel = require("../models/class");
      const cls = await ClassModel.findById(classId);
      if (!cls) return res.status(404).json({ message: "Class not found" });
      const emails = (cls.studentEmails || []).filter(Boolean);
      let created = 0;
      for (const e of emails) {
        const exists = await User.findOne({ email: e }).select("email");
        if (!exists) continue; // skip non-registered
        const task = await Task.create({
          studentEmail: e,
          text: String(text).trim(),
          priority,
          dueDate,
          assignedBy,
        });
        created += 1;
        await recordPerformanceEvent(req.app, e, "taskCreated", {
          taskId: String(task._id),
          assigned: true,
        });
        const io = req.app.get("io");
        if (io) {
          io.to(`user:${e}`).emit("task:created", task);
          io.to(`user:${e}`).emit("dashboard:update", { scope: "student", email: e });
        }
      }
      return res.status(201).json({ ok: true, count: created });
    }

    // Assign to department/branch cohort if provided (no studentEmail/classId)
    const dept = (department || branch || "").trim();
    if (dept && !studentEmail && !classId) {
      const regex = new RegExp(`^${dept.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
      const profiles = await StudentProfile.find({ branch: { $regex: regex } }).lean();
      let created = 0;
      for (const p of profiles) {
        const email = (p.collegeEmail || "").toLowerCase();
        if (!email) continue;
        const exists = await User.findOne({ email }).select("email");
        if (!exists) continue;
        const task = await Task.create({
          studentEmail: email,
          text: String(text).trim(),
          priority,
          dueDate,
          assignedBy,
        });
        created += 1;
        await recordPerformanceEvent(req.app, email, "taskCreated", {
          taskId: String(task._id),
          assigned: true,
        });
        const io = req.app.get("io");
        if (io) {
          io.to(`user:${email}`).emit("task:created", task);
          io.to(`user:${email}`).emit("dashboard:update", { scope: "student", email });
        }
      }
      return res.status(201).json({ ok: true, count: created });
    }

    // Assign to single student
    if (!studentEmail)
      return res.status(400).json({ message: "studentEmail required when classId not provided" });
    const student = await User.findOne({ email: studentEmail }).select("email");
    if (!student) return res.status(404).json({ message: "Student not found" });
    const task = await Task.create({
      studentEmail: studentEmail,
      text: String(text).trim(),
      priority,
      dueDate,
      assignedBy,
    });
    await recordPerformanceEvent(req.app, studentEmail, "taskCreated", {
      taskId: String(task._id),
      assigned: true,
    });
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${studentEmail}`).emit("task:created", task);
      io.to(`user:${studentEmail}`).emit("dashboard:update", { scope: "student", email: studentEmail });
    }
    return res.status(201).json(task);
  } catch (err) {
    console.error("POST /api/tasks/assign error:", err);
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
      await recordPerformanceEvent(req.app, email, "taskCompleted", {
        taskId: String(task._id),
      });
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
