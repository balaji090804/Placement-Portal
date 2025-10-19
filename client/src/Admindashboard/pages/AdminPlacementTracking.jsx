import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/AdminPlacementTracking.css";

const AdminPlacementTracking = () => {
  const [trackingData, setTrackingData] = useState([]);

  useEffect(() => {
    fetchTrackingData();
  }, []);

  const fetchTrackingData = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/studentSelections");
      const grouped = groupByCompany(res.data);
      setTrackingData(grouped);
    } catch (err) {
      console.error("Error fetching tracking data:", err);
    }
  };

  const groupByCompany = (records) => {
    const map = {};
    records.forEach((rec) => {
      const key = `${rec.companyName}__${rec.jobRole}`;
      if (!map[key]) {
        map[key] = {
          companyName: rec.companyName,
          jobRole: rec.jobRole,
          students: []
        };
      }
      let student = map[key].students.find(s => s.studentEmail === rec.studentEmail);
      if (!student) {
        student = {
          studentName: rec.studentName,
          studentEmail: rec.studentEmail,
          rounds: []
        };
        map[key].students.push(student);
      }
      student.rounds.push({
        roundNumber: rec.roundNumber,
        venue: rec.nextRoundVenue,
        time: rec.nextRoundTime
      });
    });

    Object.values(map).forEach(group => {
      group.students.forEach(student => {
        student.rounds.sort((a, b) => a.roundNumber - b.roundNumber);
      });
    });

    return Object.values(map);
  };

  const downloadCSV = (companyName, jobRole, students) => {
    const csvHeader = [
      "Student Name",
      "Student Email",
      "Round Number",
      "Venue",
      "Time"
    ];

    const csvRows = [];
    students.forEach(student => {
      student.rounds.forEach(round => {
        csvRows.push([
          student.studentName,
          student.studentEmail,
          round.roundNumber,
          round.venue,
          new Date(round.time).toLocaleString()
        ]);
      });
    });

    const csvContent = [csvHeader, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${companyName}_${jobRole}_Tracking.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-placement-tracking">
      <h1>📊 Current Placement Process Tracker</h1>
      {trackingData.length === 0 ? (
        <p>No tracking data available yet.</p>
      ) : (
        trackingData.map((group, idx) => (
          <div className="company-block" key={idx}>
            <div className="company-header">
              <h2>{group.companyName}</h2>
              <p><strong>Role:</strong> {group.jobRole}</p>
              <button onClick={() => downloadCSV(group.companyName, group.jobRole, group.students)}>
                📥 Download CSV
              </button>
            </div>
            <div className="tracking-grid">
              {group.students.map((student, sidx) => (
                <div className="tracking-card" key={sidx}>
                  <h3>{student.studentName}</h3>
                  <p><strong>Email:</strong> {student.studentEmail}</p>
                  <div className="rounds-list">
                    <h4>Rounds Completed:</h4>
                    <ul>
                      {student.rounds.map((r, i) => (
                        <li key={i}>
                          ✅ Round {r.roundNumber} — <strong>{r.venue}</strong> @ {new Date(r.time).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminPlacementTracking;
