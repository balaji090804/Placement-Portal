// routes/studentProfile.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const StudentProfile = require("../models/studentProfile");

// GET /api/student-profile?email=someone@example.com
// If found -> return profile, else 404
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "Missing email in query." });
    }
    const student = await StudentProfile.findOne({ collegeEmail: email });
    if (!student) {
      return res.status(404).json({ message: "No profile for this email." });
    }
    return res.json(student);
  } catch (err) {
    console.error("Error fetching profile:", err);
    return res.status(500).json({ message: "Server error." });
  }
});
// GET /api/student-profile?email=...
router.get("/student-profile", authMiddleware, async (req, res) => {
  const { email } = req.query;
  const profile = await StudentProfile.findOne({ collegeEmail: email });
  if (!profile) return res.status(404).json({ message: "Not found" });
  res.json(profile);
});


// PUT /api/student-profile
// Upserts by `collegeEmail`
router.put("/", authMiddleware, async (req, res) => {
  try {
    const {
      collegeEmail,
      name,
      contactNumber,
      stream,
      branch,
      resume,
      tenthPercentage,
      twelfthPercentage,
      cgpa,
      certifications,
      github,
      projects,
      linkedin,
      codingProfiles,
      skills,
      profilePicture
    } = req.body;

    if (!collegeEmail) {
      return res.status(400).json({ message: "collegeEmail is required" });
    }

    // Upsert logic
    let student = await StudentProfile.findOne({ collegeEmail });
    if (!student) {
      // If none exists, create new
      student = new StudentProfile({ collegeEmail });
    }
    // Update fields
    student.name = name ?? student.name;
    student.contactNumber = contactNumber ?? student.contactNumber;
    student.stream = stream ?? student.stream;
    student.branch = branch ?? student.branch;
    student.resume = resume ?? student.resume;
    student.tenthPercentage = tenthPercentage ?? student.tenthPercentage;
    student.twelfthPercentage = twelfthPercentage ?? student.twelfthPercentage;
    student.cgpa = cgpa ?? student.cgpa;
    student.certifications = certifications ?? student.certifications;
    student.github = github ?? student.github;
    student.projects = projects ?? student.projects;
    student.linkedin = linkedin ?? student.linkedin;
    student.codingProfiles = codingProfiles ?? student.codingProfiles;
    student.skills = skills ?? student.skills;
    student.profilePicture = profilePicture ?? student.profilePicture;

    await student.save();

    return res.status(200).json({ message: "Profile created or updated successfully!" });
  } catch (err) {
    console.error("Error upserting profile:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
