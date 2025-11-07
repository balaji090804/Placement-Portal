import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:8080/api/notifications?unread=true",
        { headers }
      );
      setItems(res.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await axios.post(
        `http://localhost:8080/api/notifications/${id}/read`,
        {},
        { headers }
      );
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="card" style={{ marginLeft: 220, padding: 24 }}>
      <h2 className="section-title" style={{ marginBottom: 8 }}>
        Notifications
      </h2>
      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>No new notifications.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((n) => (
            <div
              key={n._id}
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
                  <div style={{ fontWeight: 600 }}>{n.title}</div>
                  {n.message && (
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {n.message}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted-color)",
                      marginTop: 4,
                    }}
                  >
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <button
                    className="btn btn-outline"
                    onClick={() => markRead(n._id)}
                  >
                    Mark read
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
