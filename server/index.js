require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connection = require("./db");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const checkUserRoute = require("./routes/checkUser");
const placementRoutes = require("./routes/placements");
const recruiterRoutes = require("./routes/recruiters");
const registerRoutes = require("./routes/register");
const aptitudeQuestionsRoutes = require("./routes/aptitudeQuestions");
const performanceRoutes = require("./routes/performance");
const tasksRoutes = require("./routes/tasks");
const leaderboardRoutes = require("./routes/leaderboard");
const jobApplyRoutes = require("./routes/jobApply");
const studentProfileRoutes = require("./routes/studentProfile");
const companyRolesRoutes = require("./routes/companyroles");
const assignmentRoutes = require("./routes/assignments");
const announcementsRouter = require("./routes/announcements");
const interviewRoutes = require("./routes/interviews");
const studentSelectionsRoutes = require("./routes/studentSelections");
const facultyDashboardRoutes = require("./routes/facultyDashboard");
const studentDashboardRoutes = require("./routes/studentDashboard");
const adminDashboardRoutes = require("./routes/adminDashboard");
const dailyRoutes = require("./routes/daily");
const ragRoutes = require("./routes/rag");
const http = require("http");
const { Server } = require("socket.io");
const app = express();

// Connect to Database
connection();

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];
app.use(
  cors({
    origin: function (origin, callback) {
      // allow mobile apps or curl with no origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS not allowed from origin: " + origin));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded files (e.g., resumes)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount API Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", checkUserRoute);
app.use("/api/placements", placementRoutes);
app.use("/api/recruiters", recruiterRoutes);
app.use("/api", registerRoutes);
app.use("/api/aptitude-questions", aptitudeQuestionsRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/job-apply", jobApplyRoutes);
app.use("/api/student-profile", studentProfileRoutes);
app.use("/api/companyroles", companyRolesRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/announcements", announcementsRouter);
app.use("/api/studentSelections", studentSelectionsRoutes);
app.use("/api/faculty-dashboard", facultyDashboardRoutes);
app.use("/api/student-dashboard", studentDashboardRoutes);
app.use("/api/admin-dashboard", adminDashboardRoutes);
app.use("/api/daily", dailyRoutes);
app.use("/api/rag", ragRoutes);
// Start HTTP server and attach Socket.IO
const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

// Make io accessible in routes via app locals
app.set("io", io);

io.on("connection", (socket) => {
  // Optional: join rooms by email if provided in query
  const email = (socket.handshake.query?.email || "").toString().toLowerCase();
  if (email) {
    socket.join(`user:${email}`);
  }
  socket.on("join", (room) => {
    if (room) socket.join(room);
  });
});

server.listen(PORT, () => console.log(`🚀 Server + Socket.IO on ${PORT}...`));
