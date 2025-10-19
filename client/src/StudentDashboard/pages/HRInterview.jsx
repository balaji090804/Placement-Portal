import React from "react";
import "../styles/InterviewPages.css";

const HRInterview = () => {
  return (
    <div className="interview-page">
      <section className="interview-header">
        <h1>🧑‍💼 HR Interview Preparation</h1>
        <p>Prepare for HR interviews with commonly asked questions and expert tips.</p>
      </section>

      <section className="interview-content">
        <h2>💬 Common HR Interview Questions</h2>
        <ul className="question-list">
          <li>Tell me about yourself.</li>
          <li>Why do you want to work for our company?</li>
          <li>What are your strengths and weaknesses?</li>
          <li>Where do you see yourself in five years?</li>
          <li>Tell me about a time you faced a challenge and how you handled it.</li>
        </ul>
      </section>

      <section className="interview-tips">
        <h2>📌 HR Interview Tips</h2>
        <p>✅ Be confident and maintain good body language.</p>
        <p>✅ Research the company before your interview.</p>
        <p>✅ Answer questions with real-life examples.</p>
      </section>
    </div>
  );
};

export default HRInterview;
