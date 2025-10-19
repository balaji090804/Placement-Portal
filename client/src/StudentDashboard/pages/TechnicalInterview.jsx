import React from "react";
import "../styles/InterviewPages.css";

const TechnicalInterview = () => {
  return (
    <div className="interview-page">
      <section className="interview-header">
        <h1>💻 Technical Interview Preparation</h1>
        <p>Master technical interviews with essential coding, database, and problem-solving skills.</p>
      </section>

      <section className="interview-content">
        <h2>💡 Common Technical Interview Questions</h2>
        <ul className="question-list">
          <li>What is the difference between C++ and Java?</li>
          <li>Explain the concept of OOP with real-world examples.</li>
          <li>What are the different types of database normalization?</li>
          <li>How do you optimize an algorithm for better efficiency?</li>
          <li>What is the difference between SQL and NoSQL databases?</li>
        </ul>
      </section>

      <section className="interview-tips">
        <h2>📌 Technical Interview Tips</h2>
        <p>✅ Be clear with your fundamentals in programming and data structures.</p>
        <p>✅ Practice coding problems daily on LeetCode, CodeChef, or GeeksforGeeks.</p>
        <p>✅ Explain your thought process while solving problems.</p>
      </section>
    </div>
  );
};

export default TechnicalInterview;
