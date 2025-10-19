// routes/companyroles.js

const express = require("express");
const router = express.Router();
const CompanyRoles = require("../models/companyRole");
const StudentProfile = require("../models/studentProfile");

// POST /api/companyroles/apply
router.post("/apply", async (req, res) => {
  try {
    const { companyName, jobRole, studentName, studentEmail } = req.body;

    if (!companyName || !jobRole || !studentName || !studentEmail) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    const studentProfileExists = await StudentProfile.exists({ collegeEmail: studentEmail });

    if (!studentProfileExists) {
      return res.status(400).json({
        message: "You must complete your profile before applying for jobs."
      });
    }
    let jobDoc = await CompanyRoles.findOne({ companyName, jobRole });
    if (!jobDoc) {
      jobDoc = new CompanyRoles({
        companyName,
        jobRole,
        appliedStudents: []
      });
    }
    
    const alreadyApplied = jobDoc.appliedStudents.some(
      (stud) => stud.email === studentEmail
    );
    if (alreadyApplied) {
      return res.status(400).json({
        message: "You have already applied for this job."
      });
    }

    // Add student
    jobDoc.appliedStudents.push({
      name: studentName,
      email: studentEmail,
    });
    await jobDoc.save();
    return res.json({ message: "Application successful!" });
  } catch (error) {
    console.error("❌ Error applying for job:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
});

// GET /api/companyroles/applicants
// Return full StudentProfile docs for each applicant, excluding profilePicture
router.get("/applicants", async (req, res) => {
  try {
    const { companyName, jobRole } = req.query;
    if (!companyName || !jobRole) {
      return res.status(400).json({
        message: "Missing companyName or jobRole in query."
      });
    }

    // 1) Find doc
    const jobDoc = await CompanyRoles.findOne({ companyName, jobRole });
    // If no doc, just return empty array instead of 404
    if (!jobDoc) {
      return res.json([]);
    }

    // 2) If doc has no applicants, also return empty
    if (!jobDoc.appliedStudents || jobDoc.appliedStudents.length === 0) {
      return res.json([]);
    }

    // 3) Collect all applicant emails
    const emails = jobDoc.appliedStudents.map((s) => s.email);

    // 4) Retrieve each StudentProfile by collegeEmail
    // Omit profilePicture (if you want)
    const profiles = await StudentProfile.find(
      { collegeEmail: { $in: emails } },
      {
        regNo: 1,
        name: 1,
        contactNumber: 1,
        collegeEmail: 1,
        stream: 1,
        branch: 1,
        resume: 1,
        tenthPercentage: 1,
        twelfthPercentage: 1,
        cgpa: 1,
        certifications: 1,
        github: 1,
        projects: 1,
        linkedin: 1,
        codingProfiles: 1,
        skills: 1,
        _id: 0
      }
    );

    return res.json(profiles);
  } catch (error) {
    console.error("❌ Error fetching applicant profiles:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/companyroles/all
router.get("/all", async (req, res) => {
  try {
    const registrations = await CompanyRoles.find();
    return res.json(registrations);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
