import React, { useState, useEffect } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaTrophy,
  FaRedo,
} from "react-icons/fa";
import "../styles/DomainTest.css";

const domainConfig = {
  aptitude: { title: "Aptitude Test", icon: "🧮", color: "#2563eb" },
  coding: { title: "Coding Test", icon: "💻", color: "#16a34a" },
  communication: { title: "Communication Test", icon: "💬", color: "#9333ea" },
  technical: { title: "Technical MCQs", icon: "⚙️", color: "#ea580c" },
  dsa: { title: "DSA Test", icon: "🌳", color: "#8b5cf6" },
  dbms: { title: "DBMS Test", icon: "🗄️", color: "#e11d48" },
  os: { title: "OS Test", icon: "🖥️", color: "#22c55e" },
  networking: { title: "Networking Test", icon: "🌐", color: "#0ea5e9" },
};

const DomainTest = () => {
  const { domain } = useParams();
  const { studentName, studentEmail } = useOutletContext();
  const navigate = useNavigate();
  const config = domainConfig[domain] || domainConfig.aptitude;

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [domain]);

  useEffect(() => {
    if (testStarted && timeLeft > 0 && !testCompleted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [testStarted, timeLeft, testCompleted]);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/questions/domain/${domain}?limit=10`
      );
      if (response.data.length === 0) {
        toast.info("No questions available for this domain yet");
      }
      setQuestions(response.data);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const startTest = () => {
    const total = questions.reduce((sum, q) => sum + q.time, 0);
    setTotalTime(total);
    setTimeLeft(total);
    setStartTime(Date.now());
    setTestStarted(true);
  };

  const handleSelectAnswer = (answer) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questions[currentIndex]._id]: answer,
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      // Prepare answers for verification
      const answers = questions.map((q) => ({
        questionId: q._id,
        selectedAnswer: selectedAnswers[q._id] || "",
      }));

      // Verify answers
      const verifyResponse = await axios.post(
        "http://localhost:8080/api/questions/verify",
        { answers }
      );

      const {
        score,
        totalQuestions,
        percentage,
        results: answerResults,
      } = verifyResponse.data;

      // Calculate time taken
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);

      // Submit to leaderboard
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          "http://localhost:8080/api/leaderboard/submit",
          {
            studentName: studentName || "Unknown",
            studentEmail: studentEmail || "unknown@example.com",
            score,
            totalQuestions,
            timeTaken,
            assessmentType: `${config.title}`,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (error) {
        console.error("Error submitting to leaderboard:", error);
      }

      // Set results
      setResults({
        score,
        totalQuestions,
        percentage,
        details: answerResults,
      });
      setTestCompleted(true);
    } catch (error) {
      console.error("Error submitting test:", error);
      toast.error("Failed to submit test");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setTestStarted(false);
    setTestCompleted(false);
    setResults(null);
    fetchQuestions();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="domain-test-page">
        <div className="loading">Loading test...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="domain-test-page">
        <div className="empty-state">
          <div className="empty-icon">{config.icon}</div>
          <h2>No Questions Available</h2>
          <p>There are no questions for {config.title} yet.</p>
          <button className="back-btn" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Test completed - show results
  if (testCompleted && results) {
    return (
      <div className="domain-test-page">
        <div
          className="results-container"
          style={{ "--domain-color": config.color }}
        >
          <div className="results-header">
            <div className="results-icon">
              {results.percentage >= 70 ? <FaTrophy /> : <FaCheckCircle />}
            </div>
            <h1>Test Completed!</h1>
            <p>{config.title}</p>
          </div>

          <div className="score-display">
            <div className="score-circle">
              <svg width="200" height="200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke={config.color}
                  strokeWidth="12"
                  strokeDasharray={`${results.percentage * 5.65} 565`}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div className="score-text">
                <div className="score-number">
                  {results.percentage.toFixed(1)}%
                </div>
                <div className="score-label">
                  {results.score}/{results.totalQuestions}
                </div>
              </div>
            </div>
          </div>

          <div className="results-actions">
            <button className="retry-btn" onClick={handleRetake}>
              <FaRedo /> Retake Test
            </button>
            <button
              className="leaderboard-btn"
              onClick={() => navigate("/StudentDashboard/Leaderboard")}
            >
              <FaTrophy /> View Leaderboard
            </button>
          </div>

          {/* Answer Review */}
          <div className="answer-review">
            <h2>Review Your Answers</h2>
            {questions.map((question, idx) => {
              const result = results.details[idx];
              const isCorrect = result?.correct;

              return (
                <div
                  key={question._id}
                  className={`review-card ${isCorrect ? "correct" : "wrong"}`}
                >
                  <div className="review-header">
                    <span className="review-number">Question {idx + 1}</span>
                    {isCorrect ? (
                      <FaCheckCircle className="icon-correct" />
                    ) : (
                      <FaTimesCircle className="icon-wrong" />
                    )}
                  </div>
                  <div className="review-question">{question.question}</div>
                  <div className="review-answer">
                    <strong>Your Answer:</strong>{" "}
                    <span className={isCorrect ? "correct-text" : "wrong-text"}>
                      {selectedAnswers[question._id] || "Not answered"}
                    </span>
                  </div>
                  {!isCorrect && (
                    <div className="review-correct">
                      <strong>Correct Answer:</strong>{" "}
                      <span className="correct-text">
                        {result?.correctAnswer}
                      </span>
                    </div>
                  )}
                  {result?.explanation && (
                    <div className="review-explanation">
                      <strong>Explanation:</strong> {result.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Test not started - show start screen
  if (!testStarted) {
    return (
      <div className="domain-test-page">
        <div
          className="start-screen"
          style={{ "--domain-color": config.color }}
        >
          <div className="start-icon">{config.icon}</div>
          <h1>{config.title}</h1>
          <div className="test-info">
            <div className="info-item">
              <span className="info-label">Total Questions:</span>
              <span className="info-value">{questions.length}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Total Time:</span>
              <span className="info-value">
                {formatTime(questions.reduce((sum, q) => sum + q.time, 0))}
              </span>
            </div>
          </div>
          <div className="test-instructions">
            <h3>Instructions:</h3>
            <ul>
              <li>Answer all questions to the best of your ability</li>
              <li>
                You can navigate between questions using Next/Previous buttons
              </li>
              <li>Test will auto-submit when time runs out</li>
              <li>Your score will be submitted to the leaderboard</li>
            </ul>
          </div>
          <button className="start-btn" onClick={startTest}>
            Start Test
          </button>
        </div>
      </div>
    );
  }

  // Test in progress
  const currentQuestion = questions[currentIndex];

  return (
    <div className="domain-test-page">
      <div
        className="test-container"
        style={{ "--domain-color": config.color }}
      >
        {/* Test Header */}
        <div className="test-header">
          <div className="test-title">
            <span className="test-icon">{config.icon}</span>
            {config.title}
          </div>
          <div className="test-timer">
            <FaClock />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-text">
            Question {currentIndex + 1} of {questions.length}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="question-section">
          <h2 className="question-text">{currentQuestion.question}</h2>
          <div className="options-container">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                className={`option-btn ${
                  selectedAnswers[currentQuestion._id] === option
                    ? "selected"
                    : ""
                }`}
                onClick={() => handleSelectAnswer(option)}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="option-text">{option}</span>
                {selectedAnswers[currentQuestion._id] === option && (
                  <FaCheckCircle className="selected-icon" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="navigation-section">
          <button
            className="nav-btn"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            Previous
          </button>
          <div className="answered-count">
            {Object.keys(selectedAnswers).length} / {questions.length} answered
          </div>
          {currentIndex < questions.length - 1 ? (
            <button className="nav-btn" onClick={handleNext}>
              Next
            </button>
          ) : (
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Test"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DomainTest;
