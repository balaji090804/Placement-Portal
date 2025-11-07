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
    website: "",
    summary: "",
    experiences: [{ designation: "", company: "", startDate: "", endDate: "", isPresent: false, description: "" }],
    projects: [{ name: "", link: "", description: "" }],
    education: [{ degree: "", institution: "", startDate: "", endDate: "", grade: "" }],
    publications: [{ authors: "", date: "", title: "", journal: "", url: "" }],
    skills: [{ category: "", items: "" }],
    certifications: "",
  });

  const [atsScore, setAtsScore] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);

  const handleChange = (e) => {
    setResumeData({ ...resumeData, [e.target.name]: e.target.value });
  };

  const handleArrayChange = (section, index, field, value) => {
    const updated = [...resumeData[section]];
    updated[index] = { ...updated[index], [field]: value };
    setResumeData({ ...resumeData, [section]: updated });
  };

  const addArrayItem = (section) => {
    const templates = {
      experiences: { designation: "", company: "", startDate: "", endDate: "", isPresent: false, description: "" },
      projects: { name: "", link: "", description: "" },
      education: { degree: "", institution: "", startDate: "", endDate: "", grade: "" },
      publications: { authors: "", date: "", title: "", journal: "", url: "" },
      skills: { category: "", items: "" },
    };
    setResumeData({ ...resumeData, [section]: [...resumeData[section], templates[section]] });
  };

  const removeArrayItem = (section, index) => {
    const updated = resumeData[section].filter((_, i) => i !== index);
    setResumeData({ ...resumeData, [section]: updated });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin + 5;

    // Professional Header Section with Name (centered, larger serif font - matching template exactly)
    doc.setFontSize(24);
    doc.setFont("times", "bold");
    doc.setTextColor(0, 0, 0);
    const name = resumeData.name || "Your Name";
    doc.text(name, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 12;

    // Contact Information with vertical separators (matching template exactly - with labels)
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    
    const contactItems = [];
    if (resumeData.github) contactItems.push(`GitHub: ${resumeData.github}`);
    if (resumeData.linkedin) contactItems.push(`LinkedIn: ${resumeData.linkedin}`);
    if (resumeData.website) contactItems.push(`Website: ${resumeData.website}`);
    if (resumeData.email) contactItems.push(`Email: ${resumeData.email}`);
    if (resumeData.phone) contactItems.push(`Phone: ${resumeData.phone}`);
    
    if (contactItems.length > 0) {
      const contactText = contactItems.join(" | ");
      doc.text(contactText, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 12;
    }

    // Professional horizontal line (matching template)
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 12;

    // Helper function to add section heading (matching template - serif font, underlined)
    const addSectionHeading = (title) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = margin + 5;
      }
      
      // Add spacing before section
      yPosition += 4;
      
      doc.setFontSize(11);
      doc.setFont("times", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(title, margin, yPosition);
      
      // Underline (matching template style)
      const headingWidth = doc.getTextWidth(title);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition + 1.5, margin + headingWidth, yPosition + 1.5);
      
      yPosition += 10;
    };

    // SUMMARY Section
    if (resumeData.summary) {
      addSectionHeading("SUMMARY");
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      const summaryLines = doc.splitTextToSize(resumeData.summary, contentWidth);
      doc.text(summaryLines, margin, yPosition);
      yPosition += summaryLines.length * 5 + 8;
    }

    // WORK EXPERIENCE Section (matching template exactly)
    if (resumeData.experiences && resumeData.experiences.length > 0 && resumeData.experiences[0].designation) {
      addSectionHeading("WORK EXPERIENCE");
      
      resumeData.experiences.forEach((exp, idx) => {
        if (!exp.designation) return;
        
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = margin + 5;
        }

        // Add spacing between entries
        if (idx > 0) {
          yPosition += 4;
        }

        // Designation in bold (left-aligned) - matching template
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        
        // Date range right-aligned (matching template)
        let dateRange = "";
        if (exp.startDate) {
          dateRange = formatDate(exp.startDate);
          if (exp.isPresent) {
            dateRange += " - present";
          } else if (exp.endDate) {
            dateRange += ` - ${formatDate(exp.endDate)}`;
          }
        }
        
        // Designation on left, date on right (matching template layout)
        doc.text(exp.designation, margin, yPosition);
        if (dateRange) {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(50, 50, 50);
          doc.text(dateRange, pageWidth - margin, yPosition, { align: "right" });
        }
        yPosition += 6;

        // Description (matching template style - remove bullet points, format as paragraphs)
        if (exp.description) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(50, 50, 50);
          
          // Remove bullet points and format as clean text
          let cleanDescription = exp.description
            .replace(/^[\s•\-\*]+/gm, '') // Remove leading bullets
            .replace(/\n\s*[\s•\-\*]+/g, '\n') // Remove bullets in middle
            .trim();
          
          // Split by newlines and format as paragraphs
          const paragraphs = cleanDescription.split('\n').filter(p => p.trim());
          
          paragraphs.forEach((para, paraIdx) => {
            if (yPosition > pageHeight - 50) {
              doc.addPage();
              yPosition = margin + 5;
            }
            const paraLines = doc.splitTextToSize(para.trim(), contentWidth);
            doc.text(paraLines, margin, yPosition);
            yPosition += paraLines.length * 4.5;
            if (paraIdx < paragraphs.length - 1) {
              yPosition += 2; // Small gap between paragraphs
            }
          });
          
          yPosition += 6; // Space after experience entry
        } else {
          yPosition += 4;
        }
      });
    }

    // PROJECTS Section (matching template exactly)
    if (resumeData.projects && resumeData.projects.length > 0 && resumeData.projects[0].name) {
      addSectionHeading("PROJECTS");
      
      resumeData.projects.forEach((project, idx) => {
        if (!project.name) return;
        
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = margin + 5;
        }

        // Add spacing between entries
        if (idx > 0) {
          yPosition += 4;
        }

        // Project name in bold (left-aligned), link right-aligned (matching template)
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(project.name, margin, yPosition);
        
        if (project.link) {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 255);
          doc.text("Link to Demo", pageWidth - margin, yPosition, { align: "right" });
        }
        yPosition += 6;

        // Project description (matching template style - clean paragraphs)
        if (project.description) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(50, 50, 50);
          
          // Remove bullet points and format as clean text
          let cleanDescription = project.description
            .replace(/^[\s•\-\*]+/gm, '') // Remove leading bullets
            .replace(/\n\s*[\s•\-\*]+/g, '\n') // Remove bullets in middle
            .trim();
          
          const descLines = doc.splitTextToSize(cleanDescription, contentWidth);
          doc.text(descLines, margin, yPosition);
          yPosition += descLines.length * 4.5 + 8;
        } else {
          yPosition += 4;
        }
      });
    }

    // EDUCATION Section (Table format matching template exactly)
    if (resumeData.education && resumeData.education.length > 0 && resumeData.education[0].degree) {
      addSectionHeading("EDUCATION");
      
      resumeData.education.forEach((edu, idx) => {
        if (!edu.degree) return;
        
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = margin + 5;
        }

        // Add spacing between entries
        if (idx > 0) {
          yPosition += 3;
        }

        // Date range on left (matching template format)
        let dateRange = "";
        if (edu.startDate && edu.endDate) {
          const startYear = new Date(edu.startDate).getFullYear();
          const endYear = new Date(edu.endDate).getFullYear();
          dateRange = `${startYear} - ${endYear}`;
        } else if (edu.startDate) {
          const year = new Date(edu.startDate).getFullYear();
          dateRange = year.toString();
        } else if (edu.endDate) {
          const year = new Date(edu.endDate).getFullYear();
          dateRange = year.toString();
        }

        // Education details on right with institution in bold (matching template)
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        
        // Date on left (matching template - fixed width column)
        const dateColumnWidth = 50;
        if (dateRange) {
          doc.text(dateRange, margin, yPosition);
        }
        
        // Degree and institution on right (institution in bold, matching template)
        const startX = margin + dateColumnWidth;
        let currentX = startX;
        
        if (edu.degree) {
          doc.setFont("helvetica", "normal");
          doc.text(edu.degree, currentX, yPosition);
          currentX += doc.getTextWidth(edu.degree) + 3;
        }
        
        if (edu.institution) {
          doc.setFont("helvetica", "bold");
          doc.text(`at ${edu.institution}`, currentX, yPosition);
        }
        
        // Grade/GPA right-aligned in parentheses (matching template)
        if (edu.grade) {
          doc.setFont("helvetica", "normal");
          const gradeText = `(${edu.grade})`;
          doc.text(gradeText, pageWidth - margin, yPosition, { align: "right" });
        }
        
        yPosition += 6;
      });
    }

    // PUBLICATIONS Section
    if (resumeData.publications && resumeData.publications.length > 0 && resumeData.publications[0].title) {
      addSectionHeading("PUBLICATIONS");
      
      resumeData.publications.forEach((pub) => {
        if (!pub.title) return;
        
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        
        let pubText = "";
        if (pub.authors) pubText += `${pub.authors}. `;
        if (pub.date) pubText += `${pub.date}. `;
        if (pub.title) pubText += `"${pub.title}". `;
        if (pub.journal) pubText += `In: ${pub.journal}. `;
        if (pub.url) pubText += pub.url;
        
        const pubLines = doc.splitTextToSize(pubText, contentWidth);
        doc.text(pubLines, margin, yPosition);
        yPosition += pubLines.length * 4.5 + 8;
      });
    }

    // SKILLS Section (with categories matching template)
    if (resumeData.skills && resumeData.skills.length > 0 && resumeData.skills[0].category) {
      addSectionHeading("SKILLS");
      
      resumeData.skills.forEach((skill, idx) => {
        if (!skill.category || !skill.items) return;
        
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = margin + 5;
        }

        // Add spacing between categories
        if (idx > 0) {
          yPosition += 3;
        }

        // Category in bold (matching template)
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(skill.category, margin, yPosition);
        yPosition += 6;

        // Skills items (comma-separated, matching template)
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        doc.text(skill.items, margin, yPosition);
        yPosition += 6 + 6;
      });
    }

    // CERTIFICATIONS Section
    if (resumeData.certifications) {
      addSectionHeading("CERTIFICATIONS");
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      const certLines = doc.splitTextToSize(resumeData.certifications, contentWidth);
      doc.text(certLines, margin, yPosition);
      yPosition += certLines.length * 4.5 + 8;
    }

    // Footer with last updated date (matching template exactly)
    const lastPage = doc.internal.pages.length - 1;
    doc.setPage(lastPage);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150, 150, 150);
    const now = new Date();
    const months = ["January", "February", "March", "April", "May", "June", 
                   "July", "August", "September", "October", "November", "December"];
    const footerText = `Last updated: ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });

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
    // Convert structured data to flat format for ATS analysis
    const flatResumeData = {
      name: resumeData.name,
      email: resumeData.email,
      phone: resumeData.phone,
      linkedin: resumeData.linkedin,
      github: resumeData.github,
      summary: resumeData.summary,
      skills: resumeData.skills.map(s => `${s.category}: ${s.items}`).join(", "),
      experience: resumeData.experiences.map(e => 
        `${e.designation} at ${e.company} (${e.startDate} - ${e.isPresent ? 'present' : e.endDate}): ${e.description}`
      ).join("\n"),
      projects: resumeData.projects.map(p => `${p.name}${p.link ? ` (${p.link})` : ''}: ${p.description}`).join("\n"),
      education: resumeData.education.map(e => 
        `${e.degree} at ${e.institution} (${e.startDate} - ${e.endDate}) - ${e.grade}`
      ).join("\n"),
      certifications: resumeData.certifications,
    };

    setAtsLoading(true);
    setAtsScore(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:8080/api/ats/score",
        { resumeData: flatResumeData },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAtsScore(response.data);
    } catch (error) {
      console.error("ATS Analysis failed:", error);
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
      <section className="resume-header">
        <h1>Resume Builder</h1>
        <p>
          Create a professional, ATS-friendly resume with our easy-to-use
          builder.
        </p>
      </section>

      <section className="resume-form">
        <h2>Personal Information</h2>
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

        <div className="form-row">
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
            <label>Website/Portfolio</label>
            <input
              type="text"
              name="website"
              placeholder="mysite.com"
              value={resumeData.website}
              onChange={handleChange}
            />
          </div>
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

        <h2>Work Experience</h2>
        {resumeData.experiences.map((exp, index) => (
          <div key={index} className="array-item">
            <div className="array-item-header">
              <h3>Experience {index + 1}</h3>
              {resumeData.experiences.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeArrayItem("experiences", index)}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Designation/Job Title *</label>
                <input
                  type="text"
                  placeholder="Software Engineer"
                  value={exp.designation}
                  onChange={(e) => handleArrayChange("experiences", index, "designation", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Company *</label>
                <input
                  type="text"
                  placeholder="ABC Corp"
                  value={exp.company}
                  onChange={(e) => handleArrayChange("experiences", index, "company", e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="month"
                  value={exp.startDate}
                  onChange={(e) => handleArrayChange("experiences", index, "startDate", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="month"
                  value={exp.endDate}
                  disabled={exp.isPresent}
                  onChange={(e) => handleArrayChange("experiences", index, "endDate", e.target.value)}
                />
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={exp.isPresent}
                    onChange={(e) => handleArrayChange("experiences", index, "isPresent", e.target.checked)}
                  />
                  Currently working here
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows="4"
                placeholder="• Developed scalable web applications...&#10;• Led a team of 3 developers..."
                value={exp.description}
                onChange={(e) => handleArrayChange("experiences", index, "description", e.target.value)}
              ></textarea>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="add-btn"
          onClick={() => addArrayItem("experiences")}
        >
          + Add Another Experience
        </button>

        <h2>Projects</h2>
        {resumeData.projects.map((project, index) => (
          <div key={index} className="array-item">
            <div className="array-item-header">
              <h3>Project {index + 1}</h3>
              {resumeData.projects.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeArrayItem("projects", index)}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Project Name *</label>
                <input
                  type="text"
                  placeholder="E-commerce Platform"
                  value={project.name}
                  onChange={(e) => handleArrayChange("projects", index, "name", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Link to Demo</label>
                <input
                  type="text"
                  placeholder="https://demo.example.com"
                  value={project.link}
                  onChange={(e) => handleArrayChange("projects", index, "link", e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows="3"
                placeholder="Built a full-stack application with 10,000+ users. Implemented payment gateway integration..."
                value={project.description}
                onChange={(e) => handleArrayChange("projects", index, "description", e.target.value)}
              ></textarea>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="add-btn"
          onClick={() => addArrayItem("projects")}
        >
          + Add Another Project
        </button>

        <h2>Education</h2>
        {resumeData.education.map((edu, index) => (
          <div key={index} className="array-item">
            <div className="array-item-header">
              <h3>Education {index + 1}</h3>
              {resumeData.education.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeArrayItem("education", index)}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Degree *</label>
                <input
                  type="text"
                  placeholder="Bachelor of Technology in Computer Science"
                  value={edu.degree}
                  onChange={(e) => handleArrayChange("education", index, "degree", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Institution *</label>
                <input
                  type="text"
                  placeholder="XYZ University"
                  value={edu.institution}
                  onChange={(e) => handleArrayChange("education", index, "institution", e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="month"
                  value={edu.startDate}
                  onChange={(e) => handleArrayChange("education", index, "startDate", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="month"
                  value={edu.endDate}
                  onChange={(e) => handleArrayChange("education", index, "endDate", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Grade/GPA</label>
                <input
                  type="text"
                  placeholder="CGPA: 8.5/10 or GPA: 4.0/4.0"
                  value={edu.grade}
                  onChange={(e) => handleArrayChange("education", index, "grade", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="add-btn"
          onClick={() => addArrayItem("education")}
        >
          + Add Another Education
        </button>

        <h2>Publications (Optional)</h2>
        {resumeData.publications.map((pub, index) => (
          <div key={index} className="array-item">
            <div className="array-item-header">
              <h3>Publication {index + 1}</h3>
              {resumeData.publications.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeArrayItem("publications", index)}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Authors</label>
                <input
                  type="text"
                  placeholder="Last Name, First Name and First Name Other Last Name"
                  value={pub.authors}
                  onChange={(e) => handleArrayChange("publications", index, "authors", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Publication Date</label>
                <input
                  type="text"
                  placeholder="Sept. 2019"
                  value={pub.date}
                  onChange={(e) => handleArrayChange("publications", index, "date", e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Paper Title *</label>
              <input
                type="text"
                placeholder="This is the name of the paper"
                value={pub.title}
                onChange={(e) => handleArrayChange("publications", index, "title", e.target.value)}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Journal/Conference</label>
                <input
                  type="text"
                  placeholder="Some Journal 99.18, pp. 2200-2300"
                  value={pub.journal}
                  onChange={(e) => handleArrayChange("publications", index, "journal", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>URL</label>
                <input
                  type="text"
                  placeholder="https://some-link.com"
                  value={pub.url}
                  onChange={(e) => handleArrayChange("publications", index, "url", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="add-btn"
          onClick={() => addArrayItem("publications")}
        >
          + Add Another Publication
        </button>

        <h2>Skills</h2>
        {resumeData.skills.map((skill, index) => (
          <div key={index} className="array-item">
            <div className="array-item-header">
              <h3>Skill Category {index + 1}</h3>
              {resumeData.skills.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeArrayItem("skills", index)}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <input
                  type="text"
                  placeholder="Programming Languages"
                  value={skill.category}
                  onChange={(e) => handleArrayChange("skills", index, "category", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Skills (comma-separated) *</label>
                <input
                  type="text"
                  placeholder="JavaScript, React, Node.js, Python, SQL"
                  value={skill.items}
                  onChange={(e) => handleArrayChange("skills", index, "items", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="add-btn"
          onClick={() => addArrayItem("skills")}
        >
          + Add Another Skill Category
        </button>

        <div className="form-group">
          <label>Certifications</label>
          <textarea
            name="certifications"
            rows="3"
            placeholder="AWS Certified Solutions Architect&#10;Google Cloud Professional Data Engineer"
            value={resumeData.certifications}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="action-buttons">
          <button className="generate-btn primary" onClick={generatePDF}>
            Download Professional Resume
          </button>
          <button
            className="generate-btn secondary"
            onClick={analyzeWithATS}
            disabled={atsLoading}
          >
            {atsLoading ? "Analyzing..." : "Analyze with AI ATS"}
          </button>
        </div>
      </section>

      {/* ATS Score Display */}
      {atsScore && (
        <section className="ats-results">
          <h2>ATS Analysis Results</h2>
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
                  ? "Excellent"
                  : atsScore.score >= 50
                  ? "Good"
                  : "Needs Improvement"}
              </p>
            </div>
          </div>

          <div className="feedback-section">
            <h3>Detailed Feedback</h3>
            <div className="feedback-content">{atsScore.feedback}</div>
          </div>

          {atsScore.suggestions && atsScore.suggestions.length > 0 && (
            <div className="suggestions-section">
              <h3>Suggestions for Improvement</h3>
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
