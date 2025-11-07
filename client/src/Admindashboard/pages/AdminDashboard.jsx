import React, { useEffect, useState } from "react";
import "../styles/AdminDashboard.css";
import {
  FaChartBar,
  FaRocket,
  FaBriefcase,
  FaGraduationCap,
  FaBuilding,
  FaMoneyBillWave,
  FaBullhorn,
} from "react-icons/fa";
import { onEvent } from "../../lib/socket";

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async () => {
    try {
      setError("");
      const res = await fetch("http://localhost:8080/api/admin-dashboard");
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      setData(await res.json());
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const off = onEvent("dashboard:update", () => load());
    load();
    return () => {
      if (typeof off === "function") off();
    };
  }, []);

  return (
    <div className="admin-dashboard-container">
      <header className="admin-dashboard-header card">
        <div className="admin-header-title">
          <FaChartBar className="admin-header-icon" />
          <h1>Admin Dashboard</h1>
        </div>
        {lastUpdated && (
          <div className="admin-header-meta">
            <span className="muted small">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        )}
      </header>

      <main className="admin-dashboard-content">
        {loading && <p>Loading…</p>}
        {!!error && !loading && <p style={{ color: "#b00020" }}>{error}</p>}
        {data && (
          <>
            <section className="admin-metrics">
              <div className="admin-metric-card">
                <FaGraduationCap className="admin-metric-icon" />
                <h3>Total Students</h3>
                <p>{data.totalStudents ?? "-"}</p>
              </div>
              <div className="admin-metric-card">
                <FaRocket className="admin-metric-icon" />
                <h3>Upcoming Drives</h3>
                <p>{data.upcomingDrives ?? "-"}</p>
              </div>
              <div className="admin-metric-card">
                <FaBriefcase className="admin-metric-icon" />
                <h3>Total Jobs</h3>
                <p>{data.totalJobs ?? "-"}</p>
              </div>
              <div className="admin-metric-card">
                <FaBullhorn className="admin-metric-icon" />
                <h3>Pending Faculty Actions</h3>
                <p>{data.pendingFacultyAnnouncements ?? "-"}</p>
              </div>
            </section>

            <section className="admin-section">
              <h2>Today at a glance</h2>
              <div className="admin-card-grid">
                <div className="admin-card">
                  <h3>Total Applications</h3>
                  <p>{data.totalApplications ?? "-"}</p>
                </div>
                <div className="admin-card">
                  <h3>Selections (24h)</h3>
                  <p>{data.selectionsToday ?? "-"}</p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
