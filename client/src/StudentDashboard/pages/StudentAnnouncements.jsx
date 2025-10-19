import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/StudentAnnouncements.css";

const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [user, setUser] = useState(null);
  useEffect(() => {
    const fetchUserAndAnnouncements = async () => {
      try {
        const token = localStorage.getItem("token");
        const userRes = await axios.get("http://localhost:8080/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const email = userRes.data.email;
        setUser(userRes.data);
  
        const res = await axios.get(
          `http://localhost:8080/api/announcements/student?studentEmail=${email}`
        );
        setAnnouncements(res.data);
      } catch (err) {
        console.error("Error fetching announcements:", err);
      }
    };
  
    fetchUserAndAnnouncements();
  }, []);
  

  return (
    <div className="student-announcements-page">
      <h2>📢 Placement Announcements</h2>

      {announcements.length === 0 ? (
        <p>No announcements available right now.</p>
      ) : (
        announcements.map((ann) => (
          <div key={ann._id} className="announcement-card">
            <h3>{ann.companyName?.trim()} – {ann.jobRole}</h3>
            <p><strong>Drive Date:</strong> {new Date(ann.dateTime).toLocaleString()}</p>

            {ann.venue && <p><strong>Venue:</strong> {ann.venue}</p>}
            {ann.prePlacementTalkVenue && ann.prePlacementTalkTime && (
              <p><strong>Pre-placement Talk:</strong> {ann.prePlacementTalkVenue} at {new Date(ann.prePlacementTalkTime).toLocaleString()}</p>
            )}
            {ann.alumniInteractionTime && (
              <p><strong>Alumni Interaction:</strong> {new Date(ann.alumniInteractionTime).toLocaleString()}</p>
            )}
            {ann.requiredItems && (
              <p><strong>Required Items:</strong> {ann.requiredItems}</p>
            )}
            {ann.extraInfo && (
              <p><strong>Info:</strong> {ann.extraInfo}</p>
            )}
            {Array.isArray(ann.rounds) && ann.rounds.length > 0 && (
              <>
                <strong>Rounds:</strong>
                <ul>
                  {ann.rounds.map((round, index) => (
                    <li key={index}>
                      {round.roundType} – {new Date(round.roundTime).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default StudentAnnouncements;
