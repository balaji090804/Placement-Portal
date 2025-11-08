import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Interviews.css";
import { onEvent } from "../../lib/socket";

const Interviews = () => {
  const [requests, setRequests] = useState([]);
  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [meetingLink, setMeetingLink] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchInterviewRequests();
    fetchScheduledInterviews();
    const off1 = onEvent("interviews:update", () => {
      fetchInterviewRequests();
      fetchScheduledInterviews();
    });
    const off2 = onEvent("dashboard:update", () => {
      fetchInterviewRequests();
      fetchScheduledInterviews();
    });
    return () => {
      if (typeof off1 === "function") off1();
      if (typeof off2 === "function") off2();
    };
  }, []);

  // ✅ Fetch interview requests from students
  const fetchInterviewRequests = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/interviews/requests"
      );
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching interview requests:", error);
    }
  };

  // ✅ Fetch scheduled interviews
  const fetchScheduledInterviews = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/interviews/scheduled"
      );
      setScheduledInterviews(response.data);
    } catch (error) {
      console.error("Error fetching scheduled interviews:", error);
    }
  };

  // ✅ Schedule an interview and notify the student
  const scheduleInterview = async (requestId) => {
    if (!meetingLink.trim() || !date.trim() || !time.trim()) {
      alert("Please fill all fields before scheduling.");
      return;
    }

    setLoading(true);
    setSuccessMessage("");

    try {
      const response = await axios.post(
        "http://localhost:8080/api/interviews/schedule",
        {
          requestId,
          meetingLink,
          date,
          time,
        }
      );

      setSuccessMessage(response.data.message);
      fetchInterviewRequests(); // Refresh pending requests
      fetchScheduledInterviews(); // Refresh scheduled interviews
      setSelectedRequest(null); // Reset form fields
      setMeetingLink("");
      setDate("");
      setTime("");
    } catch (error) {
      console.error("Error scheduling interview:", error);
      alert("Failed to schedule interview.");
    }
    setLoading(false);
  };

  return (
    <div className="faculty-interviews">
      <h1>Manage Interviews</h1>

      <section className="interview-requests">
        <h2>Interview Requests</h2>
        {requests.length === 0 ? (
          <p>No interview requests pending.</p>
        ) : (
          <ul className="request-list">
            {requests.map((req) => (
              <li key={req._id}>
                <h3>{req.studentName}</h3>
                <p>Email: {req.studentEmail}</p>
                <p>Status: {req.status}</p>
                <button onClick={() => setSelectedRequest(req)}>
                  Schedule
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectedRequest && (
        <section className="schedule-section">
          <h2>Schedule Interview for {selectedRequest.studentName}</h2>
          <input
            type="text"
            placeholder="Google Meet Link"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <button
            onClick={() => scheduleInterview(selectedRequest._id)}
            disabled={loading}
          >
            {loading ? "Scheduling..." : "Confirm & Send Mail"}
          </button>
        </section>
      )}

      {successMessage && <p className="success-message">{successMessage}</p>}

      <section className="scheduled-interviews">
        <h2>Scheduled Interviews</h2>
        {scheduledInterviews.length === 0 ? (
          <p>No scheduled interviews.</p>
        ) : (
          <ul className="interview-list">
            {scheduledInterviews.map((int) => (
              <li key={int._id}>
                <h3>{int.studentName}</h3>
                <p>Email: {int.studentEmail}</p>
                <p>
                  📅 {int.date} | ⏰ {int.time}
                </p>
                <p>
                  🔗{" "}
                  <a
                    href={int.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Google Meet
                  </a>
                </p>
                <p>Status: {int.status}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Interviews;
