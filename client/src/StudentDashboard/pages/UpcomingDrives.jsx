import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/UpcomingDrives.css";

const UpcomingDrives = () => {
  const [drives, setDrives] = useState([]);

  useEffect(() => {
    const fetchUserAndDrives = async () => {
      try {
        const token = localStorage.getItem("token");
        const userRes = await axios.get("http://localhost:8080/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const studentEmail = userRes.data.email;

        const driveRes = await axios.get(
          `http://localhost:8080/api/announcements/student?studentEmail=${studentEmail}`
        );

        const today = new Date();

        const upcoming = driveRes.data.filter((d) => new Date(d.dateTime) >= today);

        setDrives(upcoming);
      } catch (error) {
        console.error("Error fetching upcoming drives:", error);
      }
    };

    fetchUserAndDrives();
  }, []);

  return (
    <div className="upcoming-drives-page">
      <h2>🚀 Upcoming Placement Drives</h2>
      {drives.length === 0 ? (
        <p>No upcoming drives.</p>
      ) : (
        drives.map((d) => (
          <div key={d._id} className="drive-card">
            <h3>{d.companyName} - {d.jobRole}</h3>
            <p><strong>Date:</strong> {new Date(d.dateTime).toLocaleString()}</p>
            {d.venue && <p><strong>Venue:</strong> {d.venue}</p>}
            {d.prePlacementTalkVenue && d.prePlacementTalkTime && (
              <p><strong>Pre-placement Talk:</strong> {d.prePlacementTalkVenue} at {new Date(d.prePlacementTalkTime).toLocaleString()}</p>
            )}
            {d.alumniInteractionTime && (
              <p><strong>Alumni Interaction:</strong> {new Date(d.alumniInteractionTime).toLocaleString()}</p>
            )}
            {d.requiredItems && (
              <p><strong>Required Items:</strong> {d.requiredItems}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default UpcomingDrives;
