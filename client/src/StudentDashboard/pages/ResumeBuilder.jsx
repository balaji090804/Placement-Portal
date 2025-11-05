import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ResumeBuilder.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import { recordPerformanceEvent } from "../../lib/performance";

const ResumeBuilder = () => {
  const [resumeData, setResumeData] = useState({
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    education: "",
    experience: "",
    skills: "",
    projects: "",
    summary: "",
    certifications: "",
  });

  const [atsScore, setAtsScore] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);

  const handleChange = (e) => {
    setResumeData({ ...resumeData, [e.target.name]: e.target.value });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header Section with Name
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 51, 102);
    doc.text(resumeData.name || "Your Name", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 8;

    // Contact Information
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const contactInfo = [
      resumeData.email,
      resumeData.phone,
      resumeData.linkedin,
      resumeData.github,
    ]
      .filter(Boolean)
      .join(" | ");
    doc.text(contactInfo, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // Horizontal line
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.line(15, yPosition, pageWidth - 15, yPosition);
    yPosition += 8;

    // Professional Summary Section
    if (resumeData.summary) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 51, 102);
      doc.text("PROFESSIONAL SUMMARY", 15, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const summaryLines = doc.splitTextToSize(
        resumeData.summary,
        pageWidth - 30
      );
      doc.text(summaryLines, 15, yPosition);
      yPosition += summaryLines.length * 5 + 6;
    }

    // Skills Section
    if (resumeData.skills) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 51, 102);
      doc.text("TECHNICAL SKILLS", 15, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const skillsLines = doc.splitTextToSize(
        resumeData.skills,
        pageWidth - 30
      );
      doc.text(skillsLines, 15, yPosition);
      yPosition += skillsLines.length * 5 + 6;
    }

    // Experience Section
    if (resumeData.experience) {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 51, 102);
      doc.text("PROFESSIONAL EXPERIENCE", 15, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const expLines = doc.splitTextToSize(
        resumeData.experience,
        pageWidth - 30
      );
      doc.text(expLines, 15, yPosition);
      yPosition += expLines.length * 5 + 6;
    }

    // Projects Section
    if (resumeData.projects) {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 51, 102);
      doc.text("PROJECTS", 15, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const projectLines = doc.splitTextToSize(
        resumeData.projects,
        pageWidth - 30
      );
      doc.text(projectLines, 15, yPosition);
      yPosition += projectLines.length * 5 + 6;
    }

    // Education Section
    if (resumeData.education) {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 51, 102);
      doc.text("EDUCATION", 15, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const eduLines = doc.splitTextToSize(
        resumeData.education,
        pageWidth - 30
      );
      doc.text(eduLines, 15, yPosition);
      yPosition += eduLines.length * 5 + 6;
    }

    // Certifications Section
    if (resumeData.certifications) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 51, 102);
      doc.text("CERTIFICATIONS", 15, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const certLines = doc.splitTextToSize(
        resumeData.certifications,
        pageWidth - 30
      );
      doc.text(certLines, 15, yPosition);
    }

    doc.save(`${resumeData.name || "resume"}.pdf`);
    try {
      const email = localStorage.getItem("studentEmail");
      if (email)
        recordPerformanceEvent(email, "resumeCreated", {
          hasLinkedIn: !!resumeData.linkedin,
        });
    } catch {}
  };

  const analyzeWithATS = async () => {
    setAtsLoading(true);
    setAtsScore(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:8080/api/ats/score",
        { resumeData },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAtsScore(response.data);
    } catch (error) {
      console.error("❌ ATS Analysis failed:", error);
      alert(
        error.response?.data?.message ||
          "Failed to analyze resume. Please try again."
      );
    } finally {
      setAtsLoading(false);
    }
  };

  return (
    <div className="resume-builder">
      {/* 🚀 Page Header */}
      <section className="resume-header">
        <h1>📄 Resume Builder</h1>
        <p>
          Create a professional, ATS-friendly resume with our easy-to-use
          builder.
        </p>
      </section>

      {/* 🔹 Resume Form */}
      <section className="resume-form">
        <h2>✍️ Enter Your Details</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={resumeData.name}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              placeholder="john.doe@example.com"
              value={resumeData.email}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Phone</label>
            <input
              type="text"
              name="phone"
              placeholder="+1 234 567 8900"
              value={resumeData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>LinkedIn Profile</label>
            <input
              type="text"
              name="linkedin"
              placeholder="linkedin.com/in/johndoe"
              value={resumeData.linkedin}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>GitHub Profile</label>
          <input
            type="text"
            name="github"
            placeholder="github.com/johndoe"
            value={resumeData.github}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Professional Summary *</label>
          <textarea
            name="summary"
            rows="4"
            placeholder="A brief summary highlighting your key skills and career objectives..."
            value={resumeData.summary}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="form-group">
          <label>Technical Skills *</label>
          <textarea
            name="skills"
            rows="3"
            placeholder="JavaScript, React, Node.js, Python, SQL, Git, AWS..."
            value={resumeData.skills}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="form-group">
          <label>Professional Experience</label>
          <textarea
            name="experience"
            rows="6"
            placeholder="Software Engineer | ABC Corp | Jan 2022 - Present&#10;• Developed scalable web applications...&#10;• Led a team of 3 developers..."
            value={resumeData.experience}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="form-group">
          <label>Projects</label>
          <textarea
            name="projects"
            rows="5"
            placeholder="E-commerce Platform | React, Node.js&#10;• Built a full-stack application with 10,000+ users&#10;• Implemented payment gateway integration..."
            value={resumeData.projects}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="form-group">
          <label>Education *</label>
          <textarea
            name="education"
            rows="3"
            placeholder="Bachelor of Technology in Computer Science | XYZ University | 2018-2022 | CGPA: 8.5/10"
            value={resumeData.education}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="form-group">
          <label>Certifications</label>
          <textarea
            name="certifications"
            rows="2"
            placeholder="AWS Certified Solutions Architect&#10;Google Cloud Professional Data Engineer"
            value={resumeData.certifications}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="action-buttons">
          <button className="generate-btn primary" onClick={generatePDF}>
            📥 Download Professional Resume
          </button>
          <button
            className="generate-btn secondary"
            onClick={analyzeWithATS}
            disabled={atsLoading}
          >
            {atsLoading ? "⏳ Analyzing..." : "🤖 Analyze with AI ATS"}
          </button>
        </div>
      </section>

      {/* ATS Score Display */}
      {atsScore && (
        <section className="ats-results">
          <h2>🎯 ATS Analysis Results</h2>
          <div className="score-card">
            <div className="score-circle">
              <div
                className="score-value"
                style={{
                  color:
                    atsScore.score >= 70
                      ? "#16a34a"
                      : atsScore.score >= 50
                      ? "#f59e0b"
                      : "#dc2626",
                }}
              >
                {atsScore.score}
              </div>
              <div className="score-label">/ 100</div>
            </div>
            <div className="score-info">
              <h3>Overall ATS Score</h3>
              <p className="score-category">
                {atsScore.score >= 70
                  ? "✅ Excellent"
                  : atsScore.score >= 50
                  ? "⚠️ Good"
                  : "❌ Needs Improvement"}
              </p>
            </div>
          </div>

          <div className="feedback-section">
            <h3>📊 Detailed Feedback</h3>
            <div className="feedback-content">{atsScore.feedback}</div>
          </div>

          {atsScore.suggestions && atsScore.suggestions.length > 0 && (
            <div className="suggestions-section">
              <h3>💡 Suggestions for Improvement</h3>
              <ul className="suggestions-list">
                {atsScore.suggestions.map((suggestion, idx) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ResumeBuilder;
