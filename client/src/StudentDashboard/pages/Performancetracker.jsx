import React, { useEffect, useMemo, useState } from "react";
import { onEvent } from "../../lib/socket";
import "../styles/PerformanceTracker.css";

// Utility: format date to yyyy-mm-dd
const fmt = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Build circle arc path for radial gauge
function arcPath(cx, cy, r, pct) {
  const clamped = Math.max(0, Math.min(100, pct));
  const angle = (clamped / 100) * 2 * Math.PI;
  const start = { x: cx, y: cy - r };
  const end = {
    x: cx + r * Math.sin(angle),
    y: cy - r * Math.cos(angle),
  };
  const largeArc = clamped > 50 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

const CATEGORY_ORDER = [
  { key: "aptitude", label: "Aptitude" },
  { key: "coding", label: "Coding" },
  { key: "communication", label: "Communication" },
  { key: "technical", label: "Technical" },
];

const EVENT_LABELS = {
  jobApplied: "Job application submitted",
  dailyCodeSubmitted: "Daily code solved",
  practiceStarted: "Practice session started",
  taskCreated: "Task assigned",
  taskCompleted: "Task completed",
  driveRegistered: "Drive registered",
  driveApplied: "Drive registered",
  announcementsViewed: "Announcement viewed",
  resumeCreated: "Resume updated",
  interviewRequested: "Mock interview requested",
  offerAccepted: "Offer accepted",
  offerDeclined: "Offer declined",
  offerReleased: "Offer released",
};

const formatTimestamp = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date)) return "";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const describeMeta = (event) => {
  if (!event?.meta) return "";
  const meta = event.meta;
  switch (event.type) {
    case "jobApplied":
      if (meta.companyName || meta.jobRole) {
        return [meta.companyName, meta.jobRole].filter(Boolean).join(" • ");
      }
      break;
    case "dailyCodeSubmitted":
      if (meta.title) return `Solved ${meta.title}`;
      break;
    case "practiceStarted":
      if (meta.topic) return `Topic: ${meta.topic}`;
      break;
    case "taskCreated":
      return meta.assigned ? "Assigned by faculty" : "Self created";
    case "taskCompleted":
      return meta.taskId ? `Task #${meta.taskId.slice(-5)}` : "";
    case "driveRegistered":
    case "driveApplied":
      return meta.companyName
        ? `Company: ${meta.companyName}`
        : meta.driveId
        ? `Drive ID: ${meta.driveId}`
        : "";
    case "announcementsViewed":
      return meta.announcementTitle
        ? meta.announcementTitle
        : "Announcement opened";
    case "resumeCreated":
      return meta.section ? `${meta.section} updated` : "Profile refreshed";
    case "interviewRequested":
      return meta.track ? `${meta.track} mock interview` : "Mock interview";
    case "offerAccepted":
    case "offerDeclined":
    case "offerReleased":
      if (meta.companyName || meta.roleTitle) {
        return [meta.companyName, meta.roleTitle].filter(Boolean).join(" • ");
      }
      break;
    default:
      break;
  }
  return "";
};

