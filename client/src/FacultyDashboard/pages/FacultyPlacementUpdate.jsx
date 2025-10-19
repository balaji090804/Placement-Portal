import React, { useState, useEffect } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import "../styles/FacultyPlacementUpdate.css";

const FacultyPlacementUpdate = () => {
  const { user } = useOutletContext();
  const [loggedInEmail, setLoggedInEmail] = useState("");
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const [venue, setVenue] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [prePlacementTalkVenue, setPrePlacementTalkVenue] = useState("");
  const [prePlacementTalkTime, setPrePlacementTalkTime] = useState("");
  const [alumniInteractionTime, setAlumniInteractionTime] = useState("");
  const [rounds, setRounds] = useState([]);
  const [roundType, setRoundType] = useState("");
  const [roundTime, setRoundTime] = useState("");
  const [requiredItems, setRequiredItems] = useState("");

  useEffect(() => {
    if (user?.email) {
      setLoggedInEmail(user.email);
      fetchAssignedAnnouncements(user.email);
    }
  }, [user]);

  const fetchAssignedAnnouncements = async (email) => {
    try {
      const res = await axios.get("http://localhost:8080/api/announcements/faculty", {
        params: { assignedFacultyEmail: email },
      });

      const pending = res.data.filter((ann) => ann.isCompleted === false);
      setAllAnnouncements(pending);
    } catch (error) {
      console.error("Error loading faculty announcements:", error);
    }
  };

  const handleSelectAnnouncement = (id) => {
    const selected = allAnnouncements.find((a) => a._id === id);
    setSelectedAnnouncement(selected);

    // Reset inputs
    setVenue("");
    setExtraInfo("");
    setPrePlacementTalkVenue("");
    setPrePlacementTalkTime("");
    setAlumniInteractionTime("");
    setRounds([]);
    setRoundType("");
    setRoundTime("");
    setRequiredItems("");
  };

  const addRound = () => {
    if (!roundType || !roundTime) {
      alert("Please provide both round type and round time.");
      return;
    }
    setRounds([...rounds, { roundType, roundTime }]);
    setRoundType("");
    setRoundTime("");
  };

  const removeRound = (index) => {
    const updated = [...rounds];
    updated.splice(index, 1);
    setRounds(updated);
  };

  const handleUpdate = async () => {
    if (!selectedAnnouncement) {
      alert("Please select an announcement.");
      return;
    }

    const payload = {
      companyName: selectedAnnouncement.companyName,
      jobRole: selectedAnnouncement.jobRole,
      dateTime: selectedAnnouncement.dateTime,
      assignedFacultyEmail: selectedAnnouncement.assignedFacultyEmail,
      venue,
      extraInfo,
      prePlacementTalkVenue,
      prePlacementTalkTime,
      alumniInteractionTime,
      rounds,
      requiredItems,
    };

    try {
      const res = await axios.post("http://localhost:8080/api/announcements/fullCreate", payload);
      alert(res.data.message || "Announcement updated successfully!");
      fetchAssignedAnnouncements(loggedInEmail); // Refresh list
      setSelectedAnnouncement(null); // Reset view
    } catch (err) {
      console.error("Error saving announcement:", err);
      alert("Failed to save announcement.");
    }
  };

  return (
    <div className="faculty-update-container">
      <h2>🛠 Faculty: Update Assigned Placement</h2>

      {/* Select one */}
      <div className="form-group">
        <label>Select a Pending Assignment:</label>
        <select
          onChange={(e) => handleSelectAnnouncement(e.target.value)}
          value={selectedAnnouncement?._id || ""}
        >
          <option value="">-- Select --</option>
          {allAnnouncements.map((a) => (
            <option key={a._id} value={a._id}>
              {a.companyName} - {a.jobRole} | {new Date(a.dateTime).toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {/* Conditional Form */}
      {!selectedAnnouncement ? (
        <p style={{ marginTop: "20px" }}>No assignment selected.</p>
      ) : (
        <>
          <div className="announcement-info">
            <p><strong>Company:</strong> {selectedAnnouncement.companyName}</p>
            <p><strong>Job Role:</strong> {selectedAnnouncement.jobRole}</p>
            <p><strong>Date/Time:</strong> {new Date(selectedAnnouncement.dateTime).toLocaleString()}</p>
          </div>

          <div className="form-group">
            <label>Venue:</label>
            <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Main Hall" />
          </div>

          <div className="form-group">
            <label>Additional Info:</label>
            <textarea value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)} placeholder="Instructions or notes" />
          </div>

          <h3>Pre-Placement Talk</h3>
          <div className="form-group">
            <label>Talk Venue:</label>
            <input type="text" value={prePlacementTalkVenue} onChange={(e) => setPrePlacementTalkVenue(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Talk Time:</label>
            <input type="datetime-local" value={prePlacementTalkTime} onChange={(e) => setPrePlacementTalkTime(e.target.value)} />
          </div>

          <h3>Alumni Interaction</h3>
          <div className="form-group">
            <label>Time:</label>
            <input type="datetime-local" value={alumniInteractionTime} onChange={(e) => setAlumniInteractionTime(e.target.value)} />
          </div>

          <h3>Rounds</h3>
          <div className="rounds-container">
            <div className="round-inputs">
              <label>Round Type:</label>
              <input type="text" value={roundType} onChange={(e) => setRoundType(e.target.value)} placeholder="e.g. Technical Interview" />
              <label>Round Time:</label>
              <input type="datetime-local" value={roundTime} onChange={(e) => setRoundTime(e.target.value)} />
              <button type="button" className="add-round-btn" onClick={addRound}>+ Add Round</button>
            </div>
            <ul className="round-list">
              {rounds.map((r, idx) => (
                <li key={idx}>
                  {r.roundType} at {new Date(r.roundTime).toLocaleString()}
                  <button type="button" onClick={() => removeRound(idx)}>Remove</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="form-group">
            <label>Required Items:</label>
            <textarea value={requiredItems} onChange={(e) => setRequiredItems(e.target.value)} placeholder="e.g. Resume, ID" />
          </div>

          <button className="save-btn" onClick={handleUpdate}>✅ Submit Details</button>
        </>
      )}
    </div>
  );
};

export default FacultyPlacementUpdate;
