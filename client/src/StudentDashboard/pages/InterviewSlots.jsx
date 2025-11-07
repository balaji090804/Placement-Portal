import React, { useEffect, useState } from "react";
import axios from "axios";

export default function InterviewSlots() {
  const [driveId, setDriveId] = useState("");
  const [drives, setDrives] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const loadDrives = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/drives", {
        headers,
      });
      setDrives(res.data || []);
    } catch {}
  };
  const loadSlots = async () => {
    if (!driveId) {
      setSlots([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:8080/api/interview-slots?driveId=${driveId}`,
        { headers }
      );
      setSlots(res.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrives();
  }, []);
  useEffect(() => {
    loadSlots();
  }, [driveId]);

  const book = async (id) => {
    try {
      await axios.post(
        `http://localhost:8080/api/interview-slots/${id}/book`,
        {},
        { headers }
      );
      await loadSlots();
      alert("Booked");
    } catch (e) {
      alert(e?.response?.data?.message || "Booking failed");
    }
  };
  const cancel = async (id) => {
    try {
      await axios.post(
        `http://localhost:8080/api/interview-slots/${id}/cancel`,
        {},
        { headers }
      );
      await loadSlots();
      alert("Cancelled");
    } catch (e) {
      alert(e?.response?.data?.message || "Cancel failed");
    }
  };

  return (
    <div className="card" style={{ marginLeft: 220, padding: 24 }}>
      <h2 className="section-title" style={{ marginBottom: 12 }}>
        Interview Slots
      </h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <select value={driveId} onChange={(e) => setDriveId(e.target.value)}>
          <option value="">Select a drive</option>
          {drives.map((d) => (
            <option key={d._id} value={d._id}>
              {d.title} • {d.companyName}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {slots.map((s) => {
            const remaining = Math.max(
              0,
              (s.capacity || 0) - (s.bookedEmails?.length || 0)
            );
            return (
              <div
                key={s._id}
                className="card"
                style={{ padding: 12, border: "1px solid var(--border-color)" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {new Date(s.slotStart).toLocaleString()} →{" "}
                      {new Date(s.slotEnd).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted-color)" }}>
                      Capacity: {s.capacity} • Remaining: {remaining}
                    </div>
                  </div>
                  <div>
                    {remaining > 0 ? (
                      <button
                        className="btn btn-primary"
                        onClick={() => book(s._id)}
                      >
                        Book
                      </button>
                    ) : (
                      <button className="btn btn-outline" disabled>
                        Full
                      </button>
                    )}
                    <button
                      className="btn btn-outline"
                      style={{ marginLeft: 8 }}
                      onClick={() => cancel(s._id)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
