import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import "../styles/Leaderboard.css";
import { FaTrophy, FaMedal, FaAward, FaChartLine } from "react-icons/fa"; // TODO: Consider replacing with lucide-react for consistency

const Leaderboard = () => {
  const { studentEmail, studentName } = useOutletContext();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    if (studentEmail) {
      fetchMyStats();
    }
  }, [studentEmail]);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/leaderboard/overall?limit=50"
      );
      setLeaderboard(response.data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:8080/api/leaderboard/mystats",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMyStats(response.data);
    } catch (error) {
      console.error("Error fetching my stats:", error);
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

  const getRankClass = (rank) => {
    if (rank === 1) return "rank-1";
    if (rank === 2) return "rank-2";
    if (rank === 3) return "rank-3";
    return "";
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="loading">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <section className="leaderboard-hero">
        <h1 className="leaderboard-title">Practice Assessment Leaderboard</h1>
        <p className="leaderboard-subtitle">
          Track performance across all assessments
        </p>
      </section>

      {/* My Stats Card */}
      {myStats && myStats.totalAttempts > 0 && (
        <section className="my-stats-card">
          <h2 className="section-heading">Your Performance</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{myStats.rank || "—"}</div>
              <div className="stat-label">Your Rank</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{myStats.bestScore}</div>
              <div className="stat-label">Best Score</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{myStats.averageScore}</div>
              <div className="stat-label">Average Score</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{myStats.totalAttempts}</div>
              <div className="stat-label">Total Attempts</div>
            </div>
          </div>

          {myStats.recentSubmissions && myStats.recentSubmissions.length > 0 && (
            <div className="recent-attempts">
              <h3 className="sub-heading">Recent Attempts</h3>
              <div className="attempts-list">
                {myStats.recentSubmissions
                  .slice(0, 3)
                  .map((submission, idx) => (
                    <div key={idx} className="attempt-item">
                      <div className="attempt-score">
                        {submission.score}/{submission.totalQuestions}
                      </div>
                      <div className="attempt-info">
                        <div className="attempt-percentage">
                          {submission.percentage.toFixed(1)}%
                        </div>
                        <div className="attempt-date">
                          {new Date(
                            submission.submittedAt
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Leaderboard Table */}
      <section className="leaderboard-section">
        <h2 className="section-heading">Top Performers</h2>
        {leaderboard.length === 0 ? (
          <div className="empty-state">
            <p>No submissions yet. Be the first to take an assessment.</p>
          </div>
        ) : (
          <div className="leaderboard-table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>Best Score</th>
                  <th>Percentage</th>
                  <th>Attempts</th>
                  <th>Last Attempt</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr
                    key={entry.studentEmail}
                    className={`
                      ${getRankClass(entry.rank)}
                      ${
                        entry.studentEmail === studentEmail
                          ? "highlight-me"
                          : ""
                      }
                    `}
                  >
                    <td className="rank-cell">{getRankIcon(entry.rank)}</td>
                    <td className="student-cell">
                      <div className="student-name">{entry.studentName}</div>
                      {entry.studentEmail === studentEmail && (
                        <div className="you-badge" aria-label="Current user">
                          You
                        </div>
                      )}
                    </td>
                    <td className="score-cell">
                      <strong>{entry.bestScore}</strong>/{entry.totalQuestions}
                    </td>
                    <td className="percentage-cell">
                      <div
                        className="percentage-bar"
                        style={{
                          "--percentage": `${entry.bestPercentage}%`,
                        }}
                      >
                        <span>{entry.bestPercentage.toFixed(1)}%</span>
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

export default Leaderboard;