const PerformanceTracker = ({ email: emailProp }) => {
  const [perf, setPerf] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const email = (
    emailProp ||
    localStorage.getItem("studentEmail") ||
    localStorage.getItem("email") ||
    ""
  )
    .toString()
    .toLowerCase();

  async function load() {
    try {
      if (!email) {
        setError("No student email found");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      const [resPerf, resSum] = await Promise.all([
        fetch(
          `http://localhost:8080/api/performance/${encodeURIComponent(email)}`
        ),
        fetch(
          `http://localhost:8080/api/performance/${encodeURIComponent(
            email
          )}/events/summary?months=6`
        ),
      ]);
      const jsonPerf = resPerf.ok ? await resPerf.json() : null;
      const jsonSum = resSum.ok ? await resSum.json() : null;
      setPerf(jsonPerf);
      setSummary(jsonSum);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || "Failed to load performance tracker");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let off;
    load();
    off = onEvent("performance:event", () => load());
    return () => {
      if (typeof off === "function") off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recentEvents = useMemo(() => {
    const events = Array.isArray(perf?.events) ? [...perf.events] : [];
    events.sort(
      (a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );
    return events.slice(0, 8);
  }, [perf]);

  const scores = perf?.mockTestScores || {
    aptitude: 0,
    coding: 0,
    communication: 0,
    technical: 0,
  };
  const codingSolved = perf?.codingChallengesSolved || 0;
  const offersAccepted = perf?.offersAccepted || 0;
  // Derive offers received from events (offerReleased occurrences)
  const offersReceived = useMemo(() => {
    if (!Array.isArray(perf?.events)) return 0;
    return perf.events.filter((e) => e.type === "offerReleased").length;
  }, [perf]);
  const interviewScore = perf?.interviewScores ?? null;
  const lastEvent = recentEvents?.[0];

  const summaryTotals = useMemo(() => {
    if (!summary?.series) return {};
    const totals = {};
    Object.entries(summary.series).forEach(([key, arr]) => {
      if (!Array.isArray(arr)) return;
      totals[key] = arr.reduce((acc, val) => acc + Number(val || 0), 0);
    });
    totals.applications = totals.jobApplied || 0;
    totals.drives = (totals.driveRegistered || 0) + (totals.driveApplied || 0);
    totals.practice =
      (totals.dailyCodeSubmitted || 0) + (totals.practiceStarted || 0);
    totals.tasksCompleted = totals.taskCompleted || 0;
    totals.announcements = totals.announcementsViewed || 0;
    totals.resumeUpdates = totals.resumeCreated || 0;
    totals.offersAccepted = totals.offerAccepted || 0;
    totals.offersReceived = totals.offerReleased || 0;
    return totals;
  }, [summary]);

  const insightCards = useMemo(() => {
    return [
      {
        label: "Applications Submitted",
        value: summaryTotals.applications || 0,
        caption: "Past 6 months",
      },
      {
        label: "Drives Registered",
        value: summaryTotals.drives || 0,
        caption: "Past 6 months",
      },
      {
        label: "Daily Practice Sessions",
        value: summaryTotals.practice || 0,
        caption: "Past 6 months",
      },
      {
        label: "Tasks Completed",
        value: summaryTotals.tasksCompleted || 0,
        caption: "Past 6 months",
      },
      {
        label: "Offers Accepted",
        value: summaryTotals.offersAccepted || 0,
        caption: "Past 6 months",
      },
      {
        label: "Offers Received",
        value: summaryTotals.offersReceived || offersReceived || 0,
        caption: "Past 6 months",
      },
      {
        label: "Coding Challenges Solved",
        value: codingSolved || 0,
        caption: "All time",
      },
      {
        label: "Interview Score",
        value: typeof interviewScore === "number" ? interviewScore : "\u2014",
        caption: "Latest",
      },
    ];
  }, [codingSolved, interviewScore, summaryTotals]);

  // Heatmap data (last 12 weeks, daily)
  const heatmap = useMemo(() => {
    const days = 7 * 12; // 12 weeks
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (days - 1));

    const counts = new Map();
    const events = Array.isArray(perf?.events) ? perf.events : [];
    events.forEach((ev) => {
      const d = new Date(ev.date);
      if (isNaN(d)) return;
      const key = fmt(d);
      const isPractice =
        ev.type === "dailyCodeSubmitted" || ev.type === "practiceStarted";
      if (!isPractice) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const daysArr = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = fmt(d);
      daysArr.push({ date: new Date(d), count: counts.get(key) || 0 });
    }
    return daysArr;
  }, [perf]);

  // Weekly series for sparkline (sum of dailyCode/practice per week)
  const weeklySeries = useMemo(() => {
    const weeks = 12;
    const series = Array(weeks).fill(0);
    const today = new Date();
    const events = Array.isArray(perf?.events) ? perf.events : [];
    events.forEach((ev) => {
      if (ev.type !== "dailyCodeSubmitted" && ev.type !== "practiceStarted")
        return;
      const d = new Date(ev.date);
      if (isNaN(d)) return;
      const diffDays = Math.floor((today - d) / (1000 * 60 * 60 * 24));
      const weekIdx = Math.floor(diffDays / 7);
      if (weekIdx >= 0 && weekIdx < weeks) {
        series[weeks - 1 - weekIdx] += 1;
      }
    });
    return series;
  }, [perf]);

  return (
    <div className="perftracker">
      <div className="perftracker-header card">
        <div>
          <h1 className="title">Performance Tracker</h1>
          <p className="muted">
            Your progress across practice, tests, and interviews
          </p>
          {(lastEvent || lastUpdated) && (
            <p className="muted small">
              Synced {formatTimestamp(lastEvent?.date || lastUpdated)}
            </p>
          )}
        </div>
      </div>

      {!!error && (
        <p className="error" style={{ color: "#b00020" }}>
          {error}
        </p>
      )}

      {loading && !error && (
        <div className="info-banner card">
          Syncing latest performance&hellip;
        </div>
      )}

      {insightCards.length > 0 && (
        <section className="insights-grid">
          {insightCards.map((card) => (
            <div key={card.label} className="insight-card card">
              <span className="metric">{card.value}</span>
              <span className="label">{card.label}</span>
              {card.caption && <span className="caption">{card.caption}</span>}
            </div>
          ))}
        </section>
      )}

      {/* Gauges */}
      <section className="gauge-grid">
        {CATEGORY_ORDER.map((c) => {
          const val = Number(scores[c.key] || 0);
          return (
            <div key={c.key} className="gauge-card card">
              <svg
                viewBox="0 0 120 120"
                width="120"
                height="120"
                aria-label={`${c.label} ${val}%`}
              >
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                />
                <path
                  d={arcPath(60, 60, 48, val)}
                  fill="none"
                  stroke="var(--primary-color)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <text
                  x="60"
                  y="60"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="20"
                  fill="var(--text-color)"
                  fontWeight="600"
                >
                  {val}
                </text>
              </svg>
              <div className="gauge-meta">
                <h3>{c.label}</h3>
                <p className="muted">/ 100</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Heatmap */}
      <section className="heatmap card">
        <div className="card-header">
          <h2>Streak (last 12 weeks)</h2>
          <span className="muted small">Daily coding & practice</span>
        </div>
        <div className="heatmap-grid" role="img" aria-label="Activity heatmap">
          {/* 7 columns (Mon..Sun) × 12 weeks */}
          {Array.from({ length: 12 }).map((_, col) => (
            <div className="heatmap-col" key={col}>
              {Array.from({ length: 7 }).map((__, row) => {
                const idx = col * 7 + row; // chronological order in heatmap array
                const d = heatmap[idx];
                const v = d?.count || 0;
                let level = 0;
                if (v >= 4) level = 4;
                else if (v === 3) level = 3;
                else if (v === 2) level = 2;
                else if (v === 1) level = 1;
                return (
                  <div
                    key={row}
                    className={`cell level-${level}`}
                    title={`${d?.date?.toDateString() || ""}: ${v} activity`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* Weekly activity sparkline + stats */}
      <section className="weekly card">
        <div className="card-header">
          <h2>Weekly Activity</h2>
        </div>
        <div className="sparkline-wrap">
          <svg
            viewBox="0 0 240 80"
            width="100%"
            height="80"
            preserveAspectRatio="none"
          >
            {(() => {
              const max = Math.max(1, ...weeklySeries);
              const stepX = 240 / Math.max(weeklySeries.length - 1, 1);
              const points = weeklySeries
                .map((v, i) => {
                  const x = i * stepX;
                  const y = 80 - (v / max) * 70 - 5; // padding
                  return `${x},${y}`;
                })
                .join(" ");
              return (
                <>
                  <polyline
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    points={`0,75 240,75`}
                  />
                  <polyline
                    fill="none"
                    stroke="var(--primary-color)"
                    strokeWidth="2"
                    points={points}
                  />
                  {weeklySeries.map((v, i) => {
                    const x = (i * 240) / Math.max(weeklySeries.length - 1, 1);
                    const y = 80 - (v / max) * 70 - 5;
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="2.5"
                        fill="var(--primary-color)"
                      />
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
        <div className="weekly-stats">
          <div className="stat">
            <span className="label">Challenges Solved</span>
            <span className="value">{codingSolved}</span>
          </div>
          <div className="stat">
            <span className="label">Interview Score</span>
            <span className="value">
              {typeof interviewScore === "number" ? interviewScore : "-"}
            </span>
          </div>
          <div className="stat">
            <span className="label">Offers Accepted</span>
            <span className="value">{offersAccepted}</span>
          </div>
        </div>
      </section>

      <section className="recent card">
        <div className="card-header">
          <h2>Recent Activity</h2>
          <span className="muted small">
            {recentEvents.length
              ? `Last ${recentEvents.length} updates`
              : "Nothing tracked yet"}
          </span>
        </div>
        {recentEvents.length === 0 ? (
          <p className="empty-message">No performance events recorded yet.</p>
        ) : (
          <div className="timeline">
            {recentEvents.map((event, idx) => {
              const label = EVENT_LABELS[event.type] || event.type;
              const metaLine = describeMeta(event);
              return (
                <div key={event._id || idx} className="timeline-item">
                  <div className="timeline-content">
                    <span className="primary">{label}</span>
                    {metaLine && <span className="meta">{metaLine}</span>}
                  </div>
                  <span className="timestamp">
                    {formatTimestamp(event.date)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default PerformanceTracker;
