import React, { useState, useEffect } from "react";
import "../styles/AptitudeTest.css";

const AptitudeTest = () => {
  const [questions, setQuestions] = useState([]);
  const [totalTime, setTotalTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch stored aptitude questions from the backend
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/aptitude-questions");
        const data = await response.json();
        setQuestions(data);
        // Compute total test time as the sum of individual question times
        const computedTime = data.reduce((acc, q) => acc + q.time, 0);
        setTotalTime(computedTime);
        setTimeLeft(computedTime);
      } catch (error) {
        console.error("Error fetching aptitude questions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // Global countdown timer
  useEffect(() => {
    if (loading) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, loading]);

  const handleOptionClick = (option) => {
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestionIndex] = option;
    setSelectedAnswers(newSelectedAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    let calculatedScore = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        calculatedScore += 1;
      }
    });
    setScore(calculatedScore);
  };

  if (loading) {
    return (
      <div className="aptitude-test">
        <p>Loading aptitude test...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="aptitude-test">
        <p>No aptitude questions available at this time.</p>
      </div>
    );
  }

  // After test submission, display the results.
  if (score !== null) {
    return (
      <div className="aptitude-test">
        <h1>Test Results</h1>
        <p>
          You scored {score} out of {questions.length}
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="aptitude-test">
      <div className="test-header">
        <h1>Aptitude Test</h1>
        <div className="timer">Time Left: {timeLeft} sec</div>
      </div>
      <div className="question-section">
        <h2>
          Question {currentQuestionIndex + 1} of {questions.length}
        </h2>
        <p className="question-text">{currentQuestion.question}</p>
        <div className="options">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              className={`option-btn ${
                selectedAnswers[currentQuestionIndex] === option ? "selected" : ""
              }`}
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="navigation">
        <button
          className="nav-btn"
          onClick={handlePrev}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </button>
        {currentQuestionIndex < questions.length - 1 ? (
          <button className="nav-btn" onClick={handleNext}>
            Next
          </button>
        ) : (
          <button className="nav-btn" onClick={handleSubmit}>
            Submit
          </button>
        )}
      </div>
    </div>
  );
};

export default AptitudeTest;
