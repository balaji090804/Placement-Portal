import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PracticeHero.css";
import MockTests from "../components/MockTests";
const PracticeHero = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    // Simulating student performance data (Replace with API call)
    setStudents([
      { name: "John Doe", aptitude: 85, coding: 90, communication: 80, technical: 95 },
      { name: "Jane Smith", aptitude: 88, coding: 85, communication: 75, technical: 80 },
      { name: "Alice Brown", aptitude: 78, coding: 88, communication: 85, technical: 90 },
    ]);
  }, []);

  return (
    <div className="practice-page">
      {/* 🚀 Page Header */}
      <section className="practice-header">
        <h1>🚀 Placement Practice Hub</h1>
        <p>
          Prepare for **Aptitude**, **Coding**, **Communication**, and **Technical** rounds with
          **real-world assessments** to excel in your job interviews!
        </p>
      </section>

      {/* 📊 Leaderboard Section */}
      <section className="leaderboard">
        <h2>📈 Student Leaderboard</h2>
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Aptitude</th>
              <th>Coding</th>
              <th>Communication</th>
              <th>Technical</th>
              <th>Overall %</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => {
              const overall =
                (student.aptitude + student.coding + student.communication + student.technical) / 4;
              return (
                <tr key={index}>
                  <td>{student.name}</td>
                  <td>{student.aptitude}%</td>
                  <td>{student.coding}%</td>
                  <td>{student.communication}%</td>
                  <td>{student.technical}%</td>
                  <td>{overall.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* 📝 Practice Tests Section */}
      <section className="practice-tests">
        <div className="practice-card" onClick={() => navigate("/aptitude-test")}>
          <h3>Aptitude Test</h3>
          <button className="practice-btn">Start Test</button>
        </div>
        <div className="practice-card" onClick={() => navigate("/coding-test")}>
          <h3>Coding Test</h3>
          <button className="practice-btn">Start Test</button>
        </div>
        <div className="practice-card" onClick={() => navigate("/communication-test")}>
          <h3>Communication Skills</h3>
          <button className="practice-btn">Start Test</button>
        </div>
        <div className="practice-card" onClick={() => navigate("/technical-test")}>
          <h3>Technical MCQs</h3>
          <button className="practice-btn">Start Test</button>
        </div>
      </section>

      {/* 💡 Motivational Section */}
      <section className="motivation">
        <h2>💡 Stay Inspired</h2>
        <p>“Your only limit is your mind. Keep pushing forward.”</p>
      </section>
      <MockTests />
    </div>
  );
};

export default PracticeHero;
