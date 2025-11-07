import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  FaCalculator,
  FaCode,
  FaComments,
  FaCogs,
  FaDatabase,
  FaServer,
  FaNetworkWired,
  FaListOl,
} from "react-icons/fa";
import "../styles/Practice.css";
import { recordPerformanceEvent } from "../../lib/performance";

const Practice = () => {
  const navigate = useNavigate();
  // Always call hooks at the top level; outlet context may be undefined if no parent <Outlet/> provides it
  const outletCtx = useOutletContext();
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
      link: "/StudentDashboard/DomainTest/aptitude",
      icon: <FaCalculator />,
      color: "#2563eb",
    },
    {
      title: "Coding Test",
      desc: "Test your coding and problem-solving abilities.",
      link: "/StudentDashboard/DomainTest/coding",
      icon: <FaCode />,
      color: "#16a34a",
    },
    {
      title: "Communication Skills",
      desc: "Improve verbal and written communication.",
      link: "/StudentDashboard/DomainTest/communication",
      icon: <FaComments />,
      color: "#9333ea",
    },
    {
      title: "Technical MCQs",
      desc: "Evaluate your fundamental technical knowledge.",
      link: "/StudentDashboard/DomainTest/technical",
      icon: <FaCogs />,
      color: "#ea580c",
    },
    {
      title: "Data Structures & Algorithms",
      desc: "Strengthen your DSA skills.",
      link: "/StudentDashboard/DomainTest/dsa",
      icon: <FaCode />,
      color: "#8b5cf6",
    },
    {
      title: "Database Management",
      desc: "Assess your SQL and DBMS knowledge.",
      link: "/StudentDashboard/DomainTest/dbms",
      icon: <FaDatabase />,
      color: "#e11d48",
    },
    {
      title: "Operating Systems",
      desc: "Test your OS concepts and problem-solving.",
      link: "/StudentDashboard/DomainTest/os",
      icon: <FaServer />,
      color: "#22c55e",
    },
    {
      title: "Networking Basics",
      desc: "Evaluate your knowledge of computer networks.",
      link: "/StudentDashboard/DomainTest/networking",
      icon: <FaNetworkWired />,
      color: "#0ea5e9",
    },
  ];

  return (
    <div className="practice-page">
      {/* Hero */}
      <section className="practice-hero">
        <div className="practice-hero__title">
          Coding Practice & Assessments
        </div>
        <div className="practice-hero__subtitle">
          Select a problem and start coding to test your skills.
        </div>
      </section>

      {/* Practice Tests Section */}
      <section className="practice-tests">
        <h2>Practice Assessments</h2>
        <div className="practice-test-grid">
          {practiceTests.map((test, index) => (
            <div
              key={index}
              className="practice-card"
              onClick={() => {
                navigate(test.link);
                const studentEmail = outletCtx?.studentEmail;
                if (studentEmail) {
                  recordPerformanceEvent(studentEmail, "practiceStarted", {
                    title: test.title,
                  });
                }
              }}
            >
              <div
                className="practice-card__icon"
                style={{
                  backgroundColor: `${test.color}20`,
                  color: test.color,
                }}
              >
                {test.icon}
              </div>
              <h3>{test.title}</h3>
              <p>{test.desc}</p>
              <button className="practice-btn">Start</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Practice;
