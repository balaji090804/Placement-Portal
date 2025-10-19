// routes/announcements.js

const express = require("express");
const router = express.Router();
const FacultyAnnouncement = require("../models/FacultyAnnouncement");
const PlacementAnnouncement = require("../models/PlacementAnnouncement");
const CompanyRole = require("../models/companyRole"); // Using your CompanyRole model
const AttendanceRecord = require("../models/AttendanceRecord");
const StudentSelection = require("../models/StudentSelection"); 
const { sendMailToMany } = require("../utils/emailHelper");

// POST /api/announcements/facultyCreate
// Admin creates a basic announcement and assigns a faculty member.
// Sends an email notification to the assigned faculty.
router.post("/facultyCreate", async (req, res) => {
  try {
    const { companyName, jobRole, dateTime, assignedFacultyEmail } = req.body;
    if (!companyName || !jobRole || !dateTime) {
      return res.status(400).json({
        message: "Missing required fields: companyName, jobRole, or dateTime."
      });
    }

    const newAnnouncement = new FacultyAnnouncement({
      companyName,
      jobRole,
      dateTime,
      assignedFacultyEmail,
    });
    await newAnnouncement.save();

    // Send email notification to assigned faculty if provided.
    if (assignedFacultyEmail) {
      const recipient = assignedFacultyEmail.trim();
      if (recipient) {
        try {
          console.log("Sending email to faculty:", recipient);
          await sendMailToMany(
            recipient,
            `New Placement Announcement for ${companyName}`,
            `Dear Faculty,

A new placement announcement for ${companyName} has been created.
Job Role: ${jobRole}
Scheduled at: ${new Date(dateTime).toLocaleString()}

Please log in to update the details.

Regards,
Placement Team`
          );
          console.log(`Email sent to faculty: ${recipient}`);
        } catch (error) {
          console.error("Error sending email to faculty:", error);
        }
      } else {
        console.error("Assigned faculty email is empty after trimming.");
      }
    }

    return res.status(201).json({
      message: "Faculty announcement created successfully!",
      announcement: newAnnouncement,
    });
  } catch (error) {
    console.error("Error creating faculty announcement:", error);
    return res.status(500).json({ message: "Server error creating faculty announcement." });
  }
});
router.post("/uploadAttendance", async (req, res) => {
  try {
    const { companyName, jobRole, attendanceList } = req.body;

    if (!companyName || !jobRole || !Array.isArray(attendanceList)) {
      return res.status(400).json({ message: "Invalid or missing data." });
    }

    const formattedStudents = attendanceList
      .map((student) => ({
        rollNo: student.rollNo || student.roll_number,
        studentName: student.studentName || student.name
      }))
      .filter((s) => s.rollNo && s.studentName); // Remove incomplete entries

    if (formattedStudents.length === 0) {
      return res.status(400).json({ message: "No valid student data found." });
    }

    const record = new AttendanceRecord({
      companyName,
      jobRole,
      students: formattedStudents,
      uploadedBy: req.user?.email || "faculty"
    });

    await record.save();

    return res.status(200).json({ message: "Attendance uploaded successfully." });
  } catch (error) {
    console.error("❌ Error uploading grouped attendance:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


// GET /api/announcements/faculty
// Faculty fetch announcements assigned to them.
router.get("/faculty", async (req, res) => {
  try {
    const { assignedFacultyEmail } = req.query;
    if (!assignedFacultyEmail) {
      return res
        .status(400)
        .json({ message: "assignedFacultyEmail query parameter required." });
    }
    const announcements = await FacultyAnnouncement.find({ assignedFacultyEmail: assignedFacultyEmail.trim() })
      .sort({ dateTime: 1 });
    return res.status(200).json(announcements);
  } catch (error) {
    console.error("Error fetching faculty announcements:", error);
    return res.status(500).json({ message: "Server error fetching faculty announcements." });
  }
});

// GET /api/announcements/all
// Get all detailed placement announcements (for students and others).
router.get("/all", async (req, res) => {
  try {
    const announcements = await PlacementAnnouncement.find().sort({ dateTime: 1 });
    return res.status(200).json(announcements);
  } catch (err) {
    console.error("Error fetching placement announcements:", err);
    return res.status(500).json({ message: "Server error fetching placement announcements." });
  }
});

// POST /api/announcements/fullCreate
// Faculty posts detailed placement announcement.
// Then email notifications are sent to all students registered for this job from the companyroles collection.
// POST /api/announcements/fullCreate
router.post("/fullCreate", async (req, res) => {
  try {
    // ✅ Destructure all required values from req.body
    const {
      companyName,
      jobRole,
      dateTime,
      assignedFacultyEmail,
      venue,
      extraInfo,
      prePlacementTalkVenue,
      prePlacementTalkTime,
      alumniInteractionTime,
      rounds,
      requiredItems,
    } = req.body;

    if (!companyName || !jobRole || !dateTime || !assignedFacultyEmail) {
      return res.status(400).json({ message: "Missing required basic fields." });
    }

    // ✅ Save detailed announcement
    const detailedAnnouncement = new PlacementAnnouncement({
      companyName,
      jobRole,
      dateTime,
      venue,
      extraInfo,
      prePlacementTalkVenue,
      prePlacementTalkTime,
      alumniInteractionTime,
      rounds,
      requiredItems,
    });

    await detailedAnnouncement.save();

    // ✅ Update status of faculty announcement to completed
    await FacultyAnnouncement.findOneAndUpdate(
      { companyName, jobRole, assignedFacultyEmail },
      { isCompleted: true }
    );

    // ✅ Notify registered students
    try {
      const companyRoleDoc = await CompanyRole.findOne({ companyName, jobRole });
      if (companyRoleDoc && companyRoleDoc.appliedStudents?.length > 0) {
        for (const student of companyRoleDoc.appliedStudents) {
          if (student.email) {
            const studentEmail = student.email.trim();
            await sendMailToMany(
              studentEmail,
              `Placement Drive Details for ${companyName}`,
              `Dear ${student.name},

The detailed placement announcement for ${companyName} is now available.

📍 Venue: ${venue}
📅 Date/Time: ${new Date(dateTime).toLocaleString()}
💼 Job Role: ${jobRole}
ℹ️ Info: ${extraInfo || "N/A"}

Please check your student dashboard for more details.

Regards,  
Placement Team`
            );
            console.log(`Email sent to student: ${studentEmail}`);
          }
        }
      }
    } catch (mailError) {
      console.error("Error notifying registered students:", mailError);
    }

    return res.status(201).json({
      message: "Detailed placement announcement created and students notified.",
      announcement: detailedAnnouncement,
    });
  } catch (error) {
    console.error("Error in /fullCreate:", error);
    return res.status(500).json({ message: "Server error creating detailed announcement." });
  }
});
router.get("/student", async (req, res) => {
  try {
    const { studentEmail } = req.query;
    if (!studentEmail) return res.status(400).json({ message: "studentEmail required" });

    const roles = await CompanyRole.find({ "appliedStudents.email": studentEmail });

    const filters = roles.map(role => ({
      companyName: role.companyName,
      jobRole: role.jobRole
    }));

    const detailedAnnouncements = await PlacementAnnouncement.find({
      $or: filters
    }).sort({ dateTime: -1 });

    return res.json(detailedAnnouncements);
  } catch (error) {
    console.error("Error fetching student announcements:", error);
    return res.status(500).json({ message: "Server error fetching announcements." });
  }
});

// GET /api/announcements/all
router.get("/all", async (req, res) => {
  const announcements = await PlacementAnnouncement.find().sort({ dateTime: 1 });
  return res.status(200).json(announcements);
});


router.get("/upcoming", async (req, res) => {
  try {
    const today = new Date();
    const upcoming = await PlacementAnnouncement.find({ dateTime: { $gte: today } }).sort({ dateTime: 1 });
    return res.json(upcoming);
  } catch (error) {
    console.error("Error fetching upcoming drives:", error);
    return res.status(500).json({ message: "Server error fetching upcoming drives." });
  }
});

// Additional endpoint for updating round results and notifying selected students
router.post("/updateRound", async (req, res) => {
  try {
    const {
      companyName,
      jobRole,
      roundNumber,
      nextRoundVenue,
      nextRoundTime,
      selectedStudents
    } = req.body;
    if (!companyName || !jobRole || !roundNumber || !nextRoundVenue || !nextRoundTime || !selectedStudents) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // For each student in the selectedStudents array, send an email and save selection in DB.
    for (const student of selectedStudents) {
      if (student.email) {
        const recipient = student.email.trim();
        try {
          console.log("Sending email to student:", recipient);
          await sendMailToMany(
            recipient,
            `Round ${roundNumber} Update for ${companyName}`,
            `Dear ${student.name || "Student"},

Congratulations! You have been selected for Round ${roundNumber} of the placement drive for ${companyName} for the role of ${jobRole}.

Next Round Details:
Venue: ${nextRoundVenue}
Time: ${new Date(nextRoundTime).toLocaleString()}

Please be prepared accordingly.

Regards,
Placement Team`
          );
          console.log(`Email sent to student: ${recipient}`);
        } catch (error) {
          console.error(`Error sending email to ${recipient}:`, error);
        }
        // Save the student selection record in the database
        try {
          const newSelection = new StudentSelection({
            studentEmail: recipient,
            studentName: student.name,
            companyName,
            jobRole,
            roundNumber,
            nextRoundVenue,
            nextRoundTime
          });
          await newSelection.save();
          console.log(`Student selection saved for: ${recipient}`);
        } catch (dbError) {
          console.error(`Error saving selection for ${recipient}:`, dbError);
        }
      }
    }

    return res.status(200).json({ message: "Round update processed, emails sent, and selections recorded." });
  } catch (error) {
    console.error("Error processing round update:", error);
    return res.status(500).json({ message: "Server error processing round update." });
  }
});
module.exports = router;
