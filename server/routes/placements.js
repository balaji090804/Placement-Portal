const express = require("express");
const nodemailer = require("nodemailer"); // 📩 For sending emails
const Placement = require("../models/placement");
const router = express.Router();

// 📌 Email Configuration (SMTP)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "bitplacementportal@gmail.com", // 🔹 Replace with your email
        pass: "yckz uxvi olib szbf", // 🔹 Use an app password, NOT your email password!
    },
});

// 📌 Bulk Upload: Only Add "Placed" Students & Send Emails
router.post("/bulk-upload", async (req, res) => {
    try {
        const { placements } = req.body;

        console.log("📥 Received CSV Data:", placements);

        if (!placements || placements.length === 0) {
            return res.status(400).json({ message: "❌ No placement records provided!" });
        }

        // ✅ Filter only students with "Placed" status
        const placedStudents = placements.filter(student => student.status === "Placed");

        if (placedStudents.length === 0) {
            return res.status(400).json({ message: "⚠️ No 'Placed' students found in CSV!" });
        }

        // ✅ Insert "Placed" students into database
        await Placement.insertMany(placedStudents);

        // ✅ Send Email Notifications
        for (const student of placedStudents) {
            const mailOptions = {
                from: "bitplacementportal@gmail.com",
                to: student.studentEmail,
                subject: "🎉 Congratulations on Your Placement!",
                text: `Dear ${student.studentName},\n\nCongratulations! You have been placed at ${student.company} as a ${student.jobRole} with a package of ${student.package} LPA.\n\nBest Regards,\nPlacement Cell`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(`❌ Error sending email to ${student.studentEmail}:`, error);
                } else {
                    console.log(`📩 Email sent to ${student.studentEmail}: ${info.response}`);
                }
            });
        }

        res.json({ message: `🎉 ${placedStudents.length} students added & emails sent!` });

    } catch (error) {
        console.error("❌ Error processing placements:", error);
        res.status(500).json({ message: "Error processing placements", error });
    }
});

module.exports = router;
