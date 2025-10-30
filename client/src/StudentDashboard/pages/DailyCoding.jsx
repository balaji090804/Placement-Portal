import React, { useEffect, useState } from "react";
import "../styles/DailyCoding.css";

const DailyCoding = () => {
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [submittedCode, setSubmittedCode] = useState("");
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("http://localhost:8080/api/daily/leetcode");
        if (!res.ok)
          throw new Error(`Failed to fetch daily challenge (${res.status})`);
        const json = await res.json();
        if (!cancelled) setDaily(json);
      } catch (e) {
        if (!cancelled) setError(e.message || "Unable to load daily challenge");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
      description:
        "Given an array containing numbers from 1 to N, find the missing number.",
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

      {/* 🌟 Today's Daily Challenge (LeetCode) */}
      <section className="daily-challenge">
        <h2>🌟 Today's Challenge</h2>
        {loading && <p>Loading daily challenge…</p>}
        {!!error && !loading && <p style={{ color: "#b00020" }}>{error}</p>}
        {!loading && !error && daily && (
          <div
            className={`daily-card ${String(
              daily.difficulty || ""
            ).toLowerCase()}-card`}
          >
            <div className="daily-card-main">
              <div>
                <h3>{daily.title}</h3>
                <p>
                  <strong>Provider:</strong> {daily.provider?.toUpperCase()}{" "}
                  &nbsp;•&nbsp;
                  <strong>Difficulty:</strong> {daily.difficulty} &nbsp;•&nbsp;
                  <strong>Date:</strong> {daily.date}
                </p>
              </div>
              <div className="daily-card-actions">
                <button
                  className="open-btn"
                  onClick={() =>
                    daily.link &&
                    window.open(daily.link, "_blank", "noopener,noreferrer")
                  }
                >
                  Open on LeetCode
                </button>
                <button
                  className="refresh-btn"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const res = await fetch(
                        "http://localhost:8080/api/daily/leetcode"
                      );
                      const json = await res.json();
                      setDaily(json);
                    } catch (e) {
                      setError(e.message || "Refresh failed");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        )}
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
              <p>
                <strong>Difficulty:</strong> {problem.difficulty}
              </p>
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
            <p>
              <strong>📥 Sample Input:</strong> {selectedProblem.sampleInput}
            </p>
            <p>
              <strong>📤 Expected Output:</strong>{" "}
              {selectedProblem.sampleOutput}
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default DailyCoding;
