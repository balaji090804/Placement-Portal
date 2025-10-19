const express = require("express");
const router = express.Router();
const StudentSelection = require("../models/StudentSelection");

// GET /api/studentSelections?studentEmail=...
router.get("/", async (req, res) => {
  try {
    const { studentEmail } = req.query;

    let filter = {};
    if (studentEmail) {
      filter.studentEmail = studentEmail.trim().toLowerCase();
    }

    const selections = await StudentSelection.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(selections);
  } catch (error) {
    console.error("Error fetching student selections:", error);
    res.status(500).json({ message: "Server error fetching student selections." });
  }
});

module.exports = router;
