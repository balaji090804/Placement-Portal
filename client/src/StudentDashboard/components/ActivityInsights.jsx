import React, { useEffect, useMemo, useState } from "react";

// Lightweight, dependency-free bar chart using divs
const monthsShort = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function aggregateByMonth(items, dateField) {
  const now = new Date();
  const year = now.getFullYear();
  const counts = Array(12).fill(0);
  if (!Array.isArray(items)) return counts;
  items.forEach((it) => {
    const d = new Date(it[dateField]);
    if (!isNaN(d) && d.getFullYear() === year) {
      counts[d.getMonth()] += 1;
    }
  });
  return counts;
}

export default function ActivityInsights({ email, token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;
        const res = await fetch(
          `http://localhost:8080/api/performance/${encodeURIComponent(email)}`,
          { headers }
        );
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError("Unable to load activity insights");
      }
    };
    if (email) load();
  }, [email, token]);

  const { enrolled, participated, maxY } = useMemo(() => {
    if (!data)
      return {
        enrolled: Array(12).fill(0),
        participated: Array(12).fill(0),
        maxY: 1,
      };
    // Heuristic:
    // - enrolled: mockInterviews scheduled + pastInterviews (treated as opportunities)
    // - participated: pastInterviews (completed)
    const enrolledCounts = aggregateByMonth(
      [...(data.mockInterviews || []), ...(data.pastInterviews || [])],
      data.mockInterviews ? "date" : "interviewDate"
    );
    const pastCounts = aggregateByMonth(
      data.pastInterviews || [],
      "interviewDate"
    );
    const maxVal = Math.max(1, ...enrolledCounts, ...pastCounts);
    return { enrolled: enrolledCounts, participated: pastCounts, maxY: maxVal };
  }, [data]);

  return (
    <div className="insights-card">
      <div className="insights-header">
        <h3>Activity insights</h3>
      </div>
      {error && (
        <p className="error-text" style={{ marginTop: 8 }}>
          {error}
        </p>
      )}
      <div className="insights-body">
        <div className="insights-stats">
          <div className="stat">
            <div className="stat-value">
              {enrolled.reduce((a, b) => a + b, 0)}
            </div>
            <div className="stat-label">Opportunities</div>
          </div>
          <div className="stat">
            <div className="stat-value">
              {participated.reduce((a, b) => a + b, 0)}
            </div>
            <div className="stat-label">Participated</div>
          </div>
        </div>
        <div className="bar-chart">
          {monthsShort.map((m, i) => {
            const eH = Math.round((enrolled[i] / maxY) * 100) || 0;
            const pH = Math.round((participated[i] / maxY) * 100) || 0;
            return (
              <div className="bar-col" key={m}>
                <div className="bars">
                  <div
                    className="bar bar-enrolled"
                    style={{ height: `${eH}%` }}
                    title={`Enrolled: ${enrolled[i]}`}
                  />
                  <div
                    className="bar bar-participated"
                    style={{ height: `${pH}%` }}
                    title={`Participated: ${participated[i]}`}
                  />
                </div>
                <div className="bar-label">{m}</div>
              </div>
            );
          })}
        </div>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-swatch enrolled" /> Opportunities
          </span>
          <span className="legend-item">
            <span className="legend-swatch participated" /> Participated
          </span>
        </div>
      </div>
    </div>
  );
}
