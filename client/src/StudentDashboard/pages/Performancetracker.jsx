import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/StudentSelections.css";

const StudentSelections = ({ user }) => {
  const [selections, setSelections] = useState([]);

  useEffect(() => {
    if (user && user.email) {
      const emailToQuery = user.email.trim().toLowerCase();
      fetchSelections(emailToQuery);
    }
  }, [user]);

  const fetchSelections = async (email) => {
    try {
      const res = await axios.get("http://localhost:8080/api/studentSelections", {
        params: { studentEmail: email }
      });

      const rawSelections = res.data;

      // ✅ Group by company + jobRole and keep max round only
      const map = {};
      rawSelections.forEach((sel) => {
        const key = `${sel.companyName}__${sel.jobRole}`;
        if (!map[key] || sel.roundNumber > map[key].roundNumber) {
          map[key] = sel;
        }
      });

      const finalSelections = Object.values(map);
      setSelections(finalSelections);
    } catch (error) {
      console.error("Error fetching student selections:", error);
    }
  };

  return (
    <div className="student-selections-container">
      <h2>🎯 My Placement Performance</h2>
      {selections.length === 0 ? (
        <p>No placement history found.</p>
      ) : (
        <table className="student-performance-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Job Role</th>
              <th>Max Round</th>
              <th>Next Round Venue</th>
              <th>Next Round Time</th>
            </tr>
          </thead>
          <tbody>
            {selections.map((sel) => (
              <tr key={`${sel.companyName}_${sel.jobRole}`}>
                <td>{sel.companyName}</td>
                <td>{sel.jobRole}</td>
                <td>{sel.roundNumber}</td>
                <td>{sel.nextRoundVenue}</td>
                <td>{new Date(sel.nextRoundTime).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StudentSelections;
