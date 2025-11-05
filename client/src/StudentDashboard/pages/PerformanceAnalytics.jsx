import React, { useEffect, useMemo, useState } from "react";
import "../styles/PerformanceAnalytics.css";
import { FaBuilding, FaUserTie, FaChartLine } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const EVENT_SERIES = [
  { key: "jobApplied", label: "Jobs Applied", color: "#3b82f6" },
  {
    key: "dailyCodeSubmitted",
    label: "Daily Code Submitted",
    color: "#10b981",
  },
  { key: "practiceStarted", label: "Practice Started", color: "#f59e0b" },
  { key: "taskCompleted", label: "Tasks Completed", color: "#8b5cf6" },
  { key: "driveRegistered", label: "Drive Registrations", color: "#ef4444" },
  {
    key: "announcementsViewed",
    label: "Announcements Viewed",
    color: "#06b6d4",
  },
];

const PerformanceAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const email = localStorage.getItem("studentEmail") || "";
        if (!email) {
          setError("No student email set");
          setLoading(false);
          return;
        }
        const [res, sumRes] = await Promise.all([
          fetch(
            `http://localhost:8080/api/performance/${encodeURIComponent(email)}`
          ),
          fetch(
            `http://localhost:8080/api/performance/${encodeURIComponent(
              email
            )}/events/summary?months=12`
          ),
        ]);
        const json = await res.json();
        const sum = sumRes.ok ? await sumRes.json() : null;
        if (!cancelled) {
          setData(json);
          setSummary(sum);
        }
      } catch (e) {
        if (!cancelled) setError("Failed to load performance");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = useMemo(() => {
    const labels = summary?.labels || months;
    const series = summary?.series || {};
    return {
      labels,
      datasets: EVENT_SERIES.map((s) => ({
        label: s.label,
        backgroundColor: s.color,
        data: series[s.key] || Array(labels.length).fill(0),
      })),
    };
  }, [summary]);

  const mockTestScores = data?.mockTestScores || {
    aptitude: 0,
    coding: 0,
    communication: 0,
    technical: 0,
  };
  const codingChallengesSolved = data?.codingChallengesSolved || 0;
  const interviewScores = data?.interviewScores || 0;
  const pastInterviews = data?.pastInterviews || [];
  const mockInterviews = data?.mockInterviews || [];
  const improvementAreas = data?.improvementAreas || [];

  return (
    <div className="performance-page">
      <h1>📊 Performance Analytics</h1>

      {/* Test Scores */}
      <section className="test-scores">
        <h2>📝 Test Scores</h2>
        <div className="test-score-grid">
          <div className="score-card">
            Aptitude: {mockTestScores.aptitude} / 100
          </div>
          <div className="score-card">
            Coding: {mockTestScores.coding} / 100
          </div>
          <div className="score-card">
            Communication: {mockTestScores.communication} / 100
          </div>
          <div className="score-card">
            Technical: {mockTestScores.technical} / 100
          </div>
        </div>
      </section>

      {/* Monthly Activity Chart */}
      <section className="activity-chart">
        <h2>📈 Activity Overview</h2>
        {loading ? (
          <p>Loading chart…</p>
        ) : error ? (
          <p style={{ color: "#b00020" }}>{error}</p>
        ) : (
          <Bar
            data={chartData}
            options={{
              responsive: true,
              plugins: { legend: { position: "bottom" } },
            }}
          />
        )}
      </section>

      {/* Past Company Interviews */}
      <section className="past-interviews">
        <h2>
          <FaBuilding /> Past Company Interviews
        </h2>
        <div className="data-container">
          {pastInterviews.map((interview, index) => (
            <div key={index} className="data-card">
              <strong>
                {interview.companyName} -{" "}
                {new Date(interview.interviewDate).toLocaleDateString()}
              </strong>
              <p>
                Technical: {interview.technicalScore} / 100 | HR:{" "}
                {interview.hrScore} / 100
              </p>
              <p>Overall: {interview.overallPerformance}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mock Interviews */}
      <section className="mock-interviews">
        <h2>
          <FaUserTie /> Mock Interviews
        </h2>
        <div className="data-container">
          {mockInterviews.map((mock, index) => (
            <div key={index} className="data-card">
              <strong>Date: {new Date(mock.date).toLocaleDateString()}</strong>
              <p>
                Technical: {mock.technicalScore} / 100 | HR: {mock.hrScore} /
                100
              </p>
              <p>Feedback: {mock.feedback}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Suggested Improvement Areas */}
      <section className="improvement-areas">
        <h2>
          <FaChartLine /> Areas to Improve
        </h2>
        <ul className="improvement-list">
          {improvementAreas.map((area, index) => (
            <li key={index}>{area}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default PerformanceAnalytics;
