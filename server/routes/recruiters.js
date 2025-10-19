const express = require("express");
const Recruiter = require("../models/recruiters");
const { User } = require("../models/user");
const nodemailer = require("nodemailer");

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "bitplacementportal@gmail.com", // 🔹 Replace with your email
    pass: "yckz uxvi olib szbf", // 🔹 Use an app password, NOT your email password!
  },
});

router.post("/", async (req, res) => {
  try {
    const requiredFields = [
      "companyName", "jobTitle", "packageOffered", "interviewDate",
      "jobLocation", "jobType", "jobMode", "experienceLevel",
      "requiredSkills", "jobDescription", "eligibilityCriteria",
      "selectionProcess", "jobLocationDetails", "registrationLink"
    ];

    const missing = requiredFields.filter((field) => {
      const value = req.body[field];
      if (typeof value === "string") return value.trim() === "";
      return value === undefined || value === null;
    });

    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` });
    }

    const skillsArray = Array.isArray(req.body.requiredSkills)
      ? req.body.requiredSkills.map(s => s.trim())
      : req.body.requiredSkills.split(",").map(s => s.trim());

    const jobPayload = { ...req.body, requiredSkills: skillsArray };
    const newJob = new Recruiter(jobPayload);
    await newJob.save();
    console.log("✅ Job saved to MongoDB");

    const students = await User.find({ role: "student" }, "email");
    const studentEmails = students.map(s => s.email);

    if (!studentEmails.length) {
      return res.json({ message: "Job added, but no students found to notify." });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: studentEmails,
      subject: `📣 Campus Placement Opportunity - ${req.body.companyName}`,
      html: `
      <div style="font-family: 'Segoe UI', sans-serif; font-size: 14px; color: #2d3748;">
        <p>Dear Students,</p>
        <p>Greetings of the Day!!</p>

        <p><strong>Company:</strong> ${req.body.companyName} (${req.body.companyWebsite || "N/A"})</p>

        ${req.body.aboutCompany && `<p><strong>About the Company:</strong><br>${req.body.aboutCompany.replace(/\n/g, "<br>")}</p>`}

        <p><strong>CTC:</strong> ₹${req.body.packageOffered} LPA</p>

        ${req.body.internshipInfo && `<p><strong>Internship Details:</strong><br>${req.body.internshipInfo.replace(/\n/g, "<br>")}</p>`}

        <p><strong>Job Title:</strong> ${req.body.jobTitle}</p>
        <p><strong>Eligibility:</strong> ${req.body.eligibilityCriteria}</p>
        <p><strong>Branches:</strong> All BE/BTECH</p>

        ${req.body.jobResponsibilities && `<p><strong>Roles & Responsibilities:</strong><br>${req.body.jobResponsibilities.replace(/\n/g, "<br>")}</p>`}

        <p><strong>Selection Process:</strong><br>${req.body.selectionProcess.replace(/\n/g, "<br>")}</p>

        ${req.body.additionalNotes && `<p><strong>Note:</strong><br>${req.body.additionalNotes}</p>`}

        <p style="margin-top: 20px; font-weight: bold;">
          📌 Kindly visit the <strong>Student Dashboard</strong> to apply for this job within the deadline.
        </p>

        <p style="margin-top: 30px;">Thanks & Regards,<br/>Placement Office, BIT</p>
      </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "🎉 Job posted and emails sent!", newJob });
  } catch (error) {
    console.error("❌ Error posting job:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

router.get("/", async (req, res) => {
  try {
    const jobs = await Recruiter.find().sort({ postedAt: -1 });
    if (!jobs.length) return res.status(404).json({ message: "No job listings found." });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching job listings", error });
  }
});

module.exports = router;
