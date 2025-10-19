import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ResumeBuilder.css";
import jsPDF from "jspdf";

const ResumeBuilder = () => {
  const [resumeData, setResumeData] = useState({
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    education: "",
    experience: "",
    skills: "",
    projects: "",
    summary: "",
  });

  const handleChange = (e) => {
    setResumeData({ ...resumeData, [e.target.name]: e.target.value });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Professional Resume", 10, 20);
    
    doc.setFontSize(14);
    doc.text(`Name: ${resumeData.name}`, 10, 40);
    doc.text(`Email: ${resumeData.email}`, 10, 50);
    doc.text(`Phone: ${resumeData.phone}`, 10, 60);
    doc.text(`LinkedIn: ${resumeData.linkedin}`, 10, 70);
    doc.text(`Education: ${resumeData.education}`, 10, 80);
    doc.text(`Experience: ${resumeData.experience}`, 10, 90);
    doc.text(`Skills: ${resumeData.skills}`, 10, 100);
    doc.text(`Projects: ${resumeData.projects}`, 10, 110);
    doc.text(`Summary: ${resumeData.summary}`, 10, 120);

    doc.save("resume.pdf");
  };

  return (
    <div className="resume-builder">
      {/* 🚀 Page Header */}
      <section className="resume-header">
        <h1>📄 Resume Builder</h1>
        <p>Create a professional resume with our easy-to-use builder.</p>
      </section>

      {/* 🔹 Resume Form */}
      <section className="resume-form">
        <h2>✍️ Enter Your Details</h2>
        <div className="form-group">
          <label>Name:</label>
          <input type="text" name="name" onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input type="email" name="email" onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Phone:</label>
          <input type="text" name="phone" onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>LinkedIn Profile:</label>
          <input type="text" name="linkedin" onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Education:</label>
          <textarea name="education" onChange={handleChange}></textarea>
        </div>
        <div className="form-group">
          <label>Experience:</label>
          <textarea name="experience" onChange={handleChange}></textarea>
        </div>
        <div className="form-group">
          <label>Skills:</label>
          <textarea name="skills" onChange={handleChange}></textarea>
        </div>
        <div className="form-group">
          <label>Projects:</label>
          <textarea name="projects" onChange={handleChange}></textarea>
        </div>
        <div className="form-group">
          <label>Summary:</label>
          <textarea name="summary" onChange={handleChange}></textarea>
        </div>
        <button className="generate-btn" onClick={generatePDF}>📥 Download Resume</button>
      </section>
    </div>
  );
};

export default ResumeBuilder;
