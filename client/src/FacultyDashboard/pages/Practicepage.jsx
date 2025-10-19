import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Practice.css";

const Practice = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    { title: "Aptitude Questions", desc: "Add aptitude questions to test logical reasoning.", link: "/FacultyDashboard/FacultyAddAptitude" },
    { title: "Coding Questions", desc: "Add coding problems for students to practice.", link: "/FacultyDashboard/FacultyAddCoding" },
    { title: "Communication Skills", desc: "Create scenarios to improve communication skills.", link: "/FacultyDashboard/FacultyAddCommunication" },
    { title: "Technical MCQs", desc: "Upload technical multiple-choice questions.", link: "/FacultyDashboard/FacultyAddTechnical" },
    { title: "DSA Problems", desc: "Curate questions on Data Structures and Algorithms.", link: "/FacultyDashboard/FacultyAddDSA" },
    { title: "DBMS Quiz", desc: "Frame questions related to database management systems.", link: "/FacultyDashboard/FacultyAddDBMS" },
    { title: "Operating Systems", desc: "Design OS-related questions for practice.", link: "/FacultyDashboard/FacultyAddOS" },
    { title: "Networking Basics", desc: "Add questions covering computer networks fundamentals.", link: "/FacultyDashboard/FacultyAddNetworking" },
  ];

  return (
    <div className="practice-page">
      {/* Page Header */}
      <section className="practice-header">
        <div className="header-overlay">
          <h2>🧠 Faculty Question Framing Portal</h2>
        </div>
      </section>

      {/* Practice Tests Section */}
      <section className="practice-tests">
        <h2>➕ Add Practice Questions by Category</h2>
        <div className="practice-test-grid">
          {practiceTests.map((test, index) => (
            <div key={index} className="practice-card" onClick={() => navigate(test.link)}>
              <h3>{test.title}</h3>
              <p>{test.desc}</p>
              <button className="practice-btn">Add Questions</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Practice;
