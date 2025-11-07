import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../../app.css";

const STATUS_FLOW = [
  "Applied",
  "Eligible",
  "Shortlisted",
  "Rejected",
  "InterviewScheduled",
  "Offered",
  "Joined",
];

export default function AdminApplications() {
  const [driveFilter, setDriveFilter] = useState("");
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drives, setDrives] = useState([]);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const loadDrives = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/drives", {
        headers,
      });
      setDrives(res.data || []);
    } catch {
      /* */
    }
  };

  const loadApps = async () => {
    setLoading(true);
    try {
      const url = driveFilter
        ? `http://localhost:8080/api/applications?driveId=${driveFilter}`
        : "http://localhost:8080/api/applications";
      const res = await axios.get(url, { headers });
      setApps(res.data || []);
    } catch (e) {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrives();
  }, []);
  useEffect(() => {
    loadApps();
  }, [driveFilter]);

  const advance = async (app, toStatus) => {
    try {
      const res = await axios.patch(
        `http://localhost:8080/api/applications/${app._id}/status`,
        { status: toStatus },
        { headers }
      );
      setApps((prev) => prev.map((a) => (a._id === app._id ? res.data : a)));
      toast.success(`Updated to ${toStatus}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Status update failed");
    }
  };

  return (
    <div style={{ marginLeft: 220, padding: 24 }}>
      <h2 className="section-title" style={{ marginBottom: 16 }}>
        Applications
      </h2>
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <select
            value={driveFilter}
            onChange={(e) => setDriveFilter(e.target.value)}
          >
            <option value="">All Drives</option>
            {drives.map((d) => (
              <option key={d._id} value={d._id}>
                {d.title} • {d.companyName}
              </option>
            ))}
          </select>
          <button className="btn btn-outline" onClick={loadApps}>
            Refresh
          </button>
        </div>
      </div>
      <div className="card" style={{ padding: 16 }}>
        {loading ? (
          <p>Loading...</p>
        ) : apps.length === 0 ? (
          <p className="empty-message">No applications found.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {apps.map((a) => {
              const currentIdx = STATUS_FLOW.indexOf(a.status);
              const nextCandidates = STATUS_FLOW.filter(
                (s, i) => i !== currentIdx && i >= currentIdx
              );
              return (
                <div
                  key={a._id}
                  className="card"
                  style={{
                    padding: 12,
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>
                        {a.studentName || a.studentEmail}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "var(--muted-color)" }}
                      >
                        Drive ID: {a.driveId}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>
                        Status: <b>{a.status}</b>
                      </div>
                      {a.notes && (
                        <div style={{ marginTop: 4, fontSize: 12 }}>
                          {a.notes}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        maxWidth: 360,
                      }}
                    >
                      {nextCandidates.map((s) => (
                        <button
                          key={s}
                          className="btn btn-outline"
                          onClick={() => advance(a, s)}
                          disabled={a.status === s}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  {a.history && a.history.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <details>
                        <summary style={{ cursor: "pointer", fontSize: 12 }}>
                          History ({a.history.length})
                        </summary>
                        <ul
                          style={{
                            listStyle: "none",
                            paddingLeft: 0,
                            fontSize: 11,
                          }}
                        >
                          {a.history
                            .slice()
                            .reverse()
                            .map((h, i) => (
                              <li
                                key={i}
                                style={{
                                  borderBottom: "1px solid var(--border-color)",
                                  padding: "4px 0",
                                }}
                              >
                                <span style={{ color: "var(--muted-color)" }}>
                                  {new Date(h.at).toLocaleString()}
                                </span>{" "}
                                • {h.action} → {h.meta?.status} by {h.by}
                              </li>
                            ))}
                        </ul>
                      </details>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
