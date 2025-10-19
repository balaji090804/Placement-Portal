import React, { useState } from "react";
import { useOutletContext } from "react-router-dom"; // ✅ Import useOutletContext
import axios from "axios";
import "../styles/InterviewPreparation.css";

import {
  FaUserTie,
  FaLaptopCode,
  FaClipboardList,
  FaFileAlt,
  FaBriefcase,
  FaHandshake,
  FaAward,
} from "react-icons/fa";

const InterviewPreparation = () => {
  const { studentName, studentEmail } = useOutletContext(); // ✅ Retrieve student details
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const requestInterview = async () => {
    if (!studentName || !studentEmail) {
      alert("⚠️ Please log in to request an interview.");
      return;
    }

    setLoading(true);
    setSuccessMessage("");

    try {
      const response = await axios.post("http://localhost:8080/api/interviews/request", {
        studentName, // ✅ Send student name
        studentEmail, // ✅ Send student email
      });
      setSuccessMessage(response.data.message);
    } catch (error) {
      console.error("❌ Error requesting interview:", error);
      alert(error.response?.data?.message || "Failed to request interview.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="interview-page">
      {/* 🚀 Page Header */}
      <section className="interview-header">
        <h1>🎤 Interview Preparation Hub</h1>
        <button className="request-btn" onClick={requestInterview} disabled={loading}>
          {loading ? "Requesting..." : "Request Interview"}
        </button>
        {successMessage && <p className="success-message">{successMessage}</p>}
      </section>

      {/* 📌 Clickable Interview Cards */}
      <section className="interview-types">
        <h2>📑 Select an Interview Type</h2>
        <div className="interview-grid">
          {[
            {
              title: "HR Interview",
              desc: "Prepare for HR interview rounds.",
              link: "/HRInterview",
              icon: <FaUserTie />,
            },
            {
              title: "Technical Interview",
              desc: "Get ready for technical assessments.",
              link: "/TechnicalInterview",
              icon: <FaLaptopCode />,
            },
            {
              title: "Behavioral Interview",
              desc: "Learn behavioral interview techniques.",
              link: "/BehavioralInterview",
              icon: <FaClipboardList />,
            },
            {
              title: "Mock Interviews",
              desc: "Practice with AI-based mock interviews.",
              link: "/mock-interview",
              icon: <FaBriefcase />,
            },
          ].map((interview, index) => (
            <div key={index} className="interview-card">
              <div className="interview-icon">{interview.icon}</div>
              <h3>{interview.title}</h3>
              <p>{interview.desc}</p>
              <button className="interview-btn">Start Preparation</button>
            </div>
          ))}
        </div>
      </section>

      {/* 🛤️ Placement Preparation Roadmap */}
      <section className="placement-roadmap">
        <h2>🛤️ Placement Preparation Roadmap</h2>
        <div className="timeline">
          {[
            { icon: <FaLaptopCode />, step: "Skill Development", desc: "Master coding, aptitude, and communication skills." },
            { icon: <FaFileAlt />, step: "Resume Building", desc: "Create an ATS-friendly and professional resume." },
            { icon: <FaClipboardList />, step: "Mock Tests", desc: "Attempt coding, aptitude, and domain-based mock tests." },
            { icon: <FaUserTie />, step: "Mock Interviews", desc: "Practice HR & Technical interviews with AI-based tools." },
            { icon: <FaBriefcase />, step: "Job Applications", desc: "Apply for relevant roles through job portals." },
            { icon: <FaHandshake />, step: "Final Interviews", desc: "Give your best performance in company interviews." },
            { icon: <FaAward />, step: "Job Offers", desc: "Negotiate and accept the best job offer." },
          ].map((step, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-dot">{step.icon}</div>
              <div className="timeline-content">
                <h3>{step.step}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default InterviewPreparation;
