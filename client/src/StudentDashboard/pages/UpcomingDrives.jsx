import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/UpcomingDrives.css";
import { recordPerformanceEvent } from "../../lib/performance";

// Eligibility status cache to avoid repeat calls in a session
const eligibilityCache = {}; // key: driveId -> { eligible, message }

// Enhanced to support direct application via /api/applications when window open

const UpcomingDrives = () => {
  const [drives, setDrives] = useState([]);
  const [apps, setApps] = useState({}); // map driveId -> application
  const [eligibility, setEligibility] = useState({}); // map driveId -> { eligible, message }
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const fetchUserAndDrives = async () => {
      try {
        const token = localStorage.getItem("token");
        const userRes = await axios.get("http://localhost:8080/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const studentEmail = userRes.data.email;
        localStorage.setItem("studentEmail", studentEmail);
        // Fetch drives from new drives API
        const driveRes = await axios.get("http://localhost:8080/api/drives", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allDrives = driveRes.data || [];
        // Fetch existing applications for student
        const appsRes = await axios.get(
          "http://localhost:8080/api/applications",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const myApps = appsRes.data || [];
        const appsMap = {};
        myApps.forEach((a) => {
          appsMap[a.driveId] = a;
        });
        setApps(appsMap);
        const openDrives = allDrives.filter((d) => d.status !== "Closed");
        setDrives(openDrives);

        // Trigger eligibility checks after drives load
        runEligibilityChecks(openDrives);
      } catch (error) {
        console.error("Error fetching upcoming drives:", error);
      }
    };

    fetchUserAndDrives();
  }, []);

  const apply = async (driveId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        "http://localhost:8080/api/applications/apply",
        { driveId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApps((prev) => ({ ...prev, [driveId]: res.data }));
      const email = localStorage.getItem("studentEmail");
      if (email)
        recordPerformanceEvent(email, "driveRegistered", {
          driveId,
        });
      alert("Application submitted");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to apply");
    }
  };

  // Batch eligibility checks for drives
  const runEligibilityChecks = async (driveList) => {
    if (!driveList || driveList.length === 0) return;
    setChecking(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const results = {};
    await Promise.all(
      driveList.map(async (d) => {
        // Skip if already applied (no need) or cached
        if (eligibilityCache[d._id]) {
          results[d._id] = eligibilityCache[d._id];
          return;
        }
        try {
          const payload = {
            companyName: d.companyName,
            jobRole: d.roleTitle,
          };
          const res = await axios.post(
            "http://localhost:8080/api/eligibility/check",
            payload,
            { headers }
          );
          results[d._id] = {
            eligible: res.data.eligible,
            message: res.data.message,
          };
          eligibilityCache[d._id] = results[d._id];
        } catch (err) {
          console.error("Eligibility check failed", err);
          results[d._id] = {
            eligible: false,
            message: "Could not verify eligibility",
          };
        }
      })
    );
    setEligibility(results);
    setChecking(false);
  };

  const renderEligibilityBadge = (driveId) => {
    const status = eligibility[driveId];
    if (!status)
      return checking ? (
        <span className="badge" style={{ background: "#eee", color: "#666" }}>
          Checking...
        </span>
      ) : null;
    const baseStyle = {
      padding: "4px 8px",
      borderRadius: 6,
      fontSize: 12,
      display: "inline-block",
      maxWidth: "280px",
    };
    if (status.eligible) {
      return (
        <span
          className="badge"
          title={status.message}
          style={{
            ...baseStyle,
            background: "var(--success-bg, #e6f9ed)",
            color: "var(--success-fg, #1b5e20)",
            border: "1px solid #c8e6c9",
          }}
        >
          Eligible
        </span>
      );
    }
    return (
      <span
        className="badge"
        title={status.message}
        style={{
          ...baseStyle,
          background: "var(--danger-bg, #fdecea)",
          color: "var(--danger-fg, #c62828)",
          border: "1px solid #f5c6cb",
        }}
      >
        Not Eligible
      </span>
    );
  };

  return (
    <div className="upcoming-drives-page">
      <h2 style={{ marginBottom: 16 }}>Placement Drives</h2>
      {drives.length === 0 ? (
        <p>No upcoming drives.</p>
      ) : (
        drives.map((d) => (
          <div key={d._id} className="drive-card">
            <h3 style={{ marginBottom: 4 }}>
              {d.title} • {d.companyName}
            </h3>
            <p style={{ fontSize: 13, color: "var(--muted-color)" }}>
              {d.roleTitle}
            </p>
            <p style={{ marginTop: 6 }}>
              <strong>Status:</strong> {d.status}
            </p>
            {d.applicationWindow?.opensAt && d.applicationWindow?.closesAt && (
              <p style={{ fontSize: 12 }}>
                <strong>Window:</strong>{" "}
                {new Date(d.applicationWindow.opensAt).toLocaleString()} →{" "}
                {new Date(d.applicationWindow.closesAt).toLocaleString()}
              </p>
            )}
            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {renderEligibilityBadge(d._id)}
              {apps[d._id] ? (
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
                  Applied • {apps[d._id].status}
                </span>
              ) : d.status === "ApplicationsOpen" ? (
                <button
                  className="btn btn-primary"
                  onClick={() => apply(d._id)}
                  disabled={eligibility[d._id] && !eligibility[d._id].eligible}
                  title={
                    eligibility[d._id] && !eligibility[d._id].eligible
                      ? eligibility[d._id].message
                      : "Apply to this drive"
                  }
                >
                  {eligibility[d._id] && !eligibility[d._id].eligible
                    ? "Ineligible"
                    : "Apply"}
                </button>
              ) : (
                <button className="btn btn-outline" disabled>
                  Apply
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default UpcomingDrives;
