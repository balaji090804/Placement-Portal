import React, { useEffect, useState } from "react";
import Sidebar from "../components/FacultySidebar";
import "../styles/Dashboard.css";
import { Outlet } from "react-router-dom";
import { fetchUserData } from "../../api";
import { onEvent } from "../../lib/socket";

const Dashboard = () => {
  // Local UI-only data that isn't part of the real-time API
  const staticUiData = {
    classSchedule: [
      {
        id: 1,
        course: "Data Structures",
        time: "10:00 AM - 11:30 AM",
        day: "Monday",
      },
      {
        id: 2,
        course: "Algorithms",
        time: "2:00 PM - 3:30 PM",
        day: "Wednesday",
      },
    ],
    quickActions: [
      {
        id: 1,
        label: "Schedule Lecture",
        route: "/FacultyDashboard/ScheduleLecture",
      },
      {
        id: 2,
        label: "Post Announcement",
        route: "/FacultyDashboard/PostAnnouncement",
      },
      {
        id: 3,
        label: "Review Assignments",
        route: "/FacultyDashboard/ReviewAssignments",
      },
      {
        id: 4,
        label: "Manage Students",
        route: "/FacultyDashboard/ManageStudents",
      },
    ],
    facultyNews: [
      {
        id: 1,
        title: "New Research Grant Awarded",
        description: "Dr. Smith received a research grant for AI applications.",
      },
      {
        id: 2,
        title: "Conference Participation",
        description:
          "Faculty members to attend the annual tech conference next month.",
      },
    ],
  };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let intervalId;

    const fetchDashboard = async () => {
      try {
        setError("");
        // Get logged-in user to know the faculty email
        const me = await fetchUserData();
        const facultyEmail = me?.email || "";
        if (!facultyEmail) {
          setError("Unable to determine faculty email. Please log in again.");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `http://localhost:8080/api/faculty-dashboard?facultyEmail=${encodeURIComponent(
            facultyEmail
          )}`
        );
        if (!res.ok) {
          throw new Error(`Failed to load dashboard (${res.status})`);
        }
        const json = await res.json();
        setData(json);
        setLoading(false);
      } catch (e) {
        console.error("Failed to fetch faculty dashboard:", e);
        setError(e.message || "Failed to load dashboard");
        setLoading(false);
      }
    };

    const unsubscribe = onEvent("dashboard:update", () => {
      fetchDashboard();
    });
    fetchDashboard();
    // Poll every 60s for near real-time updates
    intervalId = setInterval(fetchDashboard, 60000);

    return () => {
      clearInterval(intervalId);
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  return (
    <div className="faculty-dashboard">
      <div className="faculty-content">
        <h1>Faculty Dashboard</h1>

        {loading && <p>Loading dashboard...</p>}
        {!!error && !loading && <p style={{ color: "#b00020" }}>{error}</p>}

        {/* Metrics Section */}
        <section className="metrics-section">
          <div className="metrics-card">
            <h3>Total Students</h3>
            <p>{data?.totalStudents ?? "-"}</p>
          </div>
          <div className="metrics-card">
            <h3>Average Interview Score</h3>
            <p>
              {typeof data?.averageInterviewScore === "number"
                ? data.averageInterviewScore.toFixed(1)
                : "-"}
            </p>
          </div>
          <div className="metrics-card">
            <h3>Upcoming Lectures</h3>
            <p>{data?.upcomingLectures ?? "-"}</p>
          </div>
        </section>

        {/* Quick Actions Section */}
        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-container">
            {staticUiData.quickActions.map((action) => (
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
            {(data?.recentAssignments || []).map((assignment, idx) => {
              const assignedAt = assignment?.assignedAt
                ? new Date(assignment.assignedAt).toLocaleString()
                : "-";
              return (
                <div key={assignment._id || idx} className="detail-card">
                  <h3>Assignment</h3>
                  <p>Student: {assignment.studentEmail}</p>
                  <p>Assigned: {assignedAt}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Announcements Section */}
        <section className="details-section">
          <h2>Announcements</h2>
          <div className="card-container">
            {(data?.announcements || []).map((announcement, idx) => {
              const title = `${announcement.companyName} - ${announcement.jobRole}`;
              const when = announcement?.dateTime
                ? new Date(announcement.dateTime).toLocaleString()
                : "-";
              return (
                <div key={announcement._id || idx} className="detail-card">
                  <h3>{title}</h3>
                  <p>{when}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Class Schedule Section */}
        <section className="details-section">
          <h2>Class Schedule</h2>
          <div className="card-container">
            {staticUiData.classSchedule.map((schedule) => (
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
            {staticUiData.facultyNews.map((news) => (
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
