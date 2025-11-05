const express = require("express");
const Recruiter = require("../models/recruiters");
const router = express.Router();

// Create a new job listing
router.post("/", async (req, res) => {
  try {
    const requiredFields = [
      "companyName",
      "jobTitle",
      "packageOffered",
      "interviewDate",
      "jobLocation",
      "jobType",
      "jobMode",
      "experienceLevel",
      "requiredSkills",
      "jobDescription",
      "eligibilityCriteria",
      "selectionProcess",
      "jobLocationDetails",
      "registrationLink",
    ];

    const missing = requiredFields.filter((field) => {
      const value = req.body[field];
      if (typeof value === "string") return value.trim() === "";
      return value === undefined || value === null;
    });
    if (missing.length > 0) {
      return res
        .status(400)
        .json({ message: `Missing fields: ${missing.join(", ")}` });
    }

    const skillsArray = Array.isArray(req.body.requiredSkills)
      ? req.body.requiredSkills.map((s) => s.trim())
      : req.body.requiredSkills.split(",").map((s) => s.trim());

    // Validate enums
    const ALLOWED_TYPES = ["Full-time", "Internship", "Part-time", "Contract"];
    const ALLOWED_MODES = ["Remote", "Hybrid", "On-Site"];
    const ALLOWED_EXP = ["Entry Level", "Mid Level", "Senior Level"];
    if (!ALLOWED_TYPES.includes(req.body.jobType)) {
      return res
        .status(400)
        .json({
          message: `Invalid jobType. Allowed: ${ALLOWED_TYPES.join(", ")}`,
        });
    }
    if (!ALLOWED_MODES.includes(req.body.jobMode)) {
      return res
        .status(400)
        .json({
          message: `Invalid jobMode. Allowed: ${ALLOWED_MODES.join(", ")}`,
        });
    }
    if (!ALLOWED_EXP.includes(req.body.experienceLevel)) {
      return res
        .status(400)
        .json({
          message: `Invalid experienceLevel. Allowed: ${ALLOWED_EXP.join(
            ", "
          )}`,
        });
    }

    const newJob = new Recruiter({ ...req.body, requiredSkills: skillsArray });
    await newJob.save();

    // No emails here; emails are sent when a detailed placement announcement is created.

    // Realtime notify admin dashboards, etc.
    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("jobs:new", newJob);
        io.emit("dashboard:update", { scope: "global" });
      }
    } catch (e) {
      console.warn("Socket emit failed for new job:", e.message);
    }

    return res.json({
      message:
        "✅ Job posted (emails will be sent after placement announcement)",
      emailStatus: "skipped",
      newJob,
    });
  } catch (error) {
    console.error("❌ Error posting job:", error);
    return res
      .status(500)
      .json({ message: error?.message || "Internal Server Error", error });
  }
});

// List job listings (used by Admin Placement Create for dropdowns)
router.get("/", async (_req, res) => {
  try {
    const jobs = await Recruiter.find().sort({ postedAt: -1 });
    return res.json(jobs);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching job listings", error });
  }
});

module.exports = router;
