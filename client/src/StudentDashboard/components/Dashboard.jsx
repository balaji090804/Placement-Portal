import React, { useState } from "react";
import "../styles/Dashboard.css";
import { FaUserTie, FaUsers, FaCalendarAlt, FaClipboardList, FaChartBar, FaTasks, FaBullhorn, FaBell } from "react-icons/fa";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const AdminDashboard = () => {
  const [admin] = useState({
    name: "Sherin",
    performanceScore: 95,
    reviewedStudents: "1000+",
    weeklyPerformance: [40, 80, 60, 70, 90],
    feedbackGiven: 150,
    mockInterviews: 5,
    pendingWorks: [
      { title: "Soft Skill Assessment", department: "CSE, ISE, EEE, ECE", due: "Tomorrow" },
      { title: "Mock Interview for TCS", department: "All Departments", due: "Feb 20" },
      { title: "Provide Feedback", department: "MECH, CSBS", due: "Feb 16" },
      { title: "Technical Assessment", department: "IT", due: "Feb 28" }
    ],
    placementDrives: [
      { company: "Mr. Cooper", date: "Dec 04, 2024", package: "12 LPA" },
      { company: "Presidio", date: "July 21, 2024", package: "13 LPA" },
      { company: "Soliton", date: "Aug 25, 2024", package: "14 LPA" }
    ],
    notifications: [
      { message: "Meeting tomorrow at 10 AM.", status: "New" },
      { message: "Submit semester reports this week.", status: "New" },
      { message: "New teaching guidelines available.", status: "New" }
    ],
  });

  // Weekly Performance Chart
  const weeklyPerformanceData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
    datasets: [
      {
        label: "Performance",
        data: admin.weeklyPerformance,
        backgroundColor: ["#FF5733", "#FFA500", "#1C3FAA", "#28A745", "#FFC300"],
      },
    ],
  };

  // Feedback & Interviews (Doughnut Chart)
  const feedbackData = {
    labels: ["Feedback Given", "Mock Interviews"],
    datasets: [
      {
        data: [admin.feedbackGiven, admin.mockInterviews],
        backgroundColor: ["#1C3FAA", "#FFA500"],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="admin-dashboard">
      {/* 🚀 Dashboard Header */}
      <section className="dashboard-header">
        <h1>📊 Admin Performance Dashboard</h1>
        <p>Monitor placements, student assessments, and faculty feedback in real-time.</p>
      </section>

      <div className="dashboard-grid">
        {/* 🏆 Top Performer of the Week */}
        <div className="performance-card">
          <h2>🏆 Top Performer of the Week</h2>
          <p>Faculty: {admin.name}</p>
          <p className="performance-score">Performance Score: <strong>{admin.performanceScore}%</strong></p>
          <div className="reviewed-count">🔍 Reviewed {admin.reviewedStudents} Students</div>
        </div>

        {/* 📅 Upcoming Placement Drives */}
        <div className="placement-card">
          <h2>📅 Upcoming Placement Drives</h2>
          {admin.placementDrives.map((drive, index) => (
            <div key={index} className="placement-item">
              <span>{drive.company}</span>
              <span>{drive.date}</span>
              <span className="package">{drive.package}</span>
            </div>
          ))}
        </div>

        {/* 📈 Weekly Performance Stats */}
        <div className="chart-card">
          <h2>📊 Weekly Performance Stats</h2>
          <Bar data={weeklyPerformanceData} />
        </div>

        {/* ✅ Pending Work */}
        <div className="pending-work-card">
          <h2>✅ Pending Work of the Day</h2>
          {admin.pendingWorks.map((task, index) => (
            <div key={index} className="pending-item">
              <FaTasks className="icon" />
              <div>
                <strong>{task.title}</strong>
                <p>{task.department} | Due: {task.due}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 🎤 Completed Mock Interviews */}
        <div className="completed-interviews-card">
          <h2>🎤 Completed Mock Interviews</h2>
          <ul>
            <li>Computer Science - Feedback Given</li>
            <li>Information Science - Pending Feedback</li>
            <li>Mechanical Engineering - Pending Feedback</li>
          </ul>
        </div>

        {/* 📩 Group Messages */}
        <div className="messages-card">
          <h2>📩 Group Messages on Placement Announcements</h2>
          <div className="message-item">
            <strong>Placement Officer - 10:30 AM</strong>
            <p>Infosys will be visiting on 25th September.</p>
          </div>
          <div className="message-item">
            <strong>Admin - 11:00 AM</strong>
            <p>Join the webinar on interview tips this Friday.</p>
          </div>
        </div>

        {/* 🔔 Faculty Notifications */}
        <div className="notifications-card">
          <h2>🔔 Faculty Notifications</h2>
          {admin.notifications.map((note, index) => (
            <p key={index} className="notification-item">{note.message}</p>
          ))}
        </div>

        {/* 📊 Today's Overview */}
        <div className="chart-card">
          <h2>📊 All About Today</h2>
          <Doughnut data={feedbackData} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
