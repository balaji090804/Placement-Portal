import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import "../styles/JobPage.css";
import { recordPerformanceEvent } from "../../lib/performance";

const JobPortal = () => {
  const { studentName, studentEmail } = useOutletContext();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/announcements/upcoming"
      );
      setAnnouncements(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (companyName, jobRole) => {
    if (!studentName || !studentEmail) {
      alert("Please log in to apply for jobs.");
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:8080/api/companyroles/apply",
        {
          companyName,
          studentName,
          studentEmail,
          jobRole,
        }
      );
      alert(response.data.message);
      recordPerformanceEvent(studentEmail, "jobApplied", {
        companyName,
        jobRole,
      });
    } catch (error) {
      console.error("Application failed:", error.response?.data?.message);
      alert(
        error.response?.data?.message || "Application failed. Please try again."
      );
    }
    const checkProfileExists = async (email) => {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/student-profile/check/${email}`
        );
        return res.data.exists;
      } catch (error) {
        console.error("Error checking profile existence:", error);
        return false;
      }
    };

    const profileExists = await checkProfileExists(studentEmail);
    if (!profileExists) {
      alert("You must complete your profile before applying.");
      return;
    }
  };

  return (
    <div className="main-content">
      <h1>Explore Placement Announcements</h1>

      {loading ? (
        <p>Loading jobs...</p>
      ) : announcements.length === 0 ? (
        <p>No upcoming placement announcements.</p>
      ) : (
        <div className="job-page">
          {announcements.map((ann) => (
            <div key={ann._id} className="job-card">
              <h2>
                {ann.jobRole} at {ann.companyName}
              </h2>
              {ann.venue && (
                <p>
                  <strong>Venue:</strong> {ann.venue}
                </p>
              )}
              <p>
                <strong>Drive Date:</strong>{" "}
                {new Date(ann.dateTime).toLocaleString()}
              </p>
              {ann.prePlacementTalkVenue && ann.prePlacementTalkTime && (
                <p>
                  <strong>Pre-placement Talk:</strong>{" "}
                  {ann.prePlacementTalkVenue} at{" "}
                  {new Date(ann.prePlacementTalkTime).toLocaleString()}
                </p>
              )}
              {ann.requiredItems && (
                <p>
                  <strong>Required Items:</strong> {ann.requiredItems}
                </p>
              )}
              <button
                className="apply-btn"
                onClick={() => handleApply(ann.companyName, ann.jobRole)}
              >
                Apply Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobPortal;
