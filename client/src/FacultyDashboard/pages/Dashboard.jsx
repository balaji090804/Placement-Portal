import React, { useState } from "react";
import Sidebar from "../components/FacultySidebar";
import "../styles/Dashboard.css";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
  // Manually entered JSON data for demonstration purposes
  const manualData = {
    totalStudents: 45,
    averagePerformance: "B+",
    upcomingLectures: 3,
    recentAssignments: [
      { id: 1, title: "Assignment 1", dueDate: "2025-03-01", status: "Graded" },
      { id: 2, title: "Assignment 2", dueDate: "2025-03-05", status: "Pending" }
    ],
    announcements: [
      { id: 1, title: "Exam Schedule", description: "Exams scheduled for next month." },
      { id: 2, title: "Guest Lecture", description: "Industry expert guest lecture on Friday." }
    ],
    classSchedule: [
      { id: 1, course: "Data Structures", time: "10:00 AM - 11:30 AM", day: "Monday" },
      { id: 2, course: "Algorithms", time: "2:00 PM - 3:30 PM", day: "Wednesday" }
    ],
    quickActions: [
      { id: 1, label: "Schedule Lecture", route: "/FacultyDashboard/ScheduleLecture" },
      { id: 2, label: "Post Announcement", route: "/FacultyDashboard/PostAnnouncement" },
      { id: 3, label: "Review Assignments", route: "/FacultyDashboard/ReviewAssignments" },
      { id: 4, label: "Manage Students", route: "/FacultyDashboard/ManageStudents" }
    ],
    facultyNews: [
      { id: 1, title: "New Research Grant Awarded", description: "Dr. Smith received a research grant for AI applications." },
      { id: 2, title: "Conference Participation", description: "Faculty members to attend the annual tech conference next month." }
    ]
  };

  const [dashboardData] = useState(manualData);

  return (
    <div className="faculty-dashboard">
    
     
      <div className="faculty-content">
        <h1>Faculty Dashboard</h1>

        {/* Metrics Section */}
        <section className="metrics-section">
          <div className="metrics-card">
            <h3>Total Students</h3>
            <p>{dashboardData.totalStudents}</p>
          </div>
          <div className="metrics-card">
            <h3>Average Performance</h3>
            <p>{dashboardData.averagePerformance}</p>
          </div>
          <div className="metrics-card">
            <h3>Upcoming Lectures</h3>
            <p>{dashboardData.upcomingLectures}</p>
          </div>
        </section>

        {/* Quick Actions Section */}
        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-container">
            {dashboardData.quickActions.map((action) => (
              <button 
                key={action.id} 
                className="action-btn"
                onClick={() => window.location.assign(action.route)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </section>

        {/* Recent Assignments Section */}
        <section className="details-section">
          <h2>Recent Assignments</h2>
          <div className="card-container">
            {dashboardData.recentAssignments.map((assignment) => (
              <div key={assignment.id} className="detail-card">
                <h3>{assignment.title}</h3>
                <p>Due Date: {assignment.dueDate}</p>
                <p>Status: {assignment.status}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Announcements Section */}
        <section className="details-section">
          <h2>Announcements</h2>
          <div className="card-container">
            {dashboardData.announcements.map((announcement) => (
              <div key={announcement.id} className="detail-card">
                <h3>{announcement.title}</h3>
                <p>{announcement.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Class Schedule Section */}
        <section className="details-section">
          <h2>Class Schedule</h2>
          <div className="card-container">
            {dashboardData.classSchedule.map((schedule) => (
              <div key={schedule.id} className="detail-card">
                <h3>{schedule.course}</h3>
                <p>{schedule.day}</p>
                <p>{schedule.time}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Faculty News Section */}
        <section className="details-section">
          <h2>Faculty News</h2>
          <div className="card-container">
            {dashboardData.facultyNews.map((news) => (
              <div key={news.id} className="detail-card">
                <h3>{news.title}</h3>
                <p>{news.description}</p>
              </div>
            ))}
          </div>
        </section>

        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
