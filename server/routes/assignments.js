const express = require("express");
const Assignment = require("../models/assignment"); // New model
const User = require("../models/user"); // Ensure users are stored here
const router = express.Router();
const Announcement = require("../models/announcement"); 
// 📌 Assign a faculty to students
router.post("/assign", async (req, res) => {
    try {
        const { facultyEmail, studentEmails } = req.body;

        if (!facultyEmail || !studentEmails || studentEmails.length === 0) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        console.log("📌 Assigning Faculty:", facultyEmail, "to Students:", studentEmails);

        // Create assignments for each student
        const assignments = studentEmails.map(email => ({
            facultyEmail,
            studentEmail: email
        }));

        await Assignment.insertMany(assignments);
        res.json({ message: "Faculty assigned successfully!" });

    } catch (error) {
        console.error("❌ Error assigning faculty:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// 📌 Fetch all faculty-student assignments
router.get("/all", async (req, res) => {
    try {
        const assignments = await Assignment.find();
        res.json(assignments);
    } catch (error) {
        console.error("❌ Error fetching assignments:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// 📌 Fetch students assigned to a specific faculty
router.get("/:facultyEmail", async (req, res) => {
    try {
        const { facultyEmail } = req.params;
        const assignments = await Assignment.find({ facultyEmail });
        res.json(assignments);
    } catch (error) {
        console.error("❌ Error fetching students for faculty:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.post("/assign", async (req, res) => {
    try {
        const { facultyEmail, studentEmails } = req.body;

        if (!facultyEmail || !studentEmails || studentEmails.length === 0) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        console.log("📌 Assigning Faculty:", facultyEmail, "to Students:", studentEmails);

        // Create assignments for each student
        const assignments = studentEmails.map(email => ({
            facultyEmail,
            studentEmail: email
        }));

        await Assignment.insertMany(assignments);

        // ✅ Store announcements for faculty and students
        const announcements = [
            {
                recipientEmail: facultyEmail,
                message: `📢 You have been assigned new students for training.`,
                type: "faculty"
            },
            ...studentEmails.map(email => ({
                recipientEmail: email,
                message: `📢 You have been assigned Faculty: ${facultyEmail} for training.`,
                type: "student"
            }))
        ];

        await Announcement.insertMany(announcements);

        res.json({ message: "Faculty assigned successfully!" });

    } catch (error) {
        console.error("❌ Error assigning faculty:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// 📌 Fetch announcements for a user
router.get("/announcements/:email", async (req, res) => {
    try {
        const { email } = req.params;
        const announcements = await Announcement.find({ recipientEmail: email });
        res.json(announcements);
    } catch (error) {
        console.error("❌ Error fetching announcements:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
