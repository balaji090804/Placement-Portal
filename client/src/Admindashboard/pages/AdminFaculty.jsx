
// ✅ Ensure this file exists
// src/AdminPlacement.jsx (example)

import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/AdminFacultyAssignment.css"; 
const AdminPlacement = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [assignedFaculty, setAssignedFaculty] = useState("");

  useEffect(() => {
    // 1) Load all faculty from the server
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      // Adjust the route to match your existing user/faculty endpoint
      const res = await axios.get("http://localhost:8080/api/users/faculty");
      setFacultyList(res.data); 
    } catch (error) {
      console.error("Error fetching faculty:", error);
    }
  };

  // 2) Admin schedules the placement
  // POST /api/announcements/create
  const handleSchedulePlacement = async () => {
    if (!companyName || !jobRole || !dateTime || !assignedFaculty) {
      alert("Please fill all fields and assign a faculty");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8080/api/announcements/create", {
        companyName,
        jobRole,
        dateTime,
        assignedFacultyEmail: assignedFaculty
      });
      alert(res.data.message || "Placement scheduled successfully!");
      // Clear fields
      setCompanyName("");
      setJobRole("");
      setDateTime("");
      setAssignedFaculty("");
    } catch (error) {
      console.error("Error scheduling placement:", error);
      alert("Failed to schedule placement");
    }
  };

  return (
    <div className="admin-placement-page">
      <h1>Admin: Schedule Placement</h1>

      <div className="form-group">
        <label>Company Name:</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Job Role:</label>
        <input
          type="text"
          value={jobRole}
          onChange={(e) => setJobRole(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Date & Time:</label>
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Assign Faculty:</label>
        <select
          value={assignedFaculty}
          onChange={(e) => setAssignedFaculty(e.target.value)}
        >
          <option value="">--Select--</option>
          {facultyList.map((f) => (
            <option key={f.email} value={f.email}>
              {f.firstName} {f.lastName} - {f.email}
            </option>
          ))}
        </select>
      </div>

      <button onClick={handleSchedulePlacement}>Schedule Placement</button>
    </div>
  );
};

export default AdminPlacement;
