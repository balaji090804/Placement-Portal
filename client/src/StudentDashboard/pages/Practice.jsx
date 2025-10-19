import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Practice.css";

const Practice = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch leaderboard data (Top 5 students)
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/leaderboard");
        const data = await response.json();
        setLeaderboard(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const practiceTests = [
    { title: "Aptitude Test", desc: "Sharpen your logical reasoning skills.", link: "/StudentDashboard/Aptitude" },
    { title: "Coding Test", desc: "Test your coding and problem-solving abilities.", link: "/coding-test" },
    { title: "Communication Skills", desc: "Improve verbal and written communication.", link: "/communication-test" },
    { title: "Technical MCQs", desc: "Evaluate your fundamental technical knowledge.", link: "/technical-test" },
    { title: "Data Structures & Algorithms", desc: "Strengthen your DSA skills.", link: "/dsa-test" },
    { title: "Database Management", desc: "Assess your SQL and DBMS knowledge.", link: "/dbms-test" },
    { title: "Operating Systems", desc: "Test your OS concepts and problem-solving.", link: "/os-test" },
    { title: "Networking Basics", desc: "Evaluate your knowledge of computer networks.", link: "/networking-test" },
  ];

  return (
    <div className="practice-page">
      {/* 🚀 Page Header */}
      <section className="practice-header">
        <div className="header-overlay">
          <h2>🚀 Placement Preparation Hub</h2>
        </div>
      </section>

      {/* 📝 Practice Tests Section */}
      <section className="practice-tests">
        <h2>📑 Practice Tests</h2>
        <div className="practice-test-grid">
          {practiceTests.map((test, index) => (
            <div key={index} className="practice-card" onClick={() => navigate(test.link)}>
              <h3>{test.title}</h3>
              <p>{test.desc}</p>
              <button className="practice-btn">Start Test</button>
            </div>
          ))}
        </div>
      </section>

      
    </div>
  );
};

export default Practice;
