import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../app.css";

export default function MyDrives() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    title: "",
    companyName: "",
    roleTitle: "",
    description: "",
    cgpaMin: "",
    branchesAllowed: "",
    skillsRequired: "",
  });

  const token = () => localStorage.getItem("token");

  const load = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/recruiter/drives", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setItems(res.data || []);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    try {
      const payload = {
        title: form.title,
        companyName: form.companyName,
        roleTitle: form.roleTitle,
        description: form.description,
        eligibilityRules: {
          cgpaMin: form.cgpaMin ? Number(form.cgpaMin) : undefined,
          branchesAllowed: form.branchesAllowed
            ? form.branchesAllowed.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          skillsRequired: form.skillsRequired
            ? form.skillsRequired.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
        },
      };
      const res = await axios.post(
        "http://localhost:8080/api/recruiter/drives",
        payload,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      setItems([res.data, ...items]);
      setForm({
        title: "",
        companyName: "",
        roleTitle: "",
        description: "",
        cgpaMin: "",
        branchesAllowed: "",
        skillsRequired: "",
      });
    } catch {}
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 className="section-title" style={{ marginBottom: 12 }}>
        My Draft Drives
      </h2>
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 8 }}>
          Create Draft
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            placeholder="Company Name"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
          <input
            placeholder="Role Title"
            value={form.roleTitle}
            onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
          />
          <input
            placeholder="CGPA Min"
            type="number"
            value={form.cgpaMin}
            onChange={(e) => setForm({ ...form, cgpaMin: e.target.value })}
          />
          <input
            placeholder="Branches (comma separated)"
            value={form.branchesAllowed}
            onChange={(e) => setForm({ ...form, branchesAllowed: e.target.value })}
          />
          <input
            placeholder="Skills (comma separated)"
            value={form.skillsRequired}
            onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
          />
        </div>
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ marginTop: 12, minHeight: 80 }}
        />
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={create}>
            Save Draft
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 8 }}>
          Drafts I Created
        </h3>
        {items.length === 0 ? (
          <p className="empty-message">No drafts yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((d) => (
              <div key={d._id} className="card" style={{ padding: 12 }}>
                <div style={{ fontWeight: 600 }}>
                  {d.title} • {d.companyName} — {d.roleTitle}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted-color)" }}>
                  Status: <b>{d.status}</b> (Admin will review and publish)
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: "var(--muted-color)" }}>
                    Eligibility preview
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
                    {d.eligibilityRules?.cgpaMin && (
                      <li>CGPA ≥ {d.eligibilityRules.cgpaMin}</li>
                    )}
                    {!!(d.eligibilityRules?.branchesAllowed || []).length && (
                      <li>
                        Branches: {d.eligibilityRules.branchesAllowed.join(", ")}
                      </li>
                    )}
                    {!!(d.eligibilityRules?.skillsRequired || []).length && (
                      <li>
                        Skills: {d.eligibilityRules.skillsRequired.join(", ")}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


