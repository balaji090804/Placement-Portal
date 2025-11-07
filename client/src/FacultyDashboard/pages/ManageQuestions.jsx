import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaPlus,
  FaFilter,
  FaClock,
} from "react-icons/fa";
import "../styles/ManageQuestions.css";

const domainConfig = {
  aptitude: { title: "Aptitude Questions", icon: "", color: "#2563eb" },
  coding: { title: "Coding Questions", icon: "", color: "#16a34a" },
  communication: {
    title: "Communication Skills",
    icon: "",
    color: "#9333ea",
  },
  technical: { title: "Technical MCQs", icon: "", color: "#ea580c" },
  dsa: { title: "Data Structures & Algorithms", icon: "", color: "#8b5cf6" },
  dbms: { title: "Database Management", icon: "", color: "#e11d48" },
  os: { title: "Operating Systems", icon: "", color: "#22c55e" },
  networking: { title: "Networking Basics", icon: "", color: "#0ea5e9" },
};

const ManageQuestions = () => {
  const { domain } = useParams();
  const navigate = useNavigate();
  const config = domainConfig[domain] || domainConfig.aptitude;

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, inactive
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  useEffect(() => {
    fetchQuestions();
  }, [domain]);

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:8080/api/questions/manage/${domain}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setQuestions(response.data);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (questionId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:8080/api/questions/${questionId}/toggle`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success(`Question ${currentStatus ? "deactivated" : "activated"}`);
      fetchQuestions();
    } catch (error) {
      console.error("Error toggling question:", error);
      toast.error("Failed to update question");
    }
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8080/api/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Question deleted successfully");
      fetchQuestions();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === "active" && !q.isActive) return false;
    if (filter === "inactive" && q.isActive) return false;
    if (difficultyFilter !== "all" && q.difficulty !== difficultyFilter)
      return false;
    return true;
  });

  const stats = {
    total: questions.length,
    active: questions.filter((q) => q.isActive).length,
    easy: questions.filter((q) => q.difficulty === "easy").length,
    medium: questions.filter((q) => q.difficulty === "medium").length,
    hard: questions.filter((q) => q.difficulty === "hard").length,
  };

  if (loading) {
    return (
      <div className="manage-questions-page">
        <div className="loading">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="manage-questions-page">
      {/* Header */}
      <div className="manage-header" style={{ "--domain-color": config.color }}>
        <div className="header-content">
          <div className="header-icon">{config.icon}</div>
          <div className="header-text">
            <h1>Manage {config.title}</h1>
            <p>
              {stats.total} questions | {stats.active} active
            </p>
          </div>
        </div>
        <button
          className="add-new-btn"
          onClick={() => navigate(`/FacultyDashboard/AddQuestion/${domain}`)}
        >
          <FaPlus /> Add New Question
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Questions</div>
        </div>
        <div className="stat-card active">
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card easy">
          <div className="stat-value">{stats.easy}</div>
          <div className="stat-label">Easy</div>
        </div>
        <div className="stat-card medium">
          <div className="stat-value">{stats.medium}</div>
          <div className="stat-label">Medium</div>
        </div>
        <div className="stat-card hard">
          <div className="stat-value">{stats.hard}</div>
          <div className="stat-label">Hard</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>
            <FaFilter /> Status:
          </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Questions</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Difficulty:</label>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="all">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="questions-container">
        {filteredQuestions.length === 0 ? (
          <div className="empty-state">
            <p>No questions found. Start by adding some questions!</p>
            <button
              className="add-first-btn"
              onClick={() =>
                navigate(`/FacultyDashboard/AddQuestion/${domain}`)
              }
            >
              <FaPlus /> Add Your First Question
            </button>
          </div>
        ) : (
          filteredQuestions.map((question, index) => (
            <div
              key={question._id}
              className={`question-card ${
                !question.isActive ? "inactive" : ""
              }`}
            >
              <div className="question-header-row">
                <div className="question-number">Question #{index + 1}</div>
                <div className="question-badges">
                  <span className={`difficulty-badge ${question.difficulty}`}>
                    {question.difficulty}
                  </span>
                  <span className="time-badge">
                    <FaClock /> {question.time}s
                  </span>
                  {!question.isActive && (
                    <span className="inactive-badge">Inactive</span>
                  )}
                </div>
              </div>

              <div className="question-text">{question.question}</div>

              <div className="options-list">
                {question.options.map((option, idx) => (
                  <div
                    key={idx}
                    className={`option-item ${
                      option === question.correctAnswer ? "correct" : ""
                    }`}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </div>
                ))}
              </div>

              {question.explanation && (
                <div className="explanation-box">
                  <strong>Explanation:</strong> {question.explanation}
                </div>
              )}

              <div className="question-actions">
                <button
                  className="action-btn toggle"
                  onClick={() =>
                    handleToggleActive(question._id, question.isActive)
                  }
                  title={question.isActive ? "Deactivate" : "Activate"}
                >
                  {question.isActive ? <FaToggleOn /> : <FaToggleOff />}
                  {question.isActive ? "Active" : "Inactive"}
                </button>
                <button
                  className="action-btn delete"
                  onClick={() => handleDelete(question._id)}
                  title="Delete question"
                >
                  <FaTrash /> Delete
                </button>
              </div>

              <div className="question-meta">
                Created: {new Date(question.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageQuestions;
