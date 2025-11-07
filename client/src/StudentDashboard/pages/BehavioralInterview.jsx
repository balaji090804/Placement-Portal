import React from "react";
import "../styles/InterviewPages.css";

const BehavioralInterview = () => {
  return (
    <div className="interview-page">
      <section className="interview-header">
        <h1>Behavioral Interview Preparation</h1>
        <p>Prepare for behavioral interviews using the STAR method and strong storytelling techniques.</p>
      </section>

      <section className="interview-content">
        <h2>Common Behavioral Interview Questions</h2>
        <ul className="question-list">
          <li>Describe a situation where you had to work under pressure.</li>
          <li>How do you handle conflict in a team environment?</li>
          <li>Give an example of a time you demonstrated leadership.</li>
          <li>Tell me about a time when you failed and what you learned.</li>
          <li>Describe a situation where you had to adapt to change quickly.</li>
        </ul>
      </section>

      <section className="interview-tips">
        <h2>📌 Behavioral Interview Tips</h2>
        <p>✅ Use the **STAR** method (Situation, Task, Action, Result) for structured answers.</p>
        <p>✅ Be honest and highlight your learning experiences.</p>
        <p>✅ Focus on problem-solving, teamwork, and adaptability.</p>
      </section>
    </div>
  );
};

export default BehavioralInterview;
