import React, { useState } from "react";
import "../styles/AdminAnnouncements.css";

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([
    { id: 1, title: "Upcoming Placement Drive", content: "Google placement drive scheduled for March 15th." },
    { id: 2, title: "Resume Workshop", content: "Join our resume-building session on March 10th." },
  ]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "" });

  const handleAddAnnouncement = () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;
    setAnnouncements([{ id: Date.now(), ...newAnnouncement }, ...announcements]);
    setNewAnnouncement({ title: "", content: "" });
  };

  return (
    <div className="admin-announcements">
      <h1>📢 Announcements</h1>
      <div className="add-announcement">
        <input
          type="text"
          placeholder="Title"
          value={newAnnouncement.title}
          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
        />
        <textarea
          placeholder="Content"
          value={newAnnouncement.content}
          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
        />
        <button onClick={handleAddAnnouncement}>➕ Add Announcement</button>
      </div>
      <ul className="announcement-list">
        {announcements.map((ann) => (
          <li key={ann.id}>
            <h3>{ann.title}</h3>
            <p>{ann.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminAnnouncements;
