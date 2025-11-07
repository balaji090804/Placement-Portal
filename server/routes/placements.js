const express = require("express");
const nodemailer = require("nodemailer");
const Placement = require("../models/placement");
const router = express.Router();

let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const safeSendMail = async (options) => {
  if (!transporter) return;
  try {
    await transporter.sendMail(options);
  } catch (err) {
    console.warn("Email send failed", err.message);
  }
};

// Bulk upload: only placed students
router.post("/bulk-upload", async (req, res) => {
  try {
    const { placements } = req.body;
    if (!placements || placements.length === 0) {
      return res.status(400).json({ message: "No placement records provided" });
    }

    const placedStudents = placements.filter(
      (student) => (student.status || "").trim().toLowerCase() === "placed"
    );

    if (placedStudents.length === 0) {
      return res.status(400).json({ message: "No 'Placed' students found in CSV" });
    }

    await Placement.insertMany(placedStudents);

    // Send emails (optional)
    for (const student of placedStudents) {
      await safeSendMail({
        from: process.env.SMTP_USER,
        to: student.studentEmail,
        subject: "Congratulations on Your Placement!",
        text: `Dear ${student.studentName},\n\nCongratulations! You have been placed at ${student.company} as a ${student.jobRole} with a package of ${student.package} LPA.\n\nBest Regards,\nPlacement Cell`,
      });
    }

    try {
      const io = req.app.get("io");
      if (io) io.emit("dashboard:update", { scope: "global" });
    } catch (e) {
      console.warn("Socket emit failed for placements bulk-upload:", e.message);
    }

    res.json({
      message: `${placedStudents.length} students added${transporter ? " & emails sent" : ""}!`,
    });
  } catch (error) {
    console.error("Error processing placements:", error);
    res.status(500).json({ message: "Error processing placements", error });
  }
});

// Manual add placement
// Manual add placement
router.post("/", async (req, res) => {
  try {
    const { studentName, studentEmail, branch, company, jobRole, package: pkg, status } = req.body || {};
    if (!studentName || !studentEmail || !company || !jobRole) {
      return res.status(400).json({ message: "studentName, studentEmail, company, jobRole are required" });
    }
    const placement = await Placement.create({
      studentName,
      studentEmail,
      branch,
      company,
      jobRole,
      package: pkg,
      status,
    });
    res.status(201).json(placement);
  } catch (error) {
    console.error("Error adding placement:", error);
    res.status(500).json({ message: "Failed to add placement", error });
  }
});

// List all placements (admin analytics, dashboards)
router.get("/", async (_req, res) => {
  try {
    const rows = await Placement.find({}).sort({ createdAt: -1 });
    res.json(rows);
  } catch (error) {
    console.error("Error fetching placements:", error);
    res.status(500).json({ message: "Failed to fetch placements" });
  }
});

module.exports = router;
