import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../../app.css";

const STATUS = [
  "Draft",
  "Published",
  "ApplicationsOpen",
  "Shortlisting",
  "Interviews",
  "Offers",
  "Closed",
];

export default function AdminDrives() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    companyName: "",
    roleTitle: "",
    description: "",
    cgpaMin: "",
    backlogsAllowed: 0,
    branchesAllowed: "",
    skillsRequired: "",
    opensAt: "",
    closesAt: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:8080/api/drives", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDrives(res.data || []);
    } catch (e) {
      toast.error("Failed to load drives");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createDrive = async () => {
    const token = localStorage.getItem("token");
    try {
      const payload = {
        title: form.title,
        companyName: form.companyName,
        roleTitle: form.roleTitle,
        description: form.description,
        eligibilityRules: {
          cgpaMin: form.cgpaMin ? Number(form.cgpaMin) : undefined,
          backlogsAllowed: Number(form.backlogsAllowed || 0),
          branchesAllowed: form.branchesAllowed
            ? form.branchesAllowed
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          skillsRequired: form.skillsRequired
            ? form.skillsRequired
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        },
        applicationWindow: {
          opensAt: form.opensAt || undefined,
          closesAt: form.closesAt || undefined,
        },
      };
      const res = await axios.post(
        "http://localhost:8080/api/drives",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Drive created");
      setForm({
        title: "",
        companyName: "",
        roleTitle: "",
        description: "",
        cgpaMin: "",
        backlogsAllowed: 0,
        branchesAllowed: "",
        skillsRequired: "",
        opensAt: "",
        closesAt: "",
      });
      setDrives([res.data, ...drives]);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to create drive");
    }
  };

  const transition = async (id, to) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `http://localhost:8080/api/drives/${id}/transition`,
        { to },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDrives((prev) => prev.map((d) => (d._id === id ? res.data : d)));
      toast.success(`Moved to ${to}`);
    } catch (e) {
      toast.error("Transition failed");
    }
  };

  return (
    <div style={{ marginLeft: 220, padding: 24 }}>
      <h2 className="section-title" style={{ marginBottom: 12 }}>
        Placement Drives
      </h2>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 8 }}>
          Create Drive
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
          }}
        >
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            placeholder="Company"
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
            placeholder="Backlogs Allowed"
            type="number"
            value={form.backlogsAllowed}
            onChange={(e) =>
              setForm({ ...form, backlogsAllowed: e.target.value })
            }
          />
          <input
            placeholder="Branches (comma)"
            value={form.branchesAllowed}
            onChange={(e) =>
              setForm({ ...form, branchesAllowed: e.target.value })
            }
          />
          <input
            placeholder="Skills (comma)"
            value={form.skillsRequired}
            onChange={(e) =>
              setForm({ ...form, skillsRequired: e.target.value })
            }
          />
          <input
            placeholder="Applications Open"
            type="datetime-local"
            value={form.opensAt}
            onChange={(e) => setForm({ ...form, opensAt: e.target.value })}
          />
          <input
            placeholder="Applications Close"
            type="datetime-local"
            value={form.closesAt}
            onChange={(e) => setForm({ ...form, closesAt: e.target.value })}
          />
        </div>
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ marginTop: 12, minHeight: 80 }}
        />
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={createDrive}>
            Create
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 8 }}>
          All Drives
        </h3>
        {loading ? (
          <p>Loading...</p>
        ) : drives.length === 0 ? (
          <p className="empty-message">No drives yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {drives.map((d) => (
              <div
                key={d._id}
                className="card"
                style={{ padding: 12, border: "1px solid var(--border-color)" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {d.title} • {d.companyName}
                    </div>
                    <div style={{ color: "var(--muted-color)", fontSize: 13 }}>
                      {d.roleTitle}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12 }}>
                      Status: <b>{d.status}</b>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {STATUS.map((s) => (
                      <button
                        key={s}
                        className="btn btn-outline"
                        onClick={() => transition(d._id, s)}
                        disabled={d.status === s}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
