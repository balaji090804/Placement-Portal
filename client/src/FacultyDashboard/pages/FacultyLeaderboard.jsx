import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/FacultyLeaderboard.css";
import {
  FaChartBar,
  FaTrophy,
  FaUsers,
  FaClipboardCheck,
  FaMedal,
} from "react-icons/fa";

const FacultyLeaderboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchLeaderboard();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:8080/api/leaderboard/analytics",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Set default empty analytics if error occurs
      setAnalytics({
        totalSubmissions: 0,
        uniqueStudents: 0,
        averageScore: 0,
        averagePercentage: 0,
        scoreDistribution: [],
        topPerformers: [],
        recentActivity: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/leaderboard/overall?limit=100"
      );
      setLeaderboard(response.data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <FaTrophy className="rank-icon gold" />;
      case 2:
        return <FaMedal className="rank-icon silver" />;
      case 3:
        return <FaMedal className="rank-icon bronze" />;
      default:
        return <span className="rank-number">{rank}</span>;
    }
  };

  const getScoreDistributionColor = (range) => {
    if (!range) return "#6b7280";
    if (range.includes("80-100")) return "#10b981";
    if (range.includes("60-80")) return "#3b82f6";
    if (range.includes("40-60")) return "#f59e0b";
    if (range.includes("20-40")) return "#ef4444";
    return "#6b7280";
  };

  if (loading) {
    return (
      <div className="faculty-leaderboard">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="faculty-leaderboard">
      {/* Hero Section */}
      <section className="faculty-hero">
        <div className="hero-icon">
          <FaChartBar size={48} />
        </div>
        <h1>Assessment Analytics Dashboard</h1>
        <p>Track student performance and engagement</p>
      </section>

      {/* Overview Stats */}
      {analytics && (
        <section className="analytics-overview">
          <div className="stat-card">
            <div className="stat-icon purple">
              <FaClipboardCheck />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {analytics.totalSubmissions || 0}
              </div>
              <div className="stat-label">Total Submissions</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">
              <FaUsers />
            </div>
            <div className="stat-content">
              <div className="stat-value">{analytics.uniqueStudents || 0}</div>
              <div className="stat-label">Unique Students</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <FaTrophy />
            </div>
            <div className="stat-content">
              <div className="stat-value">{analytics.averageScore || 0}</div>
              <div className="stat-label">Average Score</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <FaChartBar />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {analytics.averagePercentage
                  ? Number(analytics.averagePercentage).toFixed(1)
                  : 0}
                %
              </div>
              <div className="stat-label">Average Percentage</div>
            </div>
          </div>
        </section>
      )}

      {/* Score Distribution */}
      {analytics &&
        analytics.scoreDistribution &&
        analytics.scoreDistribution.length > 0 && (
          <section className="score-distribution-section">
            <h2>Score Distribution</h2>
            <div className="distribution-chart">
              {analytics.scoreDistribution.map((bucket, idx) => {
                const maxCount = Math.max(
                  ...analytics.scoreDistribution.map((b) => b.count || 0)
                );
                const heightPercent =
                  maxCount > 0 ? ((bucket.count || 0) / maxCount) * 100 : 0;

                return (
                  <div key={idx} className="distribution-bar">
                    <div className="bar-wrapper">
                      <div
                        className="bar-fill"
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor: getScoreDistributionColor(
                            bucket.range
                          ),
                        }}
                      >
                        <span className="bar-count">{bucket.count || 0}</span>
                      </div>
                    </div>
                    <div className="bar-label">{bucket.range || "Unknown"}</div>
                  </div>
                );
              })}
            </div>
            <p className="distribution-note">
              Number of students in each percentage range
            </p>
          </section>
        )}

      {/* Top Performers */}
      {analytics &&
        analytics.topPerformers &&
        analytics.topPerformers.length > 0 && (
          <section className="top-performers-section">
            <h2>
              <FaMedal /> Top Performers
            </h2>
            <div className="top-performers-grid">
              {analytics.topPerformers.map((student, idx) => (
                <div key={idx} className={`performer-card rank-${idx + 1}`}>
                  <div className="performer-rank">{getRankIcon(idx + 1)}</div>
                  <div className="performer-info">
                    <div className="performer-name">{student.studentName}</div>
                    <div className="performer-score">
                      {student.bestScore}/{student.totalQuestions} (
                      {Number(student.bestPercentage).toFixed(1)}%)
                    </div>
                    <div className="performer-attempts">
                      {student.attempts} attempt
                      {student.attempts !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      {/* Recent Activity */}
      {analytics &&
        analytics.recentActivity &&
        analytics.recentActivity.length > 0 && (
          <section className="recent-activity-section">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              {analytics.recentActivity.map((activity, idx) => (
                <div key={idx} className="activity-item">
                  <div className="activity-student">
                    <div className="activity-name">{activity.studentName}</div>
                    <div className="activity-date">
                      {new Date(activity.submittedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="activity-score">
                    <div className="score-value">
                      {activity.score}/{activity.totalQuestions}
                    </div>
                    <div
                      className={`score-badge ${
                        activity.percentage >= 80
                          ? "excellent"
                          : activity.percentage >= 60
                          ? "good"
                          : activity.percentage >= 40
                          ? "average"
                          : "needs-improvement"
                      }`}
                    >
                      {Number(activity.percentage).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      {/* Full Leaderboard */}
      <section className="full-leaderboard-section">
        <h2>Complete Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <div className="empty-state">
            <p>No submissions yet</p>
          </div>
        ) : (
          <div className="leaderboard-table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Best Score</th>
                  <th>Percentage</th>
                  <th>Attempts</th>
                  <th>Last Attempt</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.studentEmail}>
                    <td className="rank-cell">{getRankIcon(entry.rank)}</td>
                    <td className="name-cell">{entry.studentName}</td>
                    <td className="email-cell">{entry.studentEmail}</td>
                    <td className="score-cell">
                      <strong>{entry.bestScore}</strong>/{entry.totalQuestions}
                    </td>
                    <td className="percentage-cell">
                      <div
                        className="percentage-bar"
                        style={{ "--percentage": `${entry.bestPercentage}%` }}
                      >
                        <span>{Number(entry.bestPercentage).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="attempts-cell">{entry.attempts}</td>
                    <td className="date-cell">
                      {new Date(entry.lastAttempt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default FacultyLeaderboard;
