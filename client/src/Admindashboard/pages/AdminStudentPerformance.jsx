import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../styles/StudentSelections.css";

const Performancetracker = () => {
  const [selections, setSelections] = useState([]);
  const [filteredStudent, setFilteredStudent] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [roundFilter, setRoundFilter] = useState("");
  const printRef = useRef();

  useEffect(() => {
    fetchSelections();
  }, []);

  const fetchSelections = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/studentSelections");
      setSelections(res.data);
    } catch (err) {
      console.error("Error fetching performance data:", err);
    }
  };

  const fetchRollNumberForEmail = async (email) => {
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const res = await axios.get(`http://localhost:8080/api/student-profile?email=${email}`, config);
      return res.data.regNo || "";
    } catch (err) {
      console.error(`Error fetching roll number for ${email}:`, err);
      return "";
    }
  };

  const handleSearch = async () => {
    let matches = selections;

    if (searchEmail.trim()) {
      matches = matches.filter(sel =>
        sel.studentEmail.toLowerCase() === searchEmail.trim().toLowerCase()
      );
    }

    if (companyFilter.trim()) {
      matches = matches.filter(sel =>
        sel.companyName.toLowerCase().includes(companyFilter.trim().toLowerCase())
      );
    }

    if (roundFilter.trim()) {
      matches = matches.filter(sel => sel.roundNumber.toString() === roundFilter.trim());
    }

    // Fetch roll numbers for all unique emails
    const emailToRollMap = {};
    const uniqueEmails = [...new Set(matches.map(m => m.studentEmail))];
    await Promise.all(
      uniqueEmails.map(async (email) => {
        const roll = await fetchRollNumberForEmail(email);
        emailToRollMap[email] = roll;
      })
    );

    // Attach roll number to each matched record
    const enrichedMatches = matches.map(m => ({
      ...m,
      rollNumber: emailToRollMap[m.studentEmail] || ""
    }));

    setFilteredStudent(enrichedMatches);
  };

  const downloadCSV = () => {
    if (!filteredStudent || filteredStudent.length === 0) return;

    const csvHeader = [
      "Student Name",
      "Roll Number",
      "Student Email",
      "Company",
      "Job Role",
      "Max Round"
    ];

    const csvRows = filteredStudent.map(rec => [
      rec.studentName,
      rec.rollNumber,
      rec.studentEmail,
      rec.companyName,
      rec.jobRole,
      rec.roundNumber
    ]);

    const csvContent = [csvHeader, ...csvRows]
      .map(e => e.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="performance-tracker-container">
      <h1>📈 Placement Performance Tracker</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by student email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by company..."
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
        />
        <input
          type="number"
          placeholder="Filter by round..."
          value={roundFilter}
          onChange={(e) => setRoundFilter(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {filteredStudent.length > 0 ? (
        <div ref={printRef}>
          <h3>Results for: {searchEmail || "[All Students]"}</h3>
          <button className="download-btn" onClick={downloadCSV}>📥 Download CSV</button>
          <button className="print-btn" onClick={handlePrint}>🖨️ Print Report</button>
          <table className="performance-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Email</th>
                <th>Company</th>
                <th>Job Role</th>
                <th>Max Round</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudent.map((rec, idx) => (
                <tr key={idx}>
                  <td>{rec.studentName}</td>
                  <td>{rec.rollNumber}</td>
                  <td>{rec.studentEmail}</td>
                  <td>{rec.companyName}</td>
                  <td>{rec.jobRole}</td>
                  <td>{rec.roundNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>🔍 Enter filters to view student performance.</p>
      )}
    </div>
  );
};

export default Performancetracker;
