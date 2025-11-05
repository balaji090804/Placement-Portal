const express = require("express");
const router = express.Router();
const InterviewRequest = require("../models/InterviewRequest");
const nodemailer = require("nodemailer");

// 📌 Student Requests an Interview
router.post("/request", async (req, res) => {
  try {
    const { studentName, studentEmail } = req.body;

    if (!studentName || !studentEmail) {
      return res.status(400).json({ error: "Student details are required" });
    }

    const newRequest = new InterviewRequest({
      studentName,
      studentEmail,
      status: "Pending",
    });

    await newRequest.save();
    res.status(201).json({ message: "Interview request sent successfully!" });
  } catch (error) {
    console.error("Error processing interview request:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 Faculty Fetches Pending Interview Requests
router.get("/requests", async (req, res) => {
  try {
    const requests = await InterviewRequest.find({ status: "Pending" });
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching interview requests:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 Faculty Schedules an Interview
router.post("/schedule", async (req, res) => {
  try {
    const { requestId, meetingLink, date, time } = req.body;

    const interviewRequest = await InterviewRequest.findById(requestId);
    if (!interviewRequest)
      return res.status(404).json({ error: "Request not found" });

    // Update the interview request with scheduled details
    interviewRequest.meetingLink = meetingLink;
    interviewRequest.date = date;
    interviewRequest.time = time;
    interviewRequest.status = "Scheduled";
    await interviewRequest.save();

    // 📧 Send Email Notification to Student
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "placementportal@gmail.com", // 🔹 Replace with your email
        pass: "yckz uxvi olib szbf",
      },
    });

    const mailOptions = {
      from: "your-email@gmail.com",
      to: interviewRequest.studentEmail,
      subject: "Interview Scheduled",
      text: `Your interview has been scheduled!\n\nGoogle Meet Link: ${meetingLink}\nDate: ${date}\nTime: ${time}`,
    };

    await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json({ message: "Interview scheduled & student notified via email!" });
  } catch (error) {
    console.error("Error scheduling interview:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 Faculty Fetches Scheduled Interviews
router.get("/scheduled", async (req, res) => {
  try {
    const scheduledInterviews = await InterviewRequest.find({
      status: "Scheduled",
    });
    res.status(200).json(scheduledInterviews);
  } catch (error) {
    console.error("Error fetching scheduled interviews:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
