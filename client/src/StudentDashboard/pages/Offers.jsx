import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../../app.css";

const statusTokens = {
  Draft: { bg: "#f3f4f6", color: "#1f2937", label: "Draft" },
  Released: {
    bg: "rgba(37, 99, 235, 0.12)",
    color: "#2563eb",
    label: "Awaiting Action",
  },
  Accepted: {
    bg: "rgba(16, 185, 129, 0.16)",
    color: "#047857",
    label: "Accepted",
  },
  Declined: {
    bg: "rgba(239, 68, 68, 0.16)",
    color: "#b91c1c",
    label: "Declined",
  },
};

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

const daysRemaining = (deadline) => {
  if (!deadline) return null;
  const now = new Date();
  const end = new Date(deadline);
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff;
};

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const act = async (id, action) => {
    try {
      const res = await axios.post(
        `http://localhost:8080/api/offers/${id}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      setOffers((prev) => prev.map((o) => (o._id === id ? res.data : o)));
      toast.success(`Offer ${action}ed`);
    } catch (e) {
      toast.error("Action failed");
    }
  };

  return (
    <div style={{ marginLeft: 220, padding: 24 }}>
      <h2 className="section-title" style={{ marginBottom: 12 }}>
        Your Offers
      </h2>
      <div className="card" style={{ padding: 16 }}>
        {loading ? (
          <p className="empty-message">Loading offers…</p>
        ) : offers.length === 0 ? (
          <p className="empty-message">No offers yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {offers.map((o) => {
              const tokenData = statusTokens[o.status] || statusTokens.Draft;
              const remaining = daysRemaining(o.acceptBy);
              const showDeadlineInfo =
                o.status === "Released" && remaining !== null;
              return (
                <div
                  key={o._id}
                  className="card"
                  style={{ padding: 16, borderRadius: 12 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>
                        {o.companyName || "Company"} — {o.roleTitle || "Role"}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--muted-color)" }}>
                        {o.ctc ? `₹${o.ctc}` : "CTC not specified"}
                        {o.studentName ? ` • ${o.studentName}` : ""}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--muted-color)" }}>
                        Accept by: <b>{formatDate(o.acceptBy)}</b>
                        {showDeadlineInfo && remaining > 0
                          ? ` • ${remaining} day${remaining === 1 ? "" : "s"} left`
                          : showDeadlineInfo && remaining <= 0
                          ? " • Deadline passed"
                          : ""}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--muted-color)" }}>
                        Released on: {formatDate(o.releaseDate, true)}
                      </div>
                      {o.status === "Accepted" && (
                        <div style={{ fontSize: 13, color: "#047857", fontWeight: 600 }}>
                          Accepted on {formatDate(o.acceptedAt, true)}. Please
                          prepare for onboarding instructions from the placement
                          cell.
                        </div>
                      )}
                      {o.status === "Declined" && (
                        <div style={{ fontSize: 13, color: "#b91c1c", fontWeight: 600 }}>
                          Declined on {formatDate(o.declinedAt, true)}. Reach out
                          to the placement office if this was unintentional.
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        background: tokenData.bg,
                        color: tokenData.color,
                        padding: "6px 12px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tokenData.label}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 8,
                      marginTop: 14,
                    }}
                  >
                    <button
                      className="btn btn-outline"
                      disabled={o.status !== "Released"}
                      onClick={() => act(o._id, "accept")}
                    >
                      Accept Offer
                    </button>
                    <button
                      className="btn btn-outline"
                      disabled={o.status !== "Released"}
                      onClick={() => act(o._id, "decline")}
                    >
                      Decline Offer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
