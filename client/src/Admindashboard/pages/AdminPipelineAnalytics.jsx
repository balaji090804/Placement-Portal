import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../app.css";

const STATUS = [
  "Applied",
  "Eligible",
  "Shortlisted",
  "Rejected",
  "InterviewScheduled",
  "Offered",
  "Joined",
];

export default function AdminPipelineAnalytics() {
  const [driveId, setDriveId] = useState("");
  const [drives, setDrives] = useState([]);
  const [stats, setStats] = useState({ byStatus: {}, total: 0 });

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
  const loadStats = async () => {
    try {
      const url = driveId
        ? `http://localhost:8080/api/applications/analytics?driveId=${driveId}`
        : `http://localhost:8080/api/applications/analytics`;
      const res = await axios.get(url, { headers });
      setStats(res.data || { byStatus: {}, total: 0 });
    } catch {}
  };

  useEffect(() => {
    loadDrives();
  }, []);
  useEffect(() => {
    loadStats();
  }, [driveId]);

  const total = stats.total || 0;

  return (
    <div style={{ marginLeft: 220, padding: 24 }}>
      <h2 className="section-title" style={{ marginBottom: 12 }}>
        Pipeline Analytics
      </h2>
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <select value={driveId} onChange={(e) => setDriveId(e.target.value)}>
          <option value="">All Drives</option>
          {drives.map((d) => (
            <option key={d._id} value={d._id}>
              {d.title} • {d.companyName}
            </option>
          ))}
        </select>
      </div>
      <div className="card" style={{ padding: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0,1fr))",
            gap: 12,
          }}
        >
          {STATUS.map((s) => {
            const c = stats.byStatus?.[s] || 0;
            const pct = total ? Math.round((c / total) * 100) : 0;
            return (
              <div
                key={s}
                className="card"
                style={{ padding: 12, border: "1px solid var(--border-color)" }}
              >
                <div style={{ fontWeight: 600 }}>{s}</div>
                <div style={{ fontSize: 24, marginTop: 6 }}>{c}</div>
                <div style={{ fontSize: 12, color: "var(--muted-color)" }}>
                  {pct}%
                </div>
                <div
                  style={{
                    marginTop: 8,
                    height: 6,
                    background: "var(--surface-2)",
                    borderRadius: 4,
                  }}
                >
                  <div
                    style={{
                      height: 6,
                      background: "var(--brand-color)",
                      width: `${pct}%`,
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
