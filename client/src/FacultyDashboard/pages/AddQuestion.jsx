import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaLightbulb,
  FaClock,
} from "react-icons/fa";
import "../styles/AddQuestion.css";

const domainConfig = {
  aptitude: {
    title: "Aptitude Questions",
    description: "Test logical reasoning and analytical skills",
    icon: "",
    color: "#2563eb",
  },
  coding: {
    title: "Coding Questions",
    description: "Evaluate programming and problem-solving abilities",
    icon: "",
    color: "#16a34a",
  },
  communication: {
    title: "Communication Skills",
    description: "Assess verbal and written communication",
    icon: "",
    color: "#9333ea",
  },
  technical: {
    title: "Technical MCQs",
    description: "Test fundamental technical knowledge",
    icon: "",
    color: "#ea580c",
  },
  dsa: {
    title: "Data Structures & Algorithms",
    description: "Challenge DSA concepts and problem-solving",
    icon: "",
    color: "#8b5cf6",
  },
  dbms: {
    title: "Database Management",
    description: "Evaluate SQL and DBMS knowledge",
    icon: "",
    color: "#e11d48",
  },
  os: {
    title: "Operating Systems",
    description: "Test OS concepts and fundamentals",
    icon: "",
    color: "#22c55e",
  },
  networking: {
    title: "Networking Basics",
    description: "Assess computer networks knowledge",
    icon: "",
    color: "#0ea5e9",
  },
};

const AddQuestion = () => {
  const { domain } = useParams();
  const navigate = useNavigate();
  const config = domainConfig[domain] || domainConfig.aptitude;

  const [formData, setFormData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: "",
    difficulty: "medium",
    time: 60,
  });

  const [submitting, setSubmitting] = useState(false);

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    if (formData.options.some((opt) => !opt.trim())) {
      toast.error("Please fill all 4 options");
      return;
    }

    if (!formData.correctAnswer.trim()) {
      toast.error("Please select the correct answer");
      return;
    }

    if (!formData.options.includes(formData.correctAnswer)) {
      toast.error("Correct answer must be one of the options");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:8080/api/questions/add",
        {
          domain,
          ...formData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Question added successfully!");

      // Reset form
      setFormData({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
        difficulty: "medium",
        time: 60,
      });
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error(error.response?.data?.message || "Failed to add question");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewQuestions = () => {
    navigate(`/FacultyDashboard/ManageQuestions/${domain}`);
  };

  return (
    <div className="add-question-page">
      {/* Header */}
      <div
        className="add-question-header"
        style={{ "--domain-color": config.color }}
      >
        <div className="header-content">
          <div className="header-icon">{config.icon}</div>
          <div className="header-text">
            <h1>{config.title}</h1>
            <p>{config.description}</p>
          </div>
        </div>
        <button className="view-questions-btn" onClick={handleViewQuestions}>
          View All Questions
        </button>
      </div>

      {/* Form */}
      <div className="add-question-container">
        <form onSubmit={handleSubmit} className="question-form">
          {/* Question Field */}
          <div className="form-section">
            <label className="form-label">
              <FaLightbulb /> Question
            </label>
            <textarea
              value={formData.question}
              onChange={(e) =>
                setFormData({ ...formData, question: e.target.value })
              }
              placeholder="Enter your question here..."
              rows="4"
              className="form-textarea"
              required
            />
          </div>

          {/* Options */}
          <div className="form-section">
            <label className="form-label">Answer Options</label>
            <div className="options-grid">
              {formData.options.map((opt, index) => (
                <div key={index} className="option-input-group">
                  <span className="option-label">Option {index + 1}</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Enter option ${index + 1}`}
                    className="form-input"
                    required
                  />
                  {formData.correctAnswer === opt && opt.trim() && (
                    <FaCheckCircle className="correct-indicator" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Correct Answer Selection */}
          <div className="form-section">
            <label className="form-label">
              <FaCheckCircle /> Correct Answer
            </label>
            <select
              value={formData.correctAnswer}
              onChange={(e) =>
                setFormData({ ...formData, correctAnswer: e.target.value })
              }
              className="form-select"
              required
            >
              <option value="">Select the correct answer</option>
              {formData.options.map(
                (opt, index) =>
                  opt.trim() && (
                    <option key={index} value={opt}>
                      Option {index + 1}: {opt}
                    </option>
                  )
              )}
            </select>
          </div>

          {/* Explanation */}
          <div className="form-section">
            <label className="form-label">
              <FaLightbulb /> Explanation (Optional)
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) =>
                setFormData({ ...formData, explanation: e.target.value })
              }
              placeholder="Provide an explanation for the correct answer..."
              rows="3"
              className="form-textarea"
            />
          </div>

          {/* Difficulty and Time */}
          <div className="form-row">
            <div className="form-section">
              <label className="form-label">Difficulty Level</label>
              <select
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData({ ...formData, difficulty: e.target.value })
                }
                className="form-select"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="form-section">
              <label className="form-label">
                <FaClock /> Time (seconds)
              </label>
              <input
                type="number"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: parseInt(e.target.value) })
                }
                min="15"
                max="300"
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={submitting}
            style={{ "--domain-color": config.color }}
          >
            {submitting ? (
              <>
                <span className="spinner"></span> Adding Question...
              </>
            ) : (
              <>
                <FaPlus /> Add Question
              </>
            )}
          </button>
        </form>

        {/* Quick Stats */}
        <div className="quick-tips">
          <h3>📝 Quick Tips</h3>
          <ul>
            <li>Write clear and concise questions</li>
            <li>Ensure all options are plausible</li>
            <li>Provide helpful explanations</li>
            <li>Set appropriate time limits</li>
            <li>Test your questions before publishing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddQuestion;
