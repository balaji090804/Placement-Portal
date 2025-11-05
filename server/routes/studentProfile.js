// routes/studentProfile.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const StudentProfile = require("../models/studentProfile");
const { User } = require("../models/user");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Configure resume uploads
const resumeDir = path.join(__dirname, "..", "uploads", "resumes");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(resumeDir, { recursive: true });
    cb(null, resumeDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "_");
    const stamp = Date.now();
    cb(null, `${safeBase}_${stamp}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ok = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (ok.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type"));
  },
});

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
// (Removed duplicate nested route to avoid /api/student-profile/student-profile)

// PUT /api/student-profile
// Upserts by `collegeEmail`
router.put("/", authMiddleware, async (req, res) => {
  try {
    const {
      collegeEmail,
      name,
      headline,
      summary,
      contactNumber,
      stream,
      branch,
      location,
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
      profilePicture,
      totalExperienceMonths,
      employmentHistory,
      education,
      preferredRoles,
      preferredLocations,
      noticePeriodDays,
      currentCTC,
      expectedCTC,
      profileVisibility,
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
    student.headline = headline ?? student.headline;
    student.summary = summary ?? student.summary;
    student.contactNumber = contactNumber ?? student.contactNumber;
    student.stream = stream ?? student.stream;
    student.branch = branch ?? student.branch;
    student.location = location ?? student.location;
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
    student.totalExperienceMonths =
      totalExperienceMonths ?? student.totalExperienceMonths;
    student.employmentHistory = employmentHistory ?? student.employmentHistory;
    student.education = education ?? student.education;
    student.preferredRoles = preferredRoles ?? student.preferredRoles;
    student.preferredLocations =
      preferredLocations ?? student.preferredLocations;
    student.noticePeriodDays = noticePeriodDays ?? student.noticePeriodDays;
    student.currentCTC = currentCTC ?? student.currentCTC;
    student.expectedCTC = expectedCTC ?? student.expectedCTC;
    student.profileVisibility = profileVisibility ?? student.profileVisibility;

    await student.save();

    return res
      .status(200)
      .json({ message: "Profile created or updated successfully!" });
  } catch (err) {
    console.error("Error upserting profile:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// GET /api/student-profile/check/:email -> { exists: boolean }
router.get("/check/:email", authMiddleware, async (req, res) => {
  try {
    const { email } = req.params;
    if (!email)
      return res.status(400).json({ message: "Missing email param." });
    const exists = await StudentProfile.exists({ collegeEmail: email });
    return res.json({ exists: Boolean(exists) });
  } catch (err) {
    console.error("Error checking profile existence:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// POST /api/student-profile/resume (single file 'file')
// Updates the logged-in user's profile.resume with a public URL
router.post(
  "/resume",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });
      let email = req.user?.email;
      if (!email && req.user?._id) {
        const u = await User.findById(req.user._id).select("email");
        email = u?.email;
      }
      if (!email)
        return res.status(400).json({ message: "User email missing in token" });

      const publicPath = `/uploads/resumes/${req.file.filename}`;

      let student = await StudentProfile.findOne({ collegeEmail: email });
      if (!student) {
        student = new StudentProfile({ collegeEmail: email });
      }
      student.resume = publicPath;
      await student.save();

      return res.json({ message: "Resume uploaded", url: publicPath });
    } catch (err) {
      console.error("Error uploading resume:", err);
      return res.status(500).json({ message: err.message || "Upload failed" });
    }
  }
);

module.exports = router;
