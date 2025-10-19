import React, { useState, useEffect } from "react";
import axios from "axios";
import Papa from "papaparse";
import "../styles/Attendance.css";

const Attendance = () => {
  const [user, setUser] = useState(null);
  const [assignedCompanies, setAssignedCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedJobRole, setSelectedJobRole] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get("http://localhost:8080/api/users/me", config);
        setUser(res.data);
        fetchAssignedCompanies(res.data.email);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    const fetchAssignedCompanies = async (facultyEmail) => {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/announcements/faculty?assignedFacultyEmail=${facultyEmail}`
        );
        setAssignedCompanies(res.data);
      } catch (err) {
        console.error("Error fetching assigned companies:", err);
      }
    };

    fetchUser();
  }, []);

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!selectedCompany || !selectedJobRole || !csvFile) {
      alert("Please select a company, job role, and upload a CSV file.");
      return;
    }

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const payload = {
            companyName: selectedCompany,
            jobRole: selectedJobRole,
            attendanceList: results.data,
          };
          await axios.post("http://localhost:8080/api/announcements/uploadAttendance", payload);
          setMessage("✅ Attendance uploaded successfully!");
          setCsvFile(null);
        } catch (error) {
          console.error("Error uploading attendance:", error);
          setMessage("❌ Failed to upload attendance.");
        }
      },
      error: (err) => {
        console.error("CSV parse error:", err);
        setMessage("❌ Failed to parse CSV file.");
      },
    });
  };

  return (
    <div className="attendance-page">
      <h1>📥 Upload Attendance</h1>
      <div className="upload-section">
        <select
          value={`${selectedCompany}__${selectedJobRole}`}
          onChange={(e) => {
            const [company, role] = e.target.value.split("__");
            setSelectedCompany(company);
            setSelectedJobRole(role);
          }}
        >
          <option value="">-- Select Company & Job Role --</option>
          {assignedCompanies.map((c, idx) => (
            <option key={idx} value={`${c.companyName}__${c.jobRole}`}>
              {c.companyName} ({c.jobRole})
            </option>
          ))}
        </select>

        <input type="file" accept=".csv" onChange={handleFileChange} />
        <button onClick={handleSubmit}>Upload Attendance</button>
        {message && <p className="upload-message">{message}</p>}
      </div>
    </div>
  );
};

export default Attendance;
