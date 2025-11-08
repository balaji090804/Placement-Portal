import React, { useState } from "react";

// Minimal lecture scheduling form. Enhancements (class linking, duration) can be added later.
const ScheduleLecture = () => {
  const [title, setTitle] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [room, setRoom] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!title || !dateTime) {
      setStatus({ type: "error", msg: "Title and Date/Time required" });
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/lectures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          dateTime: new Date(dateTime).toISOString(),
          room,
          description,
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed (${res.status})`);
      }
      const json = await res.json();
      setStatus({
        type: "success",
        msg: `Lecture scheduled for ${new Date(
          json.dateTime
        ).toLocaleString()}`,
      });
      setTitle("");
      setDateTime("");
      setRoom("");
      setDescription("");
    } catch (err) {
      setStatus({ type: "error", msg: err.message || "Failed to schedule" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: "1.25rem", maxWidth: 520 }}>
      <h2>Schedule Lecture</h2>
      <form
        onSubmit={submit}
        className="form-grid"
        style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
      >
        <label>
          <span className="muted small">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Algorithms - Week 2"
          />
        </label>
        <label>
          <span className="muted small">Date & Time</span>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
          />
        </label>
        <label>
          <span className="muted small">Room (optional)</span>
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Lab-3"
          />
        </label>
        <label>
          <span className="muted small">Description (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Agenda or topics"
          />
        </label>
        <button disabled={loading} className="btn btn-primary" type="submit">
          {loading ? "Scheduling..." : "Schedule"}
        </button>
      </form>
      {status && (
        <p
          style={{
            marginTop: "0.75rem",
            color: status.type === "error" ? "#b00020" : "#0a7d20",
          }}
        >
          {status.msg}
        </p>
      )}
    </div>
  );
};

export default ScheduleLecture;
