require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connection = require("./db");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const placementRoutes = require("./routes/placements");
const recruiterRoutes = require("./routes/recruiters");
const registerRoutes = require("./routes/register");
const aptitudeQuestionsRoutes = require("./routes/aptitudeQuestions");
const performanceRoutes = require("./routes/performance");
const leaderboardRoutes = require("./routes/leaderboard");
const jobApplyRoutes = require("./routes/jobApply");
const studentProfileRoutes = require("./routes/studentProfile");
const companyRolesRoutes = require("./routes/companyroles");
const assignmentRoutes = require("./routes/assignments");
const announcementsRouter = require("./routes/announcements");
const interviewRoutes = require("./routes/interviews");
const studentSelectionsRoutes = require("./routes/studentSelections");
const app = express();

// Connect to Database
connection();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Mount API Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/placements", placementRoutes);
app.use("/api/recruiters", recruiterRoutes);
app.use("/api", registerRoutes);
app.use("/api/aptitude-questions", aptitudeQuestionsRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/job-apply", jobApplyRoutes);
app.use("/api/student-profile", studentProfileRoutes);
app.use("/api/companyroles", companyRolesRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/announcements", announcementsRouter);
app.use("/api/studentSelections", studentSelectionsRoutes);
// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}...`));
