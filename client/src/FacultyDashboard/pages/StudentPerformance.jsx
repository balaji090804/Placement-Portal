import React, { useState } from "react";
import PerformanceTracker from "../../StudentDashboard/pages/Performancetracker.jsx";
import "../../shared/PerfEmbed.css";

const StudentPerformance = () => {
  const [emailInput, setEmailInput] = useState("");
  const [activeEmail, setActiveEmail] = useState("");
  const [error, setError] = useState("");

  const handleLoad = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) {
      setError("Enter a student email");
      return;
    }
    setError("");
    setActiveEmail(trimmed);
  };

  return (
    <div className="perf-admin-container">
      <div className="perf-search card">
        <h1 className="title">Student Performance</h1>
        <p className="muted">
          Enter a student email to view live performance tracker.
        </p>
        <div className="row">
          <input
            type="email"
            placeholder="student@example.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
          <button className="btn" onClick={handleLoad}>
            Load Performance
          </button>
        </div>
        {error && (
          <p className="error" style={{ color: "#b00020" }}>
            {error}
          </p>
        )}
      </div>
      {activeEmail && (
        <div className="perf-tracker-wrapper card">
          <PerformanceTracker email={activeEmail} />
        </div>
      )}
    </div>
  );
};

export default StudentPerformance;
