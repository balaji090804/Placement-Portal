const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { User } = require("../models/user");
const Application = require("../models/application");
const Offer = require("../models/offer");
const Notification = require("../models/notification");
const StudentProfile = require("../models/studentProfile");
const Task = require("../models/task");
const StudentSelection = require("../models/StudentSelection");

// DELETE /api/admin-tools/purge-user?email=
// Admin-only: removes a user and related records (applications/offers/notifications/profile/tasks/selections)
router.delete("/purge-user", auth, async (req, res) => {
  try {
    if (req.user?.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });
    const email = (req.query.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "email required" });

    const [u, a, o, n, p, t, s] = await Promise.all([
      User.deleteOne({ email }),
      Application.deleteMany({ studentEmail: email }),
      Offer.deleteMany({ studentEmail: email }),
      Notification.deleteMany({ toEmail: email }),
      StudentProfile.deleteOne({ collegeEmail: email }),
      Task.deleteMany({ studentEmail: email }),
      StudentSelection.deleteMany({ studentEmail: email }),
    ]);

    res.json({
      ok: true,
      deleted: {
        users: u.deletedCount,
        applications: a.deletedCount,
        offers: o.deletedCount,
        notifications: n.deletedCount,
        profiles: p.deletedCount,
        tasks: t.deletedCount,
        selections: s.deletedCount,
      },
    });
  } catch (e) {
    console.error("purge-user error:", e);
    res.status(500).json({ message: "Purge failed" });
  }
});

// POST /api/admin-tools/set-role
// Admin-only: set a user's role by email (student | faculty | admin | recruiter)
router.post("/set-role", auth, async (req, res) => {
  try {
    if (req.user?.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });
    const { email, role } = req.body || {};
    if (!email || !role)
      return res.status(400).json({ message: "email and role required" });
    const allowed = ["student", "faculty", "admin", "recruiter"];
    if (!allowed.includes(role))
      return res.status(400).json({ message: "invalid role" });
    const doc = await User.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      { $set: { role } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "User not found" });
    return res.json({ ok: true, email: doc.email, role: doc.role });
  } catch (e) {
    console.error("set-role error:", e);
    res.status(500).json({ message: "Failed to set role" });
  }
});

module.exports = router;


