// src/FacultyDashboard/pages/FacultyRoundUpdate.jsx
import React, { useState } from "react";
import Papa from "papaparse";
import axios from "axios";
import "../styles/FacultyResultsUpdate.css";

const FacultyRoundUpdate = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [roundNumber, setRoundNumber] = useState("");
  const [nextRoundVenue, setNextRoundVenue] = useState("");
  const [nextRoundTime, setNextRoundTime] = useState("");
  const [message, setMessage] = useState("");

  // Handle CSV file selection
  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  // Parse CSV file to extract student data (expecting CSV columns: name, email)
  const parseCsvFile = () => {
    if (!csvFile) {
      alert("Please select a CSV file.");
      return;
    }
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setSelectedStudents(results.data);
        console.log("Parsed CSV data:", results.data);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
      }
    });
  };

  // Handle form submission: send details (company, job role, round, venue, time and student list)
  // to backend which will store the data in the StudentSelection collection and send emails.
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required fields
    if (
      !companyName ||
      !jobRole ||
      !roundNumber ||
      !nextRoundVenue ||
      !nextRoundTime ||
      selectedStudents.length === 0
    ) {
      alert("Please fill in all required fields and upload a CSV file.");
      return;
    }
    try {
      const payload = {
        companyName,
        jobRole,
        roundNumber,
        nextRoundVenue,
        nextRoundTime,
        selectedStudents,
      };
      const res = await axios.post("http://localhost:8080/api/announcements/updateRound", payload);
      setMessage(res.data.message);
      // Optionally, reset form fields after successful submission
      setCompanyName("");
      setJobRole("");
      setRoundNumber("");
      setNextRoundVenue("");
      setNextRoundTime("");
      setSelectedStudents([]);
      setCsvFile(null);
    } catch (error) {
      console.error("Error updating round:", error);
      setMessage("Failed to update round.");
    }
  };

  return (
    <div className="round-update-container">
      <h2>Update Round Results & Notify Selected Students</h2>
      <form onSubmit={handleSubmit} className="round-update-form">
        <div className="form-group">
          <label>Company Name:</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. ABC Corp"
            required
          />
        </div>
        <div className="form-group">
          <label>Job Role:</label>
          <input
            type="text"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            placeholder="e.g. Software Developer"
            required
          />
        </div>
        <div className="form-group">
          <label>Round Number:</label>
          <input
            type="text"
            value={roundNumber}
            onChange={(e) => setRoundNumber(e.target.value)}
            placeholder="e.g. 2"
            required
          />
        </div>
        <div className="form-group">
          <label>Next Round Venue:</label>
          <input
            type="text"
            value={nextRoundVenue}
            onChange={(e) => setNextRoundVenue(e.target.value)}
            placeholder="e.g. Conference Hall"
            required
          />
        </div>
        <div className="form-group">
          <label>Next Round Time:</label>
          <input
            type="datetime-local"
            value={nextRoundTime}
            onChange={(e) => setNextRoundTime(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Upload CSV of Selected Students:</label>
          <input type="file" accept=".csv" onChange={handleFileChange} required />
          <button type="button" onClick={parseCsvFile} className="parse-btn">
            Parse CSV
          </button>
        </div>
        <button type="submit" className="submit-btn">
          Update Round & Send Emails
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default FacultyRoundUpdate;
