const express = require("express");
const router = express.Router();
const Leaderboard = require("../models/leaderboard");

// Get top 5 performers
router.get("/", async (req, res) => {
    try {
        const topPerformers = await Leaderboard.find().sort({ score: -1 }).limit(5);
        res.json(topPerformers);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
