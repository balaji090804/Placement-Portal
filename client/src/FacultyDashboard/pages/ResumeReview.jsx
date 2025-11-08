import React, { useState } from "react";
import "../styles/ResumeReview.css";

// Helper to get auth token
const authHeaders = () => {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

const API_BASE = "http://localhost:8080/api/student-profile"; // adjust for prod

const ResumeReview = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null); // { url, verified, name, collegeEmail, verifiedAt, verifiedBy }

  const fetchResume = async () => {
    const target = email.trim().toLowerCase();
    if (!target) {
      setError("Enter student email");
      return;
    }
    setError("");
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(
        `${API_BASE}/resume/${encodeURIComponent(target)}`,
        {
          headers: { ...authHeaders() },
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Error ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyResume = async () => {
    if (!data) return;
    setVerifying(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/resume/${encodeURIComponent(data.collegeEmail)}/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || `Error ${res.status}`);
      setData((prev) =>
        prev
          ? {
              ...prev,
              verified: true,
              verifiedAt: body.verifiedAt,
              verifiedBy: body.verifiedBy,
            }
          : prev
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setVerifying(false);
    }
  };

  const publicUrl =
    data?.url && data.url.startsWith("/uploads/")
      ? `${window.location.origin}${data.url}`
      : data?.url;

  return (
    <div className="faculty-resume-review">
      <h1>📄 Resume Review</h1>
      <div className="resume-search-card">
        <label htmlFor="studentEmail">Student Email</label>
        <div className="row">
          <input
            id="studentEmail"
            type="email"
            placeholder="student@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={fetchResume} disabled={loading}>
            {loading ? "Loading..." : "Fetch Resume"}
          </button>
        </div>
        {error && <p className="error-msg">{error}</p>}
      </div>

      {data && (
        <div className="resume-viewer-card">
          <div className="resume-meta">
            <h2>{data.name || data.collegeEmail}</h2>
            <div>
              {data.verified ? (
                <span className="badge verified">✔ Verified</span>
              ) : (
                <span className="badge pending">Pending Review</span>
              )}
            </div>
            {data.verified && (
              <p className="verified-details">
                Verified by {data.verifiedBy || "faculty"} on{" "}
                {data.verifiedAt
                  ? new Date(data.verifiedAt).toLocaleString()
                  : ""}
              </p>
            )}
            {!data.verified && (
              <button
                className="verify-btn"
                onClick={verifyResume}
                disabled={verifying}
              >
                {verifying ? "Verifying..." : "Mark as Verified"}
              </button>
            )}
          </div>
          {publicUrl ? (
            <div className="resume-frame-wrapper">
              {publicUrl.endsWith(".pdf") ? (
                <iframe
                  title="Student Resume"
                  src={publicUrl}
                  className="resume-iframe"
                />
              ) : (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="open-resume-link"
                >
                  Open Resume
                </a>
              )}
            </div>
          ) : (
            <p>No resume file available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeReview;
