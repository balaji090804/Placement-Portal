const express = require("express");
const Recruiter = require("../models/recruiters"); // ✅ Ensure this model is correctly set up
const router = express.Router();

// 📌 Get all job listings from the recruiters collection
router.get("/", async (req, res) => {
    try {
        console.log("Fetching jobs from recruiters collection...");
        const jobs = await Recruiter.find();

        if (!jobs || jobs.length === 0) {
            return res.status(404).json({ message: "No job listings found in the database." });
        }

        res.json(jobs);
    } catch (error) {
        console.error("Error fetching job listings:", error);
        res.status(500).json({ message: "Error fetching job listings", error });
    }
});

// 📌 Add a new job listing (from Admin Dashboard)
router.post("/", async (req, res) => {
    try {
        console.log("📥 Incoming Job Data:", req.body); // ✅ Debugging log

        const { company, title, location, type, salary, deadline, jobMode, experienceLevel, requiredSkills, jobDescription, companyWebsite, logo } = req.body;

        // ✅ Validate required fields
        const missingFields = [];
        if (!company) missingFields.push("company");
        if (!title) missingFields.push("title");
        if (!location) missingFields.push("location");
        if (!type) missingFields.push("type");
        if (!salary) missingFields.push("salary");
        if (!deadline) missingFields.push("deadline");
        if (!jobMode) missingFields.push("jobMode");
        if (!experienceLevel) missingFields.push("experienceLevel");
        if (!requiredSkills || requiredSkills.length === 0) missingFields.push("requiredSkills");
        if (!jobDescription) missingFields.push("jobDescription");

        if (missingFields.length > 0) {
            console.log("❌ Missing Fields:", missingFields);
            return res.status(400).json({ message: `Missing required fields: ${missingFields.join(", ")}` });
        }

        const newJob = new Recruiter({ company, title, location, type, salary, deadline, jobMode, experienceLevel, requiredSkills, jobDescription, companyWebsite, logo });
        await newJob.save();

        res.json({ message: "🎉 Job added successfully!", newJob });
    } catch (error) {
        console.error("❌ Error adding job:", error);
        res.status(500).json({ message: "Error adding job", error });
    }
});


module.exports = router;
