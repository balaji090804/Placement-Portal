import React, { useState } from "react";
import "../styles/ResumeReview.css";

const ResumeReview = () => {
  const [resumes, setResumes] = useState([
    { id: 1, student: "Sarah Lee", status: "Pending Review" },
    { id: 2, student: "Mark Johnson", status: "Approved" },
  ]);

  const handleReview = (id, newStatus) => {
    setResumes(resumes.map((resume) => (resume.id === id ? { ...resume, status: newStatus } : resume)));
  };

  return (
    <div className="faculty-resume-review">
      <h1>📄 Resume Review</h1>
      <ul className="resume-list">
        {resumes.map((resume) => (
          <li key={resume.id}>
            <p>{resume.student} - {resume.status}</p>
            {resume.status === "Pending Review" && (
              <button onClick={() => handleReview(resume.id, "Approved")}>✅ Approve</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ResumeReview;
