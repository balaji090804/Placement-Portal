import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:8080/api/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApps(res.data || []);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="card" style={{ marginLeft: 220, padding: 24 }}>
      <h2 className="section-title" style={{ marginBottom: 8 }}>
        My Applications
      </h2>
      {loading ? (
        <p>Loading...</p>
      ) : apps.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {apps.map((a) => (
            <div
              key={a._id}
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
                    {a.studentName || a.studentEmail}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted-color)" }}>
                    Drive: {a.driveId}
                  </div>
                </div>
                <div>
                  <span
                    className="badge"
                    style={{
                      background: "var(--accent-bg)",
                      color: "var(--accent-fg)",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    {a.status}
                  </span>
                </div>
              </div>
              {a.notes && (
                <div style={{ marginTop: 6, fontSize: 12 }}>{a.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
