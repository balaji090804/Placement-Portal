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
    {
      title: "Aptitude Test",
      desc: "Sharpen your logical reasoning skills.",
      link: "https://www.indiabix.com/aptitude/questions-and-answers/",
    },
    {
      title: "Coding Test",
      desc: "Test your coding and problem-solving abilities.",
      link: "/g-test",
    },
    {
      title: "Communication Skills",
      desc: "Improve verbal and written communication.",
      link: "https://www.indiabix.com/verbal-ability/questions-and-answers/",
    },
    {
      title: "Technical MCQs",
      desc: "Evaluate your fundamental technical knowledge.",
      link: "https://www.indiabix.com/computer-science/questions-and-answers/",
    },
    {
      title: "Faculty Aptitude Test",
      desc: "Attempt aptitude questions added by your faculty.",
      link: "/StudentDashboard/Aptitude",
    },
    {
      title: "Data Structures & Algorithms",
      desc: "Strengthen your DSA skills.",
      link: "https://www.indiabix.com/data-structures/questions-and-answers/",
    },
    {
      title: "Database Management",
      desc: "Assess your SQL and DBMS knowledge.",
      link: "https://www.indiabix.com/database/questions-and-answers/",
    },
    {
      title: "Operating Systems",
      desc: "Test your OS concepts and problem-solving.",
      link: "https://www.indiabix.com/operating-systems/questions-and-answers/",
    },
    {
      title: "Networking Basics",
      desc: "Evaluate your knowledge of computer networks.",
      link: "https://www.indiabix.com/networking/questions-and-answers/",
    },
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
            <div
              key={index}
              className="practice-card"
              onClick={() => {
                // If link is an absolute external URL, open in new tab; otherwise navigate internally
                if (
                  typeof test.link === "string" &&
                  (test.link.startsWith("http://") ||
                    test.link.startsWith("https://"))
                ) {
                  window.open(test.link, "_blank", "noopener,noreferrer");
                } else {
                  navigate(test.link);
                }
              }}
            >
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
