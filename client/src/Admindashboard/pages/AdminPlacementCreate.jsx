import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/AdminFacultyAssignment.css";

const AdminPlacementCreate = () => {
  const [companies, setCompanies] = useState([]);
  const [faculties, setFaculties] = useState([]);

  const [form, setForm] = useState({
    companyName: "",
    jobRole: "",
    scheduleDateTime: "",
    assignedFacultyEmail: ""
  });

  useEffect(() => {
    axios.get("http://localhost:8080/api/recruiters")
      .then((res) => setCompanies(res.data))
      .catch((err) => console.error("Error fetching companies:", err));

    axios.get("http://localhost:8080/api/users/faculty")
      .then((res) => setFaculties(res.data))
      .catch((err) => console.error("Error fetching faculties:", err));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const { companyName, jobRole, scheduleDateTime } = form;

    if (!companyName || !jobRole || !scheduleDateTime) {
      alert("Please fill all mandatory fields");
      return;
    }

    try {
      const response = await axios.post("http://localhost:8080/api/announcements/facultyCreate", {
        companyName: form.companyName,
        jobRole: form.jobRole,
        dateTime: form.scheduleDateTime,
        assignedFacultyEmail: form.assignedFacultyEmail
      });

      alert(response.data.message || "Announcement created successfully!");
      setForm({
        companyName: "",
        jobRole: "",
        scheduleDateTime: "",
        assignedFacultyEmail: ""
      });
    } catch (error) {
      console.error("Error creating announcement:", error);
      alert("Failed to create announcement.");
    }
  };

  return (
    <div className="placement-create-form">
      <h2>📢 Create Placement Announcement</h2>

      <label>Company Name</label>
      <select name="companyName" value={form.companyName} onChange={handleChange}>
        <option value="">-- Select Company --</option>
        {companies.map((comp) => (
          <option key={comp._id} value={comp.companyName}>
            {comp.companyName}
          </option>
        ))}
      </select>

      <label>Job Role</label>
      <input
        type="text"
        name="jobRole"
        value={form.jobRole}
        onChange={handleChange}
        placeholder="e.g. Software Engineer"
      />

      <label>Schedule Date & Time</label>
      <input
        type="datetime-local"
        name="scheduleDateTime"
        value={form.scheduleDateTime}
        onChange={handleChange}
      />

      <label>Assign Faculty</label>
      <select
        name="assignedFacultyEmail"
        value={form.assignedFacultyEmail}
        onChange={handleChange}
      >
        <option value="">-- Select Faculty --</option>
        {faculties.map((fac) => (
          <option key={fac.email} value={fac.email}>
            {fac.firstName} {fac.lastName} ({fac.email})
          </option>
        ))}
      </select>

      <button onClick={handleSubmit}>➕ Create Announcement</button>
    </div>
  );
};

export default AdminPlacementCreate;
