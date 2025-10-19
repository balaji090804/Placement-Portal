import React from "react";
import "../styles/PerformanceAnalytics.css";
import { FaBuilding, FaUserTie, FaChartLine } from "react-icons/fa";

const PerformanceAnalytics = () => {
  // Static Data for UI
  const mockTestScores = {
    aptitude: 80,
    coding: 75,
    communication: 85,
    technical: 90
  };

  const codingChallengesSolved = 20;
  const interviewScores = 88;

  const pastInterviews = [
    {
      companyName: "Google",
      interviewDate: "2024-01-15",
      technicalScore: 85,
      hrScore: 80,
      overallPerformance: "Good"
    },
    {
      companyName: "Amazon",
      interviewDate: "2024-02-10",
      technicalScore: 78,
      hrScore: 85,
      overallPerformance: "Satisfactory"
    }
  ];

  const mockInterviews = [
    {
      date: "2024-01-05",
      technicalScore: 80,
      hrScore: 75,
      feedback: "Needs improvement in system design."
    },
    {
      date: "2024-02-02",
      technicalScore: 85,
      hrScore: 80,
      feedback: "Good confidence, but work on problem-solving speed."
    }
  ];

  const improvementAreas = ["System Design", "Problem Solving Speed", "Communication Clarity"];

  return (
    <div className="performance-page">
      <h1>📊 Performance Analytics</h1>

      {/* Test Scores */}
      <section className="test-scores">
        <h2>📝 Test Scores</h2>
        <div className="test-score-grid">
          <div className="score-card">Aptitude: {mockTestScores.aptitude} / 100</div>
          <div className="score-card">Coding: {mockTestScores.coding} / 100</div>
          <div className="score-card">Communication: {mockTestScores.communication} / 100</div>
          <div className="score-card">Technical: {mockTestScores.technical} / 100</div>
        </div>
      </section>

      {/* Past Company Interviews */}
      <section className="past-interviews">
        <h2><FaBuilding /> Past Company Interviews</h2>
        <div className="data-container">
          {pastInterviews.map((interview, index) => (
            <div key={index} className="data-card">
              <strong>{interview.companyName} - {new Date(interview.interviewDate).toLocaleDateString()}</strong>
              <p>Technical: {interview.technicalScore} / 100 | HR: {interview.hrScore} / 100</p>
              <p>Overall: {interview.overallPerformance}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mock Interviews */}
      <section className="mock-interviews">
        <h2><FaUserTie /> Mock Interviews</h2>
        <div className="data-container">
          {mockInterviews.map((mock, index) => (
            <div key={index} className="data-card">
              <strong>Date: {new Date(mock.date).toLocaleDateString()}</strong>
              <p>Technical: {mock.technicalScore} / 100 | HR: {mock.hrScore} / 100</p>
              <p>Feedback: {mock.feedback}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Suggested Improvement Areas */}
      <section className="improvement-areas">
        <h2><FaChartLine /> Areas to Improve</h2>
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
