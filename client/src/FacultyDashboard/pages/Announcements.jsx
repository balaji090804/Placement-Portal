import React, { useState, useEffect } from "react";
import axios from "axios";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // ✅ 1. Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const res = await axios.get("http://localhost:8080/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(res.data);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  // ✅ 2. Fetch faculty announcements assigned to them
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        if (user?.role === "faculty" && user?.email) {
          const url = `http://localhost:8080/api/announcements/faculty?assignedFacultyEmail=${encodeURIComponent(
            user.email
          )}`;
          const res = await axios.get(url);
          setAnnouncements(res.data);
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchAnnouncements();
  }, [user]);

  if (loading) return <p>Loading announcements...</p>;

  if (!announcements.length) {
    return <p>No placement announcements assigned to you.</p>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "30px auto" }}>
      <h2>📋 My Placement Assignments</h2>
      {announcements.map((ann) => (
        <div
          key={ann._id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "15px",
            backgroundColor: ann.isCompleted ? "#e6ffe6" : "#fff",
          }}
        >
          <h3 style={{ marginBottom: "5px" }}>
            {ann.companyName} – {ann.jobRole}
          </h3>
          <p>
            <strong>Date/Time:</strong>{" "}
            {new Date(ann.dateTime).toLocaleString()}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            {ann.isCompleted ? "✅ Completed" : "⏳ Pending Faculty Update"}
          </p>
        </div>
      ))}
    </div>
  );
};

export default Announcements;
