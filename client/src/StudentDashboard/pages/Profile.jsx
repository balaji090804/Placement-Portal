import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Profile.css"; // Updated CSS references .form-group
import ActivityInsights from "../components/ActivityInsights";

const Profile = () => {
  // Logged-in user from /api/users/me
  const [user, setUser] = useState(null);

  // If we already have a StudentProfile doc in DB, store it here
  const [profile, setProfile] = useState(null);
  // Keep track if the profile doc already exists
  const [profileExists, setProfileExists] = useState(false);

  // Are we editing an existing doc? Or creating a new doc?
  const [editing, setEditing] = useState(false);

  // For loading states / error / success
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // We'll have one "form" state for create or update actions
  const [formData, setFormData] = useState({
    collegeEmail: "",
    name: "",
    headline: "",
    summary: "",
    contactNumber: "",
    stream: "BE",
    branch: "",
    location: "",
    resume: "",
    tenthPercentage: "",
    twelfthPercentage: "",
    cgpa: "",
    certifications: [],
    github: "",
    projects: [],
    linkedin: "",
    codingProfiles: [],
    skills: "",
    profilePicture: "",
    totalExperienceMonths: "",
    employmentHistory: [],
    education: [],
    preferredRoles: [],
    preferredLocations: [],
    noticePeriodDays: "",
    currentCTC: "",
    expectedCTC: "",
    profileVisibility: "public",
  });

  // For handling array inputs (projects, certifications, etc.)
  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState({ name: "", url: "" });
  const [newProject, setNewProject] = useState({
    name: "",
    techStack: "",
    description: "",
  });
  const [newCodeProfile, setNewCodeProfile] = useState({
    platform: "",
    url: "",
  });
  const [newEmployment, setNewEmployment] = useState({
    company: "",
    designation: "",
    from: "",
    to: "",
    current: false,
    description: "",
  });
  const [newEducation, setNewEducation] = useState({
    degree: "",
    institution: "",
    year: "",
    score: "",
  });
  const [newPrefRole, setNewPrefRole] = useState("");
  const [newPrefLoc, setNewPrefLoc] = useState("");

  // ==============================================
  // 1) On mount, load user + check if profile doc exists
  // ==============================================
  useEffect(() => {
    const loadUserAndProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found. Please login.");
          setLoading(false);
          return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };
        // GET /api/users/me => get user => user.email
        const userRes = await axios.get(
          "http://localhost:8080/api/users/me",
          config
        );
        const loggedUser = userRes.data;
        setUser(loggedUser);

        // Then check if there's a StudentProfile doc for user.email
        const profileRes = await axios.get(
          `http://localhost:8080/api/student-profile?email=${loggedUser.email}`,
          config
        );

        // If found, store it
        setProfileExists(true);
        setProfile(profileRes.data);
      } catch (err) {
        // If 404 => doc not found, so user must create a new one
        if (err.response && err.response.status === 404) {
          setProfileExists(false);
        } else {
          setError(
            err.response?.data?.message || "Error fetching user/profile"
          );
        }
      } finally {
        setLoading(false);
      }
    };
    loadUserAndProfile();
  }, []);

  // ==============================================
  // 2) Handler: switch to "edit existing doc" mode
  // ==============================================
  const startEditing = () => {
    if (!profile) return;
    setEditing(true);
    setMessage("");
    setError("");

    // Pre-fill formData with existing doc fields
    setFormData({
      collegeEmail: profile.collegeEmail || "",
      name: profile.name || "",
      headline: profile.headline || "",
      summary: profile.summary || "",
      contactNumber: profile.contactNumber || "",
      stream: profile.stream || "BE",
      branch: profile.branch || "",
      location: profile.location || "",
      resume: profile.resume || "",
      tenthPercentage: profile.tenthPercentage || "",
      twelfthPercentage: profile.twelfthPercentage || "",
      cgpa: profile.cgpa || "",
      certifications: profile.certifications || [],
      github: profile.github || "",
      projects: profile.projects || [],
      linkedin: profile.linkedin || "",
      codingProfiles: profile.codingProfiles || [],
      skills: profile.skills || "",
      profilePicture: profile.profilePicture || "",
      totalExperienceMonths: profile.totalExperienceMonths || "",
      employmentHistory: profile.employmentHistory || [],
      education: profile.education || [],
      preferredRoles: profile.preferredRoles || [],
      preferredLocations: profile.preferredLocations || [],
      noticePeriodDays: profile.noticePeriodDays || "",
      currentCTC: profile.currentCTC || "",
      expectedCTC: profile.expectedCTC || "",
      profileVisibility: profile.profileVisibility || "public",
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditing(false);
    setMessage("");
    setError("");
  };

  // ==============================================
  // 3) For "create new doc" if no doc in DB
  //    also for "save changes" if editing an existing doc
  // ==============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found. Please login.");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Always use user.email for consistency
      const payload = { ...formData };
      payload.collegeEmail = user.email;

      // PUT /api/student-profile => upsert
      const res = await axios.put(
        "http://localhost:8080/api/student-profile",
        payload,
        config
      );

      setMessage(res.data.message || "Profile saved!");

      // If this was a new doc or an update, store it in profile
      setProfileExists(true);
      setProfile({ ...payload });

      // If we were editing, exit edit mode
      if (editing) {
        setEditing(false);
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err.response?.data?.message || "Error saving profile");
    }
  };

  // ==============================================
  // 4) Input change handlers
  // ==============================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Profile picture
  const handlePictureUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profilePicture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Skills
  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter" && newSkill.trim()) {
      e.preventDefault();
      const updated = formData.skills
        ? formData.skills + "," + newSkill
        : newSkill;
      setFormData((prev) => ({ ...prev, skills: updated }));
      setNewSkill("");
    }
  };
  const removeSkill = (idx) => {
    const arr = formData.skills.split(",").filter((_, i) => i !== idx);
    setFormData((prev) => ({ ...prev, skills: arr.join(",") }));
  };

  // Projects
  const addProject = () => {
    if (newProject.name && newProject.techStack && newProject.description) {
      setFormData((prev) => ({
        ...prev,
        projects: [...prev.projects, newProject],
      }));
      setNewProject({ name: "", techStack: "", description: "" });
    }
  };

  const addEmployment = () => {
    if (
      newEmployment.company &&
      newEmployment.designation &&
      (newEmployment.from || newEmployment.current)
    ) {
      setFormData((prev) => ({
        ...prev,
        employmentHistory: [...prev.employmentHistory, newEmployment],
      }));
      setNewEmployment({
        company: "",
        designation: "",
        from: "",
        to: "",
        current: false,
        description: "",
      });
    }
  };

  const addEducation = () => {
    if (newEducation.degree && newEducation.institution) {
      setFormData((prev) => ({
        ...prev,
        education: [...prev.education, newEducation],
      }));
      setNewEducation({ degree: "", institution: "", year: "", score: "" });
    }
  };

  // Certifications
  const addCertification = () => {
    if (newCert.name && newCert.url) {
      setFormData((prev) => ({
        ...prev,
        certifications: [...prev.certifications, newCert],
      }));
      setNewCert({ name: "", url: "" });
    }
  };

  // Coding profiles
  const addCodingProfile = () => {
    if (newCodeProfile.platform && newCodeProfile.url) {
      setFormData((prev) => ({
        ...prev,
        codingProfiles: [...prev.codingProfiles, newCodeProfile],
      }));
      setNewCodeProfile({ platform: "", url: "" });
    }
  };

  // ==============================================
  // RENDER
  // ==============================================
  if (loading) return <p className="info-text">Loading...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!user) return <p className="info-text">No user found. Please login.</p>;

  // ----------------------------------------------
  // If there's no profile doc => show create form
  // ----------------------------------------------
  if (!profileExists) {
    return (
      <div className="profile-page">
        <h1>Create Your Profile</h1>
        <p className="subtext">
          No existing profile was found for <b>{user.email}</b>. Please fill out
          the form below:
        </p>

        {message && <p className="success-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit} className="profile-form">
          {/* Example usage of .form-group for single fields */}
          <div className="form-group">
            <label>Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Contact Number</label>
            <input
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Stream</label>
            <select
              name="stream"
              value={formData.stream}
              onChange={handleChange}
            >
              <option value="BE">BE</option>
              <option value="BTECH">BTECH</option>
              <option value="ME">ME</option>
              <option value="MTECH">MTECH</option>
            </select>
          </div>

          <div className="form-group">
            <label>Branch</label>
            <input
              name="branch"
              value={formData.branch}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>10th %</label>
            <input
              type="number"
              name="tenthPercentage"
              value={formData.tenthPercentage}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>12th %</label>
            <input
              type="number"
              name="twelfthPercentage"
              value={formData.twelfthPercentage}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>CGPA</label>
            <input
              type="number"
              step="0.01"
              name="cgpa"
              value={formData.cgpa}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Resume URL</label>
            <input
              name="resume"
              value={formData.resume}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>LinkedIn</label>
            <input
              name="linkedin"
              value={formData.linkedin}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>GitHub</label>
            <input
              name="github"
              value={formData.github}
              onChange={handleChange}
            />
          </div>

          {/* Projects */}
          <div className="form-group array-section">
            <h3>Projects</h3>
            <input
              placeholder="Project Name"
              value={newProject.name}
              onChange={(e) =>
                setNewProject({ ...newProject, name: e.target.value })
              }
            />
            <input
              placeholder="Tech Stack"
              value={newProject.techStack}
              onChange={(e) =>
                setNewProject({ ...newProject, techStack: e.target.value })
              }
            />
            <textarea
              placeholder="Description"
              value={newProject.description}
              onChange={(e) =>
                setNewProject({ ...newProject, description: e.target.value })
              }
            />
            <button type="button" onClick={addProject} className="add-btn">
              Add Project
            </button>

            <ul>
              {formData.projects.map((p, idx) => (
                <li key={idx}>
                  <b>{p.name}</b> ({p.techStack}): {p.description}
                </li>
              ))}
            </ul>
          </div>

          {/* Certifications */}
          <div className="form-group array-section">
            <h3>Certifications</h3>
            <input
              placeholder="Cert Name"
              value={newCert.name}
              onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
            />
            <input
              placeholder="Cert URL"
              value={newCert.url}
              onChange={(e) => setNewCert({ ...newCert, url: e.target.value })}
            />
            <button
              type="button"
              onClick={addCertification}
              className="add-btn"
            >
              Add Cert
            </button>

            <ul>
              {formData.certifications.map((c, idx) => (
                <li key={idx}>
                  {c.name} - {c.url}
                </li>
              ))}
            </ul>
          </div>

          {/* Coding profiles */}
          <div className="form-group array-section">
            <h3>Coding Profiles</h3>
            <input
              placeholder="Platform"
              value={newCodeProfile.platform}
              onChange={(e) =>
                setNewCodeProfile({
                  ...newCodeProfile,
                  platform: e.target.value,
                })
              }
            />
            <input
              placeholder="Profile URL"
              value={newCodeProfile.url}
              onChange={(e) =>
                setNewCodeProfile({ ...newCodeProfile, url: e.target.value })
              }
            />
            <button
              type="button"
              onClick={addCodingProfile}
              className="add-btn"
            >
              Add Profile
            </button>

            <ul>
              {formData.codingProfiles.map((cp, idx) => (
                <li key={idx}>
                  <b>{cp.platform}:</b> {cp.url}
                </li>
              ))}
            </ul>
          </div>

          {/* Skills */}
          <div className="form-group array-section">
            <label>Skills (Press Enter to Add)</label>
            <div className="skills-container">
              {formData.skills
                .split(",")
                .filter(Boolean)
                .map((sk, i) => (
                  <span key={i} className="skill-chip">
                    {sk.trim()}
                    <span
                      className="remove-skill"
                      onClick={() => removeSkill(i)}
                    >
                      ×
                    </span>
                  </span>
                ))}
              <input
                placeholder="Add a skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={handleSkillKeyDown}
              />
            </div>
          </div>

          {/* Picture */}
          <div className="form-group array-section">
            <h3>Profile Picture</h3>
            {formData.profilePicture && (
              <img
                src={formData.profilePicture}
                alt="preview"
                className="preview-pic"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePictureUpload}
            />
          </div>

          <div className="form-group">
            <button type="submit" className="submit-btn">
              Create Profile
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ----------------------------------------------
  // If doc DOES exist
  // If NOT editing => read-only. If editing => form with pre-filled data
  // ----------------------------------------------
  if (!editing) {
    // Naukri-like read-only layout with profile strength and section cards
    const fieldsForStrength = [
      profile.name,
      profile.headline,
      profile.summary,
      profile.skills,
      profile.linkedin,
      profile.github,
      profile.projects && profile.projects.length,
      profile.certifications && profile.certifications.length,
      profile.employmentHistory && profile.employmentHistory.length,
      profile.education && profile.education.length,
      profile.resume,
      profile.profilePicture,
    ];
    const filled = fieldsForStrength.filter(Boolean).length;
    const strength = Math.min(
      100,
      Math.round((filled / fieldsForStrength.length) * 100)
    );

    return (
      <div className="profile-page">
        <h1>My Profile</h1>
        {message && <p className="success-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}

        {/* Activity Insights */}
        <ActivityInsights
          email={user.email}
          token={localStorage.getItem("token")}
        />

        <div
          className="read-section"
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: "20px",
          }}
        >
          {/* Left rail */}
          <div>
            <div className="profile-picture" style={{ textAlign: "center" }}>
              <img
                src={
                  profile.profilePicture ||
                  "https://www.w3schools.com/howto/img_avatar.png"
                }
                alt={
                  profile.name
                    ? `${profile.name} profile photo`
                    : "Default profile avatar"
                }
                className="preview-pic"
                style={{ borderRadius: "60px" }}
              />
              <h2 style={{ marginTop: "10px" }}>
                {profile.name || "Your Name"}
              </h2>
              {profile.headline && (
                <p style={{ color: "#666" }}>{profile.headline}</p>
              )}
              {profile.location && (
                <p style={{ color: "#888", fontSize: "0.9rem" }}>
                  📍 {profile.location}
                </p>
              )}
            </div>

            <div style={{ marginTop: "16px" }}>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>
                Profile Strength
              </p>
              <div style={{ background: "#eee", borderRadius: 8, height: 10 }}>
                <div
                  style={{
                    width: `${strength}%`,
                    height: 10,
                    background:
                      strength > 80
                        ? "#2e7d32"
                        : strength > 50
                        ? "#ff9800"
                        : "#f44336",
                    borderRadius: 8,
                  }}
                ></div>
              </div>
              <p style={{ fontSize: "0.9rem", color: "#666", marginTop: 6 }}>
                {strength}% complete
              </p>
            </div>

            {/* Quick academics glance */}
            <div
              className="array-display"
              aria-label="academics summary"
              style={{ marginTop: "16px" }}
            >
              <h3>Academics</h3>
              <div className="skills-container">
                <span
                  className="skill-chip"
                  title="CGPA"
                  aria-label="Current CGPA"
                >
                  CGPA: {profile.cgpa || "N/A"}
                </span>
                <span
                  className="skill-chip"
                  title="10th Percentage"
                  aria-label="Tenth grade percentage"
                >
                  10th: {profile.tenthPercentage || "N/A"}%
                </span>
                <span
                  className="skill-chip"
                  title="12th Percentage"
                  aria-label="Twelfth grade percentage"
                >
                  12th: {profile.twelfthPercentage || "N/A"}%
                </span>
                {profile.branch && (
                  <span
                    className="skill-chip"
                    title="Branch"
                    aria-label="Branch and stream"
                  >
                    {profile.stream || ""} {profile.branch}
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <p>
                <strong>Resume</strong>
              </p>
              {profile.resume ? (
                <a href={profile.resume} target="_blank" rel="noreferrer">
                  View Resume
                </a>
              ) : (
                <p style={{ color: "#888" }}>No resume added</p>
              )}
            </div>

            <div style={{ marginTop: "16px" }}>
              <button
                onClick={startEditing}
                className="edit-btn"
                style={{ width: "100%" }}
                aria-label="Edit profile"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Right content */}
          <div>
            {/* Summary */}
            <div className="array-display">
              <h3>Profile Summary</h3>
              {profile.summary ? (
                <p>{profile.summary}</p>
              ) : (
                <p style={{ color: "#888" }}>
                  Add a short professional summary.
                </p>
              )}
            </div>

            {/* Key Skills */}
            <div className="array-display">
              <h3>Key Skills</h3>
              <div className="skills-container">
                {String(profile.skills || "")
                  .split(",")
                  .filter(Boolean)
                  .map((sk, i) => (
                    <span key={i} className="skill-chip">
                      {sk.trim()}
                    </span>
                  ))}
                {!profile.skills && (
                  <p style={{ color: "#888" }}>
                    Add skills to improve profile strength.
                  </p>
                )}
              </div>
            </div>

            {/* Employment */}
            <div className="array-display">
              <h3>Employment</h3>
              {Array.isArray(profile.employmentHistory) &&
              profile.employmentHistory.length ? (
                <ul>
                  {profile.employmentHistory.map((job, idx) => (
                    <li key={idx}>
                      <b>{job.designation}</b> @ {job.company} ({job.from} -{" "}
                      {job.current ? "Present" : job.to})
                      {job.description && (
                        <div style={{ color: "#555" }}>{job.description}</div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#888" }}>Add your work experience.</p>
              )}
            </div>

            {/* Education */}
            <div className="array-display">
              <h3>Education</h3>
              {Array.isArray(profile.education) && profile.education.length ? (
                <ul>
                  {profile.education.map((ed, idx) => (
                    <li key={idx}>
                      <b>{ed.degree}</b>, {ed.institution}{" "}
                      {ed.year && `- ${ed.year}`}{" "}
                      {ed.score && `(Score: ${ed.score})`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#888" }}>Add your education details.</p>
              )}
            </div>

            {/* Projects */}
            <div className="array-display">
              <h3>Projects</h3>
              {profile.projects && profile.projects.length ? (
                <ul>
                  {profile.projects.map((proj, idx) => (
                    <li key={idx}>
                      <b>{proj.name}</b> ({proj.techStack}): {proj.description}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#888" }}>
                  Add projects to showcase your work.
                </p>
              )}
            </div>

            {/* Certifications */}
            <div className="array-display">
              <h3>Certifications</h3>
              {profile.certifications && profile.certifications.length ? (
                <ul>
                  {profile.certifications.map((c, idx) => (
                    <li key={idx}>
                      {c.name} - {c.url}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#888" }}>Add certifications.</p>
              )}
            </div>

            {/* Social Profiles */}
            <div className="array-display">
              <h3>Social & Coding Profiles</h3>
              <ul>
                <li>
                  <b>LinkedIn:</b>{" "}
                  {profile.linkedin || (
                    <span style={{ color: "#888" }}>Add your LinkedIn</span>
                  )}
                </li>
                <li>
                  <b>GitHub:</b>{" "}
                  {profile.github || (
                    <span style={{ color: "#888" }}>Add your GitHub</span>
                  )}
                </li>
                {profile.codingProfiles &&
                  profile.codingProfiles.map((cp, idx) => (
                    <li key={idx}>
                      <b>{cp.platform}:</b> {cp.url}
                    </li>
                  ))}
              </ul>
            </div>

            {/* Career Preferences */}
            <div className="array-display">
              <h3>Career Preferences</h3>
              <p>
                <b>Preferred Roles:</b>{" "}
                {(profile.preferredRoles || []).join(", ") || (
                  <span style={{ color: "#888" }}>Add roles</span>
                )}
              </p>
              <p>
                <b>Preferred Locations:</b>{" "}
                {(profile.preferredLocations || []).join(", ") || (
                  <span style={{ color: "#888" }}>Add locations</span>
                )}
              </p>
              <p>
                <b>Notice Period:</b>{" "}
                {profile.noticePeriodDays ? (
                  `${profile.noticePeriodDays} days`
                ) : (
                  <span style={{ color: "#888" }}>Add notice period</span>
                )}
              </p>
              <p>
                <b>Current CTC:</b>{" "}
                {profile.currentCTC ? (
                  `${profile.currentCTC} LPA`
                ) : (
                  <span style={{ color: "#888" }}>Add current CTC</span>
                )}
              </p>
              <p>
                <b>Expected CTC:</b>{" "}
                {profile.expectedCTC ? (
                  `${profile.expectedCTC} LPA`
                ) : (
                  <span style={{ color: "#888" }}>Add expected CTC</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If editing => show the form, pre-filled with formData
  return (
    <div className="profile-page">
      <h1>Update Profile</h1>
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Name</label>
          <input name="name" value={formData.name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Headline</label>
          <input
            name="headline"
            value={formData.headline}
            onChange={handleChange}
            placeholder="e.g., Final-year CS student | MERN Developer"
          />
        </div>

        <div className="form-group">
          <label>Summary</label>
          <textarea
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            placeholder="Short professional summary"
          />
        </div>

        <div className="form-group">
          <label>Contact Number</label>
          <input
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Stream</label>
          <select name="stream" value={formData.stream} onChange={handleChange}>
            <option value="BE">BE</option>
            <option value="BTECH">BTECH</option>
            <option value="ME">ME</option>
            <option value="MTECH">MTECH</option>
          </select>
        </div>

        <div className="form-group">
          <label>Branch</label>
          <input
            name="branch"
            value={formData.branch}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Location</label>
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="City, State"
          />
        </div>

        <div className="form-group">
          <label>10th %</label>
          <input
            type="number"
            name="tenthPercentage"
            value={formData.tenthPercentage}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>12th %</label>
          <input
            type="number"
            name="twelfthPercentage"
            value={formData.twelfthPercentage}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>CGPA</label>
          <input
            type="number"
            step="0.01"
            name="cgpa"
            value={formData.cgpa}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Resume URL</label>
          <input
            name="resume"
            value={formData.resume}
            onChange={handleChange}
          />
          <div style={{ marginTop: 8 }}>
            <label>Or upload resume (PDF/DOC/DOCX)</label>
            <input
              type="file"
              accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const token = localStorage.getItem("token");
                  const fd = new FormData();
                  fd.append("file", file);
                  const res = await fetch(
                    "http://localhost:8080/api/student-profile/resume",
                    {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                      body: fd,
                    }
                  );
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message || "Upload failed");
                  setFormData((prev) => ({ ...prev, resume: data.url }));
                  setMessage("Resume uploaded successfully");
                } catch (err) {
                  setError(err.message);
                } finally {
                  e.target.value = "";
                }
              }}
            />
          </div>
        </div>

        <div className="form-group">
          <label>LinkedIn</label>
          <input
            name="linkedin"
            value={formData.linkedin}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>GitHub</label>
          <input
            name="github"
            value={formData.github}
            onChange={handleChange}
          />
        </div>

        {/* Projects */}
        <div className="form-group array-section">
          <h3>Projects</h3>
          <input
            placeholder="Project Name"
            value={newProject.name}
            onChange={(e) =>
              setNewProject({ ...newProject, name: e.target.value })
            }
          />
          <input
            placeholder="Tech Stack"
            value={newProject.techStack}
            onChange={(e) =>
              setNewProject({ ...newProject, techStack: e.target.value })
            }
          />
          <textarea
            placeholder="Description"
            value={newProject.description}
            onChange={(e) =>
              setNewProject({ ...newProject, description: e.target.value })
            }
          />
          <button type="button" onClick={addProject} className="add-btn">
            Add Project
          </button>

          <ul>
            {formData.projects.map((p, idx) => (
              <li key={idx}>
                <b>{p.name}</b> ({p.techStack}): {p.description}
              </li>
            ))}
          </ul>
        </div>

        {/* Employment */}
        <div className="form-group array-section">
          <h3>Employment</h3>
          <input
            placeholder="Company"
            value={newEmployment.company}
            onChange={(e) =>
              setNewEmployment({ ...newEmployment, company: e.target.value })
            }
          />
          <input
            placeholder="Designation"
            value={newEmployment.designation}
            onChange={(e) =>
              setNewEmployment({
                ...newEmployment,
                designation: e.target.value,
              })
            }
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <input
              placeholder="From (e.g., 2023-06)"
              value={newEmployment.from}
              onChange={(e) =>
                setNewEmployment({ ...newEmployment, from: e.target.value })
              }
            />
            <input
              placeholder="To (e.g., 2024-05)"
              value={newEmployment.to}
              onChange={(e) =>
                setNewEmployment({ ...newEmployment, to: e.target.value })
              }
              disabled={newEmployment.current}
            />
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "6px",
            }}
          >
            <input
              type="checkbox"
              checked={newEmployment.current}
              onChange={(e) =>
                setNewEmployment({
                  ...newEmployment,
                  current: e.target.checked,
                })
              }
            />
            Currently working here
          </label>
          <textarea
            placeholder="Description"
            value={newEmployment.description}
            onChange={(e) =>
              setNewEmployment({
                ...newEmployment,
                description: e.target.value,
              })
            }
          />
          <button type="button" onClick={addEmployment} className="add-btn">
            Add Employment
          </button>

          <ul>
            {formData.employmentHistory.map((job, idx) => (
              <li key={idx}>
                <b>{job.designation}</b> @ {job.company} ({job.from} -{" "}
                {job.current ? "Present" : job.to})
              </li>
            ))}
          </ul>
        </div>

        {/* Education */}
        <div className="form-group array-section">
          <h3>Education</h3>
          <input
            placeholder="Degree"
            value={newEducation.degree}
            onChange={(e) =>
              setNewEducation({ ...newEducation, degree: e.target.value })
            }
          />
          <input
            placeholder="Institution"
            value={newEducation.institution}
            onChange={(e) =>
              setNewEducation({ ...newEducation, institution: e.target.value })
            }
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <input
              placeholder="Year"
              value={newEducation.year}
              onChange={(e) =>
                setNewEducation({ ...newEducation, year: e.target.value })
              }
            />
            <input
              placeholder="Score/CGPA"
              value={newEducation.score}
              onChange={(e) =>
                setNewEducation({ ...newEducation, score: e.target.value })
              }
            />
          </div>
          <button type="button" onClick={addEducation} className="add-btn">
            Add Education
          </button>

          <ul>
            {formData.education.map((ed, idx) => (
              <li key={idx}>
                <b>{ed.degree}</b>, {ed.institution} {ed.year && `- ${ed.year}`}{" "}
                {ed.score && `(Score: ${ed.score})`}
              </li>
            ))}
          </ul>
        </div>

        {/* Certifications */}
        <div className="form-group array-section">
          <h3>Certifications</h3>
          <input
            placeholder="Cert Name"
            value={newCert.name}
            onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
          />
          <input
            placeholder="Cert URL"
            value={newCert.url}
            onChange={(e) => setNewCert({ ...newCert, url: e.target.value })}
          />
          <button type="button" onClick={addCertification} className="add-btn">
            Add Cert
          </button>

          <ul>
            {formData.certifications.map((c, idx) => (
              <li key={idx}>
                {c.name} - {c.url}
              </li>
            ))}
          </ul>
        </div>

        {/* Coding profiles */}
        <div className="form-group array-section">
          <h3>Coding Profiles</h3>
          <input
            placeholder="Platform"
            value={newCodeProfile.platform}
            onChange={(e) =>
              setNewCodeProfile({ ...newCodeProfile, platform: e.target.value })
            }
          />
          <input
            placeholder="Profile URL"
            value={newCodeProfile.url}
            onChange={(e) =>
              setNewCodeProfile({ ...newCodeProfile, url: e.target.value })
            }
          />
          <button type="button" onClick={addCodingProfile} className="add-btn">
            Add Profile
          </button>

          <ul>
            {formData.codingProfiles.map((cp, idx) => (
              <li key={idx}>
                <b>{cp.platform}:</b> {cp.url}
              </li>
            ))}
          </ul>
        </div>

        {/* Skills */}
        <div className="form-group array-section">
          <label>Skills (Press Enter to Add)</label>
          <div className="skills-container">
            {formData.skills
              .split(",")
              .filter(Boolean)
              .map((sk, i) => (
                <span key={i} className="skill-chip">
                  {sk.trim()}
                  <span className="remove-skill" onClick={() => removeSkill(i)}>
                    ×
                  </span>
                </span>
              ))}
            <input
              placeholder="Add a skill..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={handleSkillKeyDown}
            />
          </div>
        </div>

        {/* Preferences & Experience */}
        <div className="form-group array-section">
          <h3>Experience & Preferences</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <input
              type="number"
              name="totalExperienceMonths"
              placeholder="Total Experience (months)"
              value={formData.totalExperienceMonths}
              onChange={handleChange}
            />
            <input
              type="number"
              name="noticePeriodDays"
              placeholder="Notice Period (days)"
              value={formData.noticePeriodDays}
              onChange={handleChange}
            />
            <input
              type="number"
              step="0.1"
              name="currentCTC"
              placeholder="Current CTC (LPA)"
              value={formData.currentCTC}
              onChange={handleChange}
            />
            <input
              type="number"
              step="0.1"
              name="expectedCTC"
              placeholder="Expected CTC (LPA)"
              value={formData.expectedCTC}
              onChange={handleChange}
            />
          </div>

          <div style={{ marginTop: "8px" }}>
            <label>Preferred Roles</label>
            <div className="skills-container">
              {(formData.preferredRoles || []).map((r, i) => (
                <span key={i} className="skill-chip">
                  {r}
                  <span
                    className="remove-skill"
                    onClick={() => {
                      const arr = [...formData.preferredRoles];
                      arr.splice(i, 1);
                      setFormData((prev) => ({ ...prev, preferredRoles: arr }));
                    }}
                  >
                    ×
                  </span>
                </span>
              ))}
              <input
                placeholder="Add role..."
                value={newPrefRole}
                onChange={(e) => setNewPrefRole(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newPrefRole.trim()) {
                    e.preventDefault();
                    setFormData((prev) => ({
                      ...prev,
                      preferredRoles: [
                        ...(prev.preferredRoles || []),
                        newPrefRole.trim(),
                      ],
                    }));
                    setNewPrefRole("");
                  }
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: "8px" }}>
            <label>Preferred Locations</label>
            <div className="skills-container">
              {(formData.preferredLocations || []).map((l, i) => (
                <span key={i} className="skill-chip">
                  {l}
                  <span
                    className="remove-skill"
                    onClick={() => {
                      const arr = [...formData.preferredLocations];
                      arr.splice(i, 1);
                      setFormData((prev) => ({
                        ...prev,
                        preferredLocations: arr,
                      }));
                    }}
                  >
                    ×
                  </span>
                </span>
              ))}
              <input
                placeholder="Add location..."
                value={newPrefLoc}
                onChange={(e) => setNewPrefLoc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newPrefLoc.trim()) {
                    e.preventDefault();
                    setFormData((prev) => ({
                      ...prev,
                      preferredLocations: [
                        ...(prev.preferredLocations || []),
                        newPrefLoc.trim(),
                      ],
                    }));
                    setNewPrefLoc("");
                  }
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: "8px" }}>
            <label>Profile Visibility</label>
            <select
              name="profileVisibility"
              value={formData.profileVisibility}
              onChange={handleChange}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {/* Picture */}
        <div className="form-group array-section">
          <h3>Profile Picture</h3>
          {formData.profilePicture && (
            <img
              src={formData.profilePicture}
              alt="preview"
              className="preview-pic"
            />
          )}
          <input type="file" accept="image/*" onChange={handlePictureUpload} />
        </div>

        <div className="form-group">
          <button type="submit" className="save-btn">
            Save Profile
          </button>
          <button type="button" onClick={cancelEditing} className="cancel-btn">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
