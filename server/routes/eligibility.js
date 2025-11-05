const express = require("express");
const router = express.Router();
const StudentProfile = require("../models/studentProfile");
const Recruiter = require("../models/recruiters");
const auth = require("../middleware/authMiddleware");

// A simple parser for eligibility criteria.
// This can be expanded to be more robust.
const parseEligibility = (criteria) => {
  const rules = {};
  if (!criteria) return rules;

  const cgpaMatch = criteria.match(/cgpa\s*(>=|>)\s*(\d+(?:\.\d+)?)/i);
  if (cgpaMatch) {
    rules.cgpa = parseFloat(cgpaMatch[2]);
  }

  const branchMatch = criteria.match(
    /(?:branch|stream|department)s? in ([\w\s,]+)/i
  );
  if (branchMatch) {
    rules.branches = branchMatch[1]
      .split(",")
      .map((b) => b.trim().toLowerCase());
  }

  const skillsMatch = criteria.match(/skills in ([\w\s,]+)/i);
  if (skillsMatch) {
    rules.skills = skillsMatch[1].split(",").map((s) => s.trim().toLowerCase());
  }

  return rules;
};

// POST /api/eligibility/check
// Checks if a student is eligible for a specific job.
router.post("/check", auth, async (req, res) => {
  try {
    const { companyName, jobRole } = req.body;
    const studentEmail = req.user?.email;

    if (!companyName || !jobRole) {
      return res
        .status(400)
        .json({ message: "Company and role are required." });
    }
    if (!studentEmail) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    // 1. Fetch Student Profile
    const student = await StudentProfile.findOne({
      collegeEmail: studentEmail,
    }).lean();
    if (!student) {
      return res.json({
        eligible: false,
        message: "Profile not found. Please complete your profile.",
      });
    }

    // 2. Fetch Job's Eligibility Criteria from Recruiter model
    const job = await Recruiter.findOne({
      companyName,
      jobTitle: jobRole,
    }).lean();
    if (!job || !job.eligibilityCriteria) {
      // If no criteria are specified, assume eligible.
      return res.json({ eligible: true, message: "No specific criteria." });
    }

    // 3. Perform Eligibility Check
    const rules = parseEligibility(job.eligibilityCriteria);
    const reasons = [];

    // Check CGPA
    if (rules.cgpa && (!student.cgpa || student.cgpa < rules.cgpa)) {
      reasons.push(
        `Requires CGPA >= ${rules.cgpa}. Your CGPA is ${student.cgpa || "N/A"}.`
      );
    }

    // Check Branch
    if (rules.branches && rules.branches.length > 0) {
      const studentBranch = (student.branch || "").toLowerCase();
      if (!rules.branches.includes(studentBranch)) {
        reasons.push(`Not for your branch (${student.branch || "N/A"}).`);
      }
    }

    // Check Skills (optional, simple check)
    if (rules.skills && rules.skills.length > 0) {
      const studentSkills = (student.skills || "").toLowerCase();
      const hasRequiredSkill = rules.skills.some((s) =>
        studentSkills.includes(s)
      );
      if (!hasRequiredSkill) {
        reasons.push(
          `Requires one of these skills: ${rules.skills.join(", ")}.`
        );
      }
    }

    if (reasons.length > 0) {
      return res.json({ eligible: false, message: reasons.join(" ") });
    }

    return res.json({ eligible: true, message: "You are eligible to apply." });
  } catch (error) {
    console.error("❌ Error checking eligibility:", error);
    res
      .status(500)
      .json({ message: "Server error while checking eligibility." });
  }
});

module.exports = router;
