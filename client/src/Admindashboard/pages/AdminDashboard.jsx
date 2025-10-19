import React, { useState } from "react";
import "../styles/AdminDashboard.css";
import {
  FaChartBar,
  FaRocket,
  FaBriefcase,
  FaGraduationCap,
  FaBuilding,
  FaMoneyBillWave,
  FaBullhorn,
} from "react-icons/fa";

const AdminDashboard = () => {
  const [dashboardData] = useState({
    totalPlacements: 120,
    upcomingDrives: 8,
    totalJobs: 24,
    placements: [
      { id: 1, studentName: "Rohan Sharma", company: "Google", package: "₹20 LPA" },
      { id: 2, studentName: "Priya Singh", company: "Amazon", package: "₹18 LPA" },
      { id: 3, studentName: "Aryan Gupta", company: "Microsoft", package: "₹22 LPA" },
    ],
    jobListings: [
      { id: 1, company: "Google", jobTitle: "Software Engineer", status: "Upcoming" },
      { id: 2, company: "Amazon", jobTitle: "DevOps Engineer", status: "Ongoing" },
      { id: 3, company: "Microsoft", jobTitle: "Data Scientist", status: "Upcoming" },
    ],
    topPerformers: [
      { id: 1, name: "Sneha Malhotra", score: 98 },
      { id: 2, name: "Rahul Verma", score: 95 },
      { id: 3, name: "Kavya Patel", score: 94 },
    ],
    announcements: [
      { id: 1, title: "🚀 New Placement Drive", description: "Google and Microsoft are hiring! Apply now!" },
      { id: 2, title: "📢 System Upgrade", description: "Improved dashboard analytics now available." },
      { id: 3, title: "🎯 Mock Interviews", description: "AI-based interview sessions now open for registration." },
    ],
  });

  return (
    <div className="admin-dashboard-container">
      <header className="admin-dashboard-header">
        <h1><FaChartBar className="admin-header-icon" /> Admin Dashboard</h1>
      </header>

      <main className="admin-dashboard-content">
        {/* Metric Cards */}
        <section className="admin-metrics">
          <div className="admin-metric-card">
            <FaGraduationCap className="admin-metric-icon" />
            <h3>Total Placements</h3>
            <p>{dashboardData.totalPlacements}</p>
          </div>
          <div className="admin-metric-card">
            <FaRocket className="admin-metric-icon" />
            <h3>Upcoming Drives</h3>
            <p>{dashboardData.upcomingDrives}</p>
          </div>
          <div className="admin-metric-card">
            <FaBriefcase className="admin-metric-icon" />
            <h3>Total Jobs</h3>
            <p>{dashboardData.totalJobs}</p>
          </div>
        </section>

        {/* Sections */}
        {[
          { title: "Recent Placements", data: dashboardData.placements, render: (p) => (
            <>
              <h3>{p.studentName}</h3>
              <p><FaBuilding /> {p.company}</p>
              <p><FaMoneyBillWave /> {p.package}</p>
            </>
          )},
          { title: "Open Positions", data: dashboardData.jobListings, render: (j) => (
            <>
              <h3>{j.company}</h3>
              <p>🛠 {j.jobTitle}</p>
              <p>📅 {j.status}</p>
            </>
          )},
          { title: "Top Performers", data: dashboardData.topPerformers, render: (s) => (
            <>
              <h3>{s.name}</h3>
              <p>🔥 Score: {s.score}</p>
            </>
          )},
          { title: "Announcements", data: dashboardData.announcements, render: (a) => (
            <>
              <h3>{a.title}</h3>
              <p>{a.description}</p>
            </>
          )}
        ].map((section, idx) => (
          <section className="admin-section" key={idx}>
            <h2>{section.title}</h2>
            <div className="admin-card-grid">
              {section.data.map((item, index) => (
                <div className="admin-card" key={index}>
                  {section.render(item)}
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

export default AdminDashboard;
