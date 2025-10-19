import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/AdminJobListings.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminJobListings = () => {
  const [newJob, setNewJob] = useState({
    companyName: "",
    companyWebsite: "",
    jobTitle: "",
    jobLocation: "",
    jobType: "Full-time",
    packageOffered: "",
    interviewDate: "",
    jobMode: "On-Site",
    experienceLevel: "Entry Level",
    requiredSkills: "",
    jobDescription: "",
    eligibilityCriteria: "",
    selectionProcess: "",
    jobLocationDetails: "",
    registrationLink: "",
    logo: "",
    aboutCompany: "",
    jobResponsibilities: "",
    internshipInfo: "",
    additionalNotes: ""
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    setNewJob({ ...newJob, [e.target.name]: e.target.value });
  };

  const handleAddJob = async () => {
    const requiredFields = [
      "companyName", "jobTitle", "packageOffered", "interviewDate",
      "jobLocation", "jobType", "jobMode", "experienceLevel",
      "requiredSkills", "jobDescription", "eligibilityCriteria",
      "selectionProcess", "jobLocationDetails", "registrationLink"
    ];

    const missing = requiredFields.filter((field) => {
      const value = newJob[field];
      if (typeof value === "string") return value.trim() === "";
      return value === undefined || value === null;
    });

    if (missing.length > 0) {
      return toast.warning(`Please fill in: ${missing.join(", ")}`);
    }

    try {
      const response = await axios.post("http://localhost:8080/api/recruiters", {
        ...newJob,
        requiredSkills: newJob.requiredSkills.split(",").map(skill => skill.trim()),
      });

      toast.success(response.data.message);
      setNewJob({
        companyName: "",
        companyWebsite: "",
        jobTitle: "",
        jobLocation: "",
        jobType: "Full-time",
        packageOffered: "",
        interviewDate: "",
        jobMode: "On-Site",
        experienceLevel: "Entry Level",
        requiredSkills: "",
        jobDescription: "",
        eligibilityCriteria: "",
        selectionProcess: "",
        jobLocationDetails: "",
        registrationLink: "",
        logo: "",
        aboutCompany: "",
        jobResponsibilities: "",
        internshipInfo: "",
        additionalNotes: ""
      });
    } catch (err) {
      console.error("Error posting job:", err);
      toast.error("Failed to add job.");
    }
  };

  return (
    <div className="admin-job-listings">
      <div className="admin-job-listings-content">
        <h1>💼 Manage Job Listings</h1>
        <div className="add-job-listing-form">
          <h2>📄 Add New Job Listing</h2>

          {/* Company Info */}
          <label>Company Name</label>
          <input type="text" name="companyName" placeholder="e.g. Avasoft" value={newJob.companyName} onChange={handleChange} />

          <label>Company Website (optional)</label>
          <input type="text" name="companyWebsite" placeholder="https://example.com" value={newJob.companyWebsite} onChange={handleChange} />

          {/* Job Basics */}
          <label>Job Title</label>
          <input type="text" name="jobTitle" placeholder="e.g. Business Development Executive" value={newJob.jobTitle} onChange={handleChange} />

          <label>Package Offered (LPA)</label>
          <input type="text" name="packageOffered" placeholder="e.g. 5.0" value={newJob.packageOffered} onChange={handleChange} />

          <label>Interview Date</label>
          <input type="date" name="interviewDate" value={newJob.interviewDate} onChange={handleChange} />

          <label>Job Location</label>
          <input type="text" name="jobLocation" placeholder="e.g. Chennai" value={newJob.jobLocation} onChange={handleChange} />

          <label>Job Mode</label>
          <input type="text" name="jobMode" placeholder="On-Site / Remote / Hybrid" value={newJob.jobMode} onChange={handleChange} />

          <label>Job Type</label>
          <input type="text" name="jobType" placeholder="Full-time / Internship" value={newJob.jobType} onChange={handleChange} />

          <label>Experience Level</label>
          <input type="text" name="experienceLevel" placeholder="Entry / Mid / Senior" value={newJob.experienceLevel} onChange={handleChange} />

          <label>Required Skills (comma-separated)</label>
          <input type="text" name="requiredSkills" placeholder="e.g. Communication, CRM, Python" value={newJob.requiredSkills} onChange={handleChange} />

          <label>Job Description</label>
          <textarea name="jobDescription" placeholder="Describe the role..." value={newJob.jobDescription} onChange={handleChange} />

          {/* New Fields for Detailed Mail */}
          <label>About the Company</label>
          <textarea name="aboutCompany" placeholder="Brief about the organization..." value={newJob.aboutCompany} onChange={handleChange} />

          <label>Job Roles & Responsibilities</label>
          <textarea name="jobResponsibilities" placeholder="List key duties..." value={newJob.jobResponsibilities} onChange={handleChange} />

          <label>Internship Details</label>
          <textarea name="internshipInfo" placeholder="Stipend, duration, joining details..." value={newJob.internshipInfo} onChange={handleChange} />

          <label>Eligibility Criteria</label>
          <textarea name="eligibilityCriteria" placeholder="Who can apply?" value={newJob.eligibilityCriteria} onChange={handleChange} />

          <label>Selection Process</label>
          <textarea name="selectionProcess" placeholder="e.g. GD → Tech → HR" value={newJob.selectionProcess} onChange={handleChange} />

          <label>Job Location Details</label>
          <input type="text" name="jobLocationDetails" placeholder="e.g. Remote during internship" value={newJob.jobLocationDetails} onChange={handleChange} />

          <label>Registration Link</label>
          <input type="text" name="registrationLink" placeholder="e.g. https://bit.edu/apply" value={newJob.registrationLink} onChange={handleChange} />

          <label>Additional Notes (Optional)</label>
          <textarea name="additionalNotes" placeholder="e.g. Apply before Jan 27 at 9AM" value={newJob.additionalNotes} onChange={handleChange} />

          <button onClick={handleAddJob}>➕ Add Job</button>
        </div>
      </div>
    </div>
  );
};

export default AdminJobListings;
