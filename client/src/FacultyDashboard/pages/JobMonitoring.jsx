// JobMonitoring.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/JobMonitoring.css";
import { onEvent } from "../../lib/socket";

const JobMonitoring = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    fetchJobs();
    // listen to global dashboard updates and job events
    const off1 = onEvent("dashboard:update", (p) => {
      if (!p || p.scope === "global") fetchJobs();
    });
    const off2 = onEvent("jobs:new", () => fetchJobs());
    return () => {
      if (typeof off1 === "function") off1();
      if (typeof off2 === "function") off2();
    };
  }, []);

  // 1) Load job data from /api/recruiters & merge with /api/companyroles/all
  const fetchJobs = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/recruiters");
      const jobsData = response.data;

      // Merge with companyroles to get registration counts
      const registrationsResponse = await axios.get(
        "http://localhost:8080/api/companyroles/all"
      );
      const registrationsData = registrationsResponse.data;

      const updatedJobs = jobsData.map((job) => {
        const match = registrationsData.find(
          (reg) =>
            reg.companyName === job.companyName && reg.jobRole === job.jobTitle
        );
        return {
          ...job,
          registrations: match ? match.appliedStudents.length : 0,
        };
      });

      setJobs(updatedJobs);
    } catch (error) {
      console.error("Error fetching job listings:", error);
    }
  };

  // 2) Load applicant profiles for a given job
  const fetchApplicantProfiles = async (companyName, jobRole) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/companyroles/applicants?companyName=${encodeURIComponent(
          companyName
        )}&jobRole=${encodeURIComponent(jobRole)}`
      );
      // The server returns array of StudentProfile or []
      setRegistrations(response.data);
      setSelectedJob({ companyName, jobRole });
    } catch (error) {
      console.error("❌ Error fetching applicant profiles:", error);
      // If there's an error, we set an empty array so the UI doesn't crash
      setRegistrations([]);
      setSelectedJob(null);
    }
  };

  // 3) Helper to flatten arrays for CSV
  const arrayToCSVString = (arr, type) => {
    if (!Array.isArray(arr) || arr.length === 0) return "";
    if (type === "certifications") {
      return arr.map((c) => `${c.name}(${c.url})`).join("; ");
    } else if (type === "projects") {
      return arr
        .map((p) => `${p.name}(${p.techStack}) ${p.description}`)
        .join("; ");
    } else if (type === "codingProfiles") {
      return arr.map((cp) => `${cp.platform}(${cp.url})`).join("; ");
    }
    return JSON.stringify(arr);
  };

  // 4) Escaper to handle quotes for CSV
  function csvEscape(value) {
    if (value == null) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  }

  // 5) Build and download the CSV
  const downloadCSV = () => {
    if (registrations.length === 0) {
      alert("No students available for download.");
      return;
    }

    // CSV header row
    let csvContent =
      "regNo,name,contactNumber,collegeEmail,stream,branch,resume,tenthPercentage,twelfthPercentage,cgpa,certifications,github,projects,linkedin,codingProfiles,skills\n";

    registrations.forEach((profile) => {
      const regNo = profile.regNo || "";
      const name = profile.name || "";
      const contact = profile.contactNumber || "";
      const email = profile.collegeEmail || "";
      const stream = profile.stream || "";
      const branch = profile.branch || "";
      const resume = profile.resume || "";
      const tenth = profile.tenthPercentage || "";
      const twelfth = profile.twelfthPercentage || "";
      const cgpa = profile.cgpa || "";

      const certs = arrayToCSVString(profile.certifications, "certifications");
      const github = profile.github || "";
      const projects = arrayToCSVString(profile.projects, "projects");
      const linkedin = profile.linkedin || "";
      const coding = arrayToCSVString(profile.codingProfiles, "codingProfiles");

      // Skills: If your DB stores them as a single comma string, it's already one cell
      // If it's an array, join them. We'll assume it's a single string (like "C, C++, Node")
      const skills = profile.skills || "";

      // Escape each field
      const row = [
        csvEscape(regNo),
        csvEscape(name),
        csvEscape(contact),
        csvEscape(email),
        csvEscape(stream),
        csvEscape(branch),
        csvEscape(resume),
        csvEscape(tenth),
        csvEscape(twelfth),
        csvEscape(cgpa),
        csvEscape(certs),
        csvEscape(github),
        csvEscape(projects),
        csvEscape(linkedin),
        csvEscape(coding),
        csvEscape(skills),
      ].join(",");

      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Applicants_${selectedJob.companyName}_${selectedJob.jobRole}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="faculty-job-monitoring">
      <h1 className="page-title">Job Application Monitoring</h1>
      <table className="job-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Job Title</th>
            <th>Registrations</th>
            <th>View Students</th>
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 ? (
            <tr>
              <td colSpan="4" className="empty-state">
                No job listings available.
              </td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr key={job._id}>
                <td>{job.companyName}</td>
                <td>{job.jobTitle}</td>
                <td>{job.registrations}</td>
                <td>
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      fetchApplicantProfiles(job.companyName, job.jobTitle)
                    }
                  >
                    View Students
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal for viewing the students */}
      {selectedJob && (
        <div
          className="student-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="applicants-modal-title"
        >
          <div className="modal-content card">
            <h2 id="applicants-modal-title" className="section-title">
              Applicants for {selectedJob.jobRole} at {selectedJob.companyName}
            </h2>
            <button
              className="btn btn-outline close-modal"
              onClick={() => setSelectedJob(null)}
              aria-label="Close applicants modal"
            >
              Close
            </button>

            {registrations.length === 0 ? (
              <p className="empty-state">No students have registered.</p>
            ) : (
              <>
                <ul className="student-list">
                  {registrations.map((profile, index) => (
                    <li key={profile?._id || index} className="card">
                      <div className="student-row">
                        <strong>{profile.name}</strong>
                        <span className="muted">{profile.collegeEmail}</span>
                        <span className="muted">CGPA: {profile.cgpa}</span>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Download CSV Button */}
                <button
                  className="btn btn-primary download-csv-btn"
                  onClick={downloadCSV}
                >
                  Download CSV
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobMonitoring;
