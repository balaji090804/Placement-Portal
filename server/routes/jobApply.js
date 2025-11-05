const express = require("express");
const CompanyRole = require("../models/companyRole"); // ✅ Import the model
const router = express.Router();

// 📌 Handle job applications
router.post("/", async (req, res) => {
  try {
    const { companyName, studentName, studentEmail, jobRole } = req.body;

    if (!companyName || !studentName || !jobRole) {
      return res.status(400).json({ message: "❌ Missing required fields!" });
    }

    // ✅ Check if the student already applied
    let jobApplication = await CompanyRole.findOne({ companyName, jobRole });

    if (jobApplication) {
      // Support legacy string array and new object array format
      const exists = (jobApplication.appliedStudents || []).some((s) => {
        if (typeof s === "string") return s === studentName;
        return (
          (s.email &&
            studentEmail &&
            s.email.toLowerCase() === String(studentEmail).toLowerCase()) ||
          s.name === studentName
        );
      });
      if (exists) {
        return res
          .status(400)
          .json({ message: "⚠️ You have already applied for this job!" });
      }
      // ✅ Add student to the existing job role (object format)
      jobApplication.appliedStudents.push(
        studentEmail
          ? { name: studentName, email: String(studentEmail).toLowerCase() }
          : studentName
      );
      await jobApplication.save();
    } else {
      // ✅ Create a new job role entry
      jobApplication = new CompanyRole({
        companyName,
        jobRole,
        appliedStudents: [
          studentEmail
            ? { name: studentName, email: String(studentEmail).toLowerCase() }
            : studentName,
        ],
      });
      await jobApplication.save();
    }

    // Realtime notify admin dashboards
    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("dashboard:update", { scope: "global" });
      }
    } catch (e) {
      console.warn("Socket emit failed for job application:", e.message);
    }

    res.json({ message: "🎉 Application submitted successfully!" });
  } catch (error) {
    console.error("❌ Error submitting application:", error);
    res.status(500).json({ message: "Error submitting application", error });
  }
});

module.exports = router;
