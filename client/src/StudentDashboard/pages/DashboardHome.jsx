import React, { useEffect, useState, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import "../styles/DashboardHome.css";
import Chatbot from "../components/Chatbot";
import { onEvent } from "../../lib/socket";

const StudentHome = () => {
  const { studentName, studentEmail } = useOutletContext();
  const navigate = useNavigate();

  const [perf, setPerf] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [daily, setDaily] = useState(null);
  const [studentMetrics, setStudentMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const intervalRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!cancelled) {
          setLoading(true);
          setError("");
        }

        const [pRes, aRes, dRes, sRes] = await Promise.all([
          fetch(
            `http://localhost:8080/api/performance/${encodeURIComponent(
              studentEmail
            )}`
          ),
          fetch("http://localhost:8080/api/announcements/upcoming"),
          fetch("http://localhost:8080/api/daily/leetcode"),
          fetch(
            `http://localhost:8080/api/student-dashboard?studentEmail=${encodeURIComponent(
              studentEmail
            )}`
          ),
        ]);

        if (!cancelled) {
          if (pRes.ok) setPerf(await pRes.json());
          if (aRes.ok) setUpcoming((await aRes.json()).slice(0, 5));
          if (dRes.ok) setDaily(await dRes.json());
          if (sRes.ok) setStudentMetrics(await sRes.json());
          setLastUpdated(new Date());
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    let off;
    if (studentEmail) {
      load();
      // Real-time-ish polling every 60s
      intervalRef.current = setInterval(load, 60000);
      // Subscribe to realtime dashboard updates
      off = onEvent("dashboard:update", (payload) => {
        if (
          payload?.scope === "student" &&
          payload?.email?.toLowerCase() === studentEmail.toLowerCase()
        ) {
          load();
        }
      });
    }

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (typeof off === "function") off();
    };
  }, [studentEmail]);

  const score = perf?.interviewScores;
  const mock = perf?.mockTestScores || {};

  return (
    <div className="sdash">
      <header className="sdash-header card">
        <div>
          <h1>Welcome back, {studentName || "Student"}</h1>
          <p>Your personalized placement hub</p>
          {lastUpdated && (
            <p className="muted small">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="header-actions">
          <button
            onClick={() => navigate("/StudentDashboard/Practice")}
            className="btn btn-primary"
          >
            Practice
          </button>
          <button
            onClick={() => navigate("/StudentDashboard/DailyCoding")}
            className="btn"
          >
            Daily Coding
          </button>
          {/* Interview Prep button removed per request */}
        </div>
      </header>

      {!!error && <p className="error">{error}</p>}

      <section className="metrics">
        {[
          { label: "Aptitude", val: mock.aptitude },
          { label: "Coding", val: mock.coding },
          { label: "Communication", val: mock.communication },
          { label: "Technical", val: mock.technical },
          { label: "Interview Score", val: score },
        ].map((m, idx) => (
          <div className="metric" key={idx}>
            <h3>{m.label}</h3>
            <div className="progress">
              <div
                className="bar"
                style={{
                  width:
                    typeof m.val === "number"
                      ? `${Math.max(0, Math.min(100, m.val))}%`
                      : 0,
                }}
              />
            </div>
            <p
              className={`value ${
                m.label === "Interview Score" ? "highlight" : ""
              }`}
            >
              {typeof m.val === "number" ? m.val : "-"}
            </p>
          </div>
        ))}
      </section>

      <section className="grid">
        {studentMetrics && (
          <div className="card">
            <div className="card-header">
              <h2>Your Activity</h2>
            </div>
            <ul className="list">
              <li className="list-item">
                <strong>Tasks</strong>
                <span className="muted">
                  {studentMetrics.tasks.completed}/{studentMetrics.tasks.total}
                </span>
              </li>
              <li className="list-item">
                <strong>Applications</strong>
                <span className="muted">{studentMetrics.applications}</span>
              </li>
              <li className="list-item">
                <strong>Upcoming Announcements</strong>
                <span className="muted">
                  {studentMetrics.upcomingAnnouncements}
                </span>
              </li>
            </ul>
          </div>
        )}
        <div className="card wide">
          <div className="card-header">
            <h2>Today’s Challenge</h2>
            <div>
              <button
                className="btn small"
                onClick={() => navigate("/StudentDashboard/DailyCoding")}
              >
                Open
              </button>
              {daily?.link && (
                <button
                  className="btn small"
                  onClick={() =>
                    window.open(daily.link, "_blank", "noopener,noreferrer")
                  }
                >
                  LeetCode
                </button>
              )}
            </div>
          </div>
          {loading ? (
            <p>Loading…</p>
          ) : daily ? (
            <div
              className={`daily ${String(
                daily.difficulty || ""
              ).toLowerCase()}`}
            >
              <h3>{daily.title}</h3>
              <p>
                <strong>Difficulty:</strong> {daily.difficulty} •{" "}
                <strong>Date:</strong> {daily.date}
              </p>
            </div>
          ) : (
            <p>No daily challenge available right now.</p>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Upcoming Drives</h2>
            <button
              className="btn small"
              onClick={() => navigate("/StudentDashboard/UpcomingDrive")}
            >
              View all
            </button>
          </div>
          <ul className="list">
            {loading ? (
              <li>Loading…</li>
            ) : upcoming.length ? (
              upcoming.map((a) => (
                <li key={a._id} className="list-item">
                  <div>
                    <strong>{a.companyName}</strong>
                    <div className="muted">{a.jobRole}</div>
                  </div>
                  <div className="muted">
                    {new Date(a.dateTime).toLocaleString()}
                  </div>
                </li>
              ))
            ) : (
              <li>No upcoming drives found.</li>
            )}
          </ul>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Quick Links</h2>
          </div>
          <div className="actions">
            <button
              className="chip"
              onClick={() => navigate("/StudentDashboard/Practice")}
            >
              Practice Hub
            </button>
            <button
              className="chip"
              onClick={() => navigate("/StudentDashboard/Aptitude")}
            >
              Faculty Aptitude
            </button>
            {/* Interview Prep quick-link removed per request */}
            <button
              className="chip"
              onClick={() => navigate("/StudentDashboard/ResumeBuilder")}
            >
              Resume Builder
            </button>
            <button
              className="chip"
              onClick={() => navigate("/StudentDashboard/PerformanceAnalytics")}
            >
              Performance
            </button>
          </div>
        </div>
      </section>

      {/* Floating Chatbot */}
      <Chatbot studentName={studentName} studentEmail={studentEmail} />
    </div>
  );
};

export default StudentHome;
