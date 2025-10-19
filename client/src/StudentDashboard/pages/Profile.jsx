import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Profile.css"; // Updated CSS references .form-group

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
    contactNumber: "",
    stream: "BE",
    branch: "",
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
    profilePicture: ""
  });

  // For handling array inputs (projects, certifications, etc.)
  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState({ name: "", url: "" });
  const [newProject, setNewProject] = useState({ name: "", techStack: "", description: "" });
  const [newCodeProfile, setNewCodeProfile] = useState({ platform: "", url: "" });

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
        const userRes = await axios.get("http://localhost:8080/api/users/me", config);
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
          setError(err.response?.data?.message || "Error fetching user/profile");
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
      contactNumber: profile.contactNumber || "",
      stream: profile.stream || "BE",
      branch: profile.branch || "",
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
      profilePicture: profile.profilePicture || ""
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
      const res = await axios.put("http://localhost:8080/api/student-profile", payload, config);

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
          No existing profile was found for <b>{user.email}</b>. Please fill out the form below:
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
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            />
            <input
              placeholder="Tech Stack"
              value={newProject.techStack}
              onChange={(e) => setNewProject({ ...newProject, techStack: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
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
              onChange={(e) => setNewCodeProfile({ ...newCodeProfile, url: e.target.value })}
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
            <input type="file" accept="image/*" onChange={handlePictureUpload} />
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
    // read-only display
    return (
      <div className="profile-page">
        <h1>My Profile</h1>
        {message && <p className="success-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}

        <div className="read-section">
          <div className="profile-picture">
            <img
              src={
                profile.profilePicture ||
                "https://www.w3schools.com/howto/img_avatar.png"
              }
              alt="Profile"
              className="preview-pic"
            />
          </div>

          <div className="profile-details">
            <p><strong>Email:</strong> {profile.collegeEmail}</p>
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>Contact:</strong> {profile.contactNumber}</p>
            <p><strong>Stream:</strong> {profile.stream}</p>
            <p><strong>Branch:</strong> {profile.branch}</p>
            <p><strong>10th %:</strong> {profile.tenthPercentage}</p>
            <p><strong>12th %:</strong> {profile.twelfthPercentage}</p>
            <p><strong>CGPA:</strong> {profile.cgpa}</p>
            <p><strong>Resume:</strong> {profile.resume}</p>
            <p><strong>LinkedIn:</strong> {profile.linkedin}</p>
            <p><strong>GitHub:</strong> {profile.github}</p>
            <p><strong>Skills:</strong> {profile.skills}</p>
          </div>
        </div>

        <div className="array-display">
          <h3>Projects</h3>
          <ul>
            {profile.projects.map((proj, idx) => (
              <li key={idx}>
                <b>{proj.name}</b> ({proj.techStack}): {proj.description}
              </li>
            ))}
          </ul>

          <h3>Certifications</h3>
          <ul>
            {profile.certifications.map((c, idx) => (
              <li key={idx}>
                {c.name} - {c.url}
              </li>
            ))}
          </ul>

          <h3>Coding Profiles</h3>
          <ul>
            {profile.codingProfiles.map((cp, idx) => (
              <li key={idx}>
                <b>{cp.platform}:</b> {cp.url}
              </li>
            ))}
          </ul>
        </div>

        <button onClick={startEditing} className="edit-btn">Edit Profile</button>
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
          <input name="resume" value={formData.resume} onChange={handleChange} />
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
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
          />
          <input
            placeholder="Tech Stack"
            value={newProject.techStack}
            onChange={(e) => setNewProject({ ...newProject, techStack: e.target.value })}
          />
          <textarea
            placeholder="Description"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
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
            onChange={(e) => setNewCodeProfile({ ...newCodeProfile, url: e.target.value })}
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
          <button type="submit" className="save-btn">Save Profile</button>
          <button type="button" onClick={cancelEditing} className="cancel-btn">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
