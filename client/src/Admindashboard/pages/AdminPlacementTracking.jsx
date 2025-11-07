import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/AdminPlacementTracking.css";

const AdminPlacementTracking = () => {
  const [groups, setGroups] = useState([]);
  const [filter, setFilter] = useState({ q: "", status: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrackingData();
  }, []);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:8080/api/tracking/placements"
      );
      setGroups(res.data?.groups || []);
    } catch (err) {
      console.error("Error fetching tracking data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups
    .filter((g) => (filter.status ? g.driveStatus === filter.status : true))
    .filter((g) => {
      const q = filter.q.trim().toLowerCase();
      if (!q) return true;
      return (
        g.companyName.toLowerCase().includes(q) ||
        g.jobRole.toLowerCase().includes(q) ||
        g.students.some(
          (s) =>
          (s.studentName || "").toLowerCase().includes(q) ||
          (s.studentEmail || "").toLowerCase().includes(q)
        )
      );
    });

  const downloadCSV = (companyName, jobRole, students) => {
    const csvHeader = [
      "Student Name",
      "Student Email",
      "Offer Status",
      "Round Number",
      "Venue",
      "Time"
    ];

    const csvRows = [];
    students.forEach((student) => {
      if (student.rounds.length === 0) {
        csvRows.push([
          student.studentName,
          student.studentEmail,
          student.offerStatus || "",
          "",
          "",
          ""
        ]);
      } else {
        student.rounds.forEach((round) => {
          csvRows.push([
            student.studentName,
            student.studentEmail,
            student.offerStatus || "",
            round.roundNumber,
            round.venue,
            new Date(round.time).toLocaleString()
          ]);
        });
      }
    });

    const csvContent = [csvHeader, ...csvRows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${companyName}_${jobRole}_Tracking.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Aggregate stats (global)
  const global = groups.reduce(
    (acc, g) => {
      acc.drives += 1;
      acc.students += g.students.length;
      for (const s of g.students) {
        if (s.offerStatus === "Accepted") acc.accepted += 1;
        else if (s.offerStatus === "Released") acc.released += 1;
        else if (s.offerStatus === "Declined") acc.declined += 1;
        else acc.inProcess += 1;
      }
      return acc;
    },
    { drives: 0, students: 0, released: 0, accepted: 0, declined: 0, inProcess: 0 }
  );

  const groupStats = (g) => {
    const init = { released: 0, accepted: 0, declined: 0, inProcess: 0 };
    return g.students.reduce((acc, s) => {
      if (s.offerStatus === "Accepted") acc.accepted += 1;
      else if (s.offerStatus === "Released") acc.released += 1;
      else if (s.offerStatus === "Declined") acc.declined += 1;
      else acc.inProcess += 1;
      return acc;
    }, init);
  };

  return (
    <div className="admin-placement-tracking">
      <h1>Current Placement Process Tracker</h1>

      {/* Helper / onboarding hint when no data */}
      {groups.length === 0 && !loading && (
        <div className="empty-hint card">
          <div className="hint-title">No tracking data yet</div>
          <div className="hint-body">
            To populate placement tracking:
            <ol>
              <li>
                Update rounds in AdminAnnouncements/Faculty workflows (this
                creates Student Selections).
              </li>
              <li>
                Manage drive lifecycle in AdminDrives (status updates appear
                here).
              </li>
              <li>
                Release/accept offers in AdminOffers (offer status appears per
                student).
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Global summary */}
      {groups.length > 0 && (
        <div className="summary bar card">
          <div className="chip">
            Drives <span className="chip-val">{global.drives}</span>
          </div>
          <div className="chip">
            Students <span className="chip-val">{global.students}</span>
          </div>
          <div className="chip chip-blue">
            Released <span className="chip-val">{global.released}</span>
          </div>
          <div className="chip chip-green">
            Accepted <span className="chip-val">{global.accepted}</span>
          </div>
          <div className="chip chip-red">
            Declined <span className="chip-val">{global.declined}</span>
          </div>
          <div className="chip chip-grey">
            In Process <span className="chip-val">{global.inProcess}</span>
          </div>
        </div>
      )}

      <div className="filters">
        <input
          placeholder="Search company / role / student"
          value={filter.q}
          onChange={(e) => setFilter({ ...filter, q: e.target.value })}
        />
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
        >
          <option value="">All Drive Status</option>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
          <option value="ApplicationsOpen">ApplicationsOpen</option>
          <option value="Shortlisting">Shortlisting</option>
          <option value="Interviews">Interviews</option>
          <option value="Offers">Offers</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredGroups.length === 0 ? (
        <p className="empty-message">No results match your filters.</p>
      ) : (
        filteredGroups.map((group, idx) => (
          <div className="company-block" key={idx}>
            <div className="company-header">
              <div>
                <h2>{group.companyName}</h2>
                <p>
                  <strong>Role:</strong> {group.jobRole} •{" "}
                  <span className="badge">{group.driveStatus}</span>
                </p>
              </div>
              <div className="company-actions">
                {/* Per-group quick stats */}
                {(() => {
                  const s = groupStats(group);
                  return (
                    <div className="inline-chips">
                      <span className="chip chip-blue">
                        Released <span className="chip-val">{s.released}</span>
                      </span>
                      <span className="chip chip-green">
                        Accepted <span className="chip-val">{s.accepted}</span>
                      </span>
                      <span className="chip chip-red">
                        Declined <span className="chip-val">{s.declined}</span>
                      </span>
                      <span className="chip chip-grey">
                        In Process{" "}
                        <span className="chip-val">{s.inProcess}</span>
                      </span>
                    </div>
                  );
                })()}
                <button
                  onClick={() =>
                    downloadCSV(
                      group.companyName,
                      group.jobRole,
                      group.students
                    )
                  }
                >
                  Download CSV
                </button>
              </div>
            </div>
            <div className="tracking-grid">
              {group.students.map((student, sidx) => (
                <div className="tracking-card" key={sidx}>
                  <h3>
                    {student.studentName}
                    {student.offerStatus && (
                      <span
                        className={`pill ${
                          student.offerStatus === "Accepted"
                            ? "pill-green"
                            : student.offerStatus === "Released"
                            ? "pill-blue"
                            : student.offerStatus === "Declined"
                            ? "pill-red"
                            : "pill-grey"
                        }`}
                      >
                        {student.offerStatus}
                      </span>
                    )}
                  </h3>
                  <p>
                    <strong>Email:</strong> {student.studentEmail}
                  </p>
                  <div className="rounds-list">
                    <h4>Progress</h4>
                    <ul>
                      {student.rounds.map((r, i) => (
                        <li key={i}>
                          Round {r.roundNumber} — <strong>{r.venue}</strong> @{" "}
                          {new Date(r.time).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminPlacementTracking;
