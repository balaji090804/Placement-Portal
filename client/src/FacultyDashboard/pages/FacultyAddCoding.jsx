import React, { useState } from "react";
import axios from "axios";
import "../styles//FacultyAddAptitude.css";

const FacultyAddCoding = () => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [time, setTime] = useState(60); // default test time (in seconds)
  const [message, setMessage] = useState("");

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question || options.some(opt => !opt) || !correctAnswer || !time) {
      setMessage("Please fill in all fields.");
      return;
    }
    try {
      const response = await axios.post("http://localhost:8080/api/Coding-questions", {
        question,
        options,
        correctAnswer,
        time
      });
      setMessage(response.data.message);
      // Clear form after successful submission
      setQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer("");
      setTime(60);
    } catch (error) {
      console.error("Error adding question:", error);
      setMessage("Error adding question. Please try again.");
    }
  };

  return (
    <div className="faculty-add-aptitude">
      <h1>Add Coding Question</h1>
      <form onSubmit={handleSubmit}>
        <label>Question:</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter the question here"
          required
        />
        <div className="options">
          {options.map((opt, index) => (
            <div key={index} className="option-group">
              <label>Option {index + 1}:</label>
              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                required
              />
            </div>
          ))}
        </div>
        <label>Correct Answer:</label>
        <input
          type="text"
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          placeholder="Enter the correct answer"
          required
        />
        <label>Time (seconds):</label>
        <input
          type="number"
          value={time}
          onChange={(e) => setTime(Number(e.target.value))}
          required
        />
        <button type="submit" className="submit-btn">Add Question</button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
};

export default FacultyAddCoding;
