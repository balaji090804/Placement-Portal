import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../../app.css";

export default function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  const statusTokens = {
    Draft: { label: "Draft", bg: "#f3f4f6", color: "#1f2937" },
    Released: {
      label: "Released",
      bg: "rgba(37, 99, 235, 0.12)",
      color: "#2563eb",
    },
    Accepted: {
      label: "Accepted",
      bg: "rgba(16, 185, 129, 0.16)",
      color: "#047857",
    },
    Declined: {
      label: "Declined",
      bg: "rgba(239, 68, 68, 0.16)",
      color: "#b91c1c",
    },
  };

  const [form, setForm] = useState({
    studentEmail: "",
    studentName: "",
    companyName: "",
    roleTitle: "",
    ctc: "",
    status: "Draft",
    acceptBy: "",
  });

  const token = () => localStorage.getItem("token");

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8080/api/offers", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setOffers(res.data || []);
    } catch (e) {
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    const base = { Draft: 0, Released: 0, Accepted: 0, Declined: 0 };
    offers.forEach((o) => {
      base[o.status] = (base[o.status] || 0) + 1;
    });
    return base;
  }, [offers]);

  const formatDate = (value, withTime = false) => {
    if (!value) return "—";
    const date = new Date(value);
    return withTime
      ? date.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : date.toLocaleDateString(undefined, { dateStyle: "medium" });
  };

  const create = async () => {
    try {
      const payload = { ...form, acceptBy: form.acceptBy || undefined };
      const res = await axios.post(
        "http://localhost:8080/api/offers",
        payload,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      toast.success("Offer created");
      setOffers([res.data, ...offers]);
      setForm({
        studentEmail: "",
        studentName: "",
        companyName: "",
        roleTitle: "",
        ctc: "",
        status: "Draft",
        acceptBy: "",
      });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Create failed");
    }
  };

  const update = async (id, patch) => {
    try {
      const res = await axios.put(
        `http://localhost:8080/api/offers/${id}`,
        patch,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      setOffers((prev) => prev.map((o) => (o._id === id ? res.data : o)));
      toast.success("Offer updated");
    } catch (e) {
      toast.error("Update failed");
    }
  };

  return (
    <div style={{ marginLeft: 220, padding: 24 }}>
      <h2 className="section-title" style={{ marginBottom: 12 }}>
        Offers
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {Object.entries(summary).map(([key, count]) => {
          const tokenData = statusTokens[key];
          return (
            <div key={key} className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: "var(--muted-color)" }}>
                {tokenData?.label || key}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{count}</div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 8 }}>
          Create / Release Offer
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr",
            gap: 12,
          }}
        >
          <input
            placeholder="Student Email"
            value={form.studentEmail}
            onChange={(e) => setForm({ ...form, studentEmail: e.target.value })}
          />
          <input
            placeholder="Student Name"
            value={form.studentName}
            onChange={(e) => setForm({ ...form, studentName: e.target.value })}
          />
          <input
            placeholder="Company"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
          <input
            placeholder="Role"
            value={form.roleTitle}
            onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
          />
          <input
            placeholder="CTC"
            value={form.ctc}
            onChange={(e) => setForm({ ...form, ctc: e.target.value })}
          />
          <input
            type="date"
            placeholder="Accept By"
            value={form.acceptBy}
            onChange={(e) => setForm({ ...form, acceptBy: e.target.value })}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={create}>
            Create
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 8 }}>
          All Offers
        </h3>
        {loading ? (
          <p className="empty-message">Loading offers…</p>
        ) : offers.length === 0 ? (
          <p className="empty-message">No offers yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {offers.map((o) => (
              <div key={o._id} className="card" style={{ padding: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {o.studentName || o.studentEmail} • {o.companyName} — {" "}
                      {o.roleTitle}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted-color)", display: "flex", flexDirection: "column", gap: 4 }}>
                      <span>
                        Status: <b>{o.status}</b> {o.ctc ? `• ${o.ctc}` : ""}
                      </span>
                      <span>Student Email: {o.studentEmail}</span>
                      <span>Created By: {o.createdBy || "—"}</span>
                      <span>
                        Accept By: {formatDate(o.acceptBy)} • Released on {formatDate(o.releaseDate, true)}
                      </span>
                      <span>Created on: {formatDate(o.createdAt, true)}</span>
                      {o.status === "Accepted" && (
                        <span style={{ color: "#047857", fontWeight: 600 }}>
                          Accepted on {formatDate(o.acceptedAt, true)}
                        </span>
                      )}
                      {o.status === "Declined" && (
                        <span style={{ color: "#b91c1c", fontWeight: 600 }}>
                          Declined on {formatDate(o.declinedAt, true)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        background:
                          statusTokens[o.status]?.bg || statusTokens.Draft.bg,
                        color:
                          statusTokens[o.status]?.color ||
                          statusTokens.Draft.color,
                        padding: "6px 12px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {statusTokens[o.status]?.label || o.status}
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-outline"
                        onClick={() =>
                          update(o._id, {
                            status: "Released",
                            releaseDate: new Date(),
                          })
                        }
                        disabled={
                          o.status === "Released" ||
                          o.status === "Accepted" ||
                          o.status === "Declined"
                        }
                      >
                        Release
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => update(o._id, { status: "Draft" })}
                        disabled={o.status === "Draft"}
                      >
                        Draft
                      </button>
                    </div>
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
