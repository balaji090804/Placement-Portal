const express = require("express");
const CompanyRole = require("../models/companyRole"); // ✅ Import the model
const router = express.Router();

// 📌 Handle job applications
router.post("/", async (req, res) => {
    try {
        const { companyName, studentName, jobRole } = req.body;

        if (!companyName || !studentName || !jobRole) {
            return res.status(400).json({ message: "❌ Missing required fields!" });
        }

        // ✅ Check if the student already applied
        let jobApplication = await CompanyRole.findOne({ companyName, jobRole });

        if (jobApplication) {
            if (jobApplication.appliedStudents.includes(studentName)) {
                return res.status(400).json({ message: "⚠️ You have already applied for this job!" });
            }
            // ✅ Add student to the existing job role
            jobApplication.appliedStudents.push(studentName);
            await jobApplication.save();
        } else {
            // ✅ Create a new job role entry
            jobApplication = new CompanyRole({
                companyName,
                jobRole,
                appliedStudents: [studentName],
            });
            await jobApplication.save();
        }

        res.json({ message: "🎉 Application submitted successfully!" });

    } catch (error) {
        console.error("❌ Error submitting application:", error);
        res.status(500).json({ message: "Error submitting application", error });
    }
});

module.exports = router;
