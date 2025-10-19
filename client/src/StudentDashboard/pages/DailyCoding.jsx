import React, { useState } from "react";
import "../styles/DailyCoding.css";

const DailyCoding = () => {
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [submittedCode, setSubmittedCode] = useState("");

  const problems = [
    {
      id: 1,
      title: "Reverse a String",
      difficulty: "Easy",
      description: "Write a function that reverses a given string.",
      sampleInput: `"hello"`,
      sampleOutput: `"olleh"`,
    },
    {
      id: 2,
      title: "Find the Missing Number",
      difficulty: "Medium",
      description: "Given an array containing numbers from 1 to N, find the missing number.",
      sampleInput: "[1, 2, 4, 5]",
      sampleOutput: "3",
    },
    {
      id: 3,
      title: "Longest Palindromic Substring",
      difficulty: "Hard",
      description: "Find the longest palindromic substring in a given string.",
      sampleInput: `"babad"`,
      sampleOutput: `"bab" or "aba"`,
    },
  ];

  return (
    <div className="daily-coding-container">
      {/* 🚀 Page Header */}
      <section className="daily-coding-header">
        <h1>💻 Coding Practice & Assessments</h1>
        <p>Select a problem and start coding to test your skills.</p>
      </section>

      {/* 🔍 Coding Challenges List */}
      <section className="coding-problem-selection">
        <h2>📌 Choose a Challenge</h2>
        <div className="coding-problem-grid">
          {problems.map((problem) => (
            <div
              key={problem.id}
              className={`coding-problem-card ${problem.difficulty.toLowerCase()}-card`}
              onClick={() => setSelectedProblem(problem)}
            >
              <h3>{problem.title}</h3>
              <p><strong>Difficulty:</strong> {problem.difficulty}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 💻 Coding Interface */}
      {selectedProblem && (
        <section className="coding-problem-interface">
          <h2>💻 Solve: {selectedProblem.title}</h2>
          <p>{selectedProblem.description}</p>

          <div className="coding-textarea-wrapper">
            <textarea
              placeholder="// Write your code here"
              value={submittedCode}
              onChange={(e) => setSubmittedCode(e.target.value)}
            />
          </div>

          <button className="code-submit-btn">Submit Code</button>

          <div className="sample-input-output">
            <p><strong>📥 Sample Input:</strong> {selectedProblem.sampleInput}</p>
            <p><strong>📤 Expected Output:</strong> {selectedProblem.sampleOutput}</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default DailyCoding;
