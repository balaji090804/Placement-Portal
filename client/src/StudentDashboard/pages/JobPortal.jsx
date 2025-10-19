import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom"; // ✅ Import useOutletContext
import axios from "axios";
import "../styles/JobPage.css";

const JobPortal = () => {
  const { studentName, studentEmail } = useOutletContext(); // ✅ Retrieve data from context
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  // ✅ Fetch job listings from the database
  const fetchJobs = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/recruiters");
      if (response.data.length === 0) {
        throw new Error("No job listings available.");
      }
      setJobs(response.data);
    } catch (error) {
      console.error("❌ Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // ✅ Handle job application (Store Name & Email)
  const handleApply = async (companyName, jobRole) => {
    if (!studentName || !studentEmail) {
      alert("⚠️ Please log in to apply for jobs.");
      return;
    }
    try {
      const response = await axios.post("http://localhost:8080/api/companyroles/apply", {
        companyName,
        studentName,
        studentEmail, // ✅ Now sending email along with name
        jobRole,
      });
      alert(response.data.message);
    } catch (error) {
      console.error("❌ Application failed:", error.response?.data?.message);
      alert(error.response?.data?.message || "Application failed. Please try again.");
    }
    const checkProfileExists = async (email) => {
      try {
        const res = await axios.get(`http://localhost:8080/api/student-profile/check/${email}`);
        return res.data.exists; // Boolean indicating existence
      } catch (error) {
        console.error("❌ Error checking profile existence:", error);
        return false;
      }
    };
  
    const profileExists = await checkProfileExists(studentEmail);
    if (!profileExists) {
      alert("⚠️ You must complete your profile before applying.");
      return;
    }
  };

  return (
    <div className="main-content">
      <h1>💼 Explore Job Opportunities</h1>

      {loading ? (
        <p>Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p>No jobs available.</p>
      ) : (
        <div className="job-page">
          {jobs.map((job) => (
            <div key={job._id} className="job-card">
              <h2>
                {job.jobTitle} at {job.companyName}
              </h2>
              <p><strong>📍 Location:</strong> {job.jobLocation}</p>
              <p><strong>💰 Package:</strong> {job.packageOffered} LPA</p>
              <p><strong>🕒 Mode:</strong> {job.jobMode}</p>
              <p><strong>📌 Experience Level:</strong> {job.experienceLevel}</p>
              <p><strong>🛠️ Required Skills:</strong> {job.requiredSkills.join(", ")}</p>
              <p><strong>📅 Interview Date:</strong> {new Date(job.interviewDate).toLocaleDateString()}</p>
              <button className="apply-btn" onClick={() => handleApply(job.companyName, job.jobTitle)}>
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
