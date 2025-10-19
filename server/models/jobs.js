const express = require("express");
const Recruiter = require("../models/recruiters"); // ✅ Using recruiters collection
const router = express.Router();

// 📌 Get all job listings from recruiters collection
router.get("/", async (req, res) => {
    try {
        const jobs = await Recruiter.find(); // ✅ Fetching from recruiters collection
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: "Error fetching job listings", error });
    }
});

module.exports = router;
