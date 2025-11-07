import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../../app.css";

export default function AdminNotifications() {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);

  const token = () => localStorage.getItem("token");

  const load = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/users/students", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setStudents(res.data || []);
    } catch (e) {
      toast.error("Failed to load students");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (email) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      if (prev.size === students.length) return new Set();
      return new Set(students.map((s) => s.email));
    });
  };

  const send = async () => {
    if (!title.trim()) return toast.warn("Title is required");
    if (selected.size === 0) return toast.warn("Select at least one recipient");
    setSending(true);
    try {
      const emails = Array.from(selected);
      // Send in small batches to avoid overloading
      const BATCH = 25;
      for (let i = 0; i < emails.length; i += BATCH) {
        const slice = emails.slice(i, i + BATCH);
        await Promise.all(
          slice.map((toEmail) =>
            axios.post(
              "http://localhost:8080/api/notifications",
              { toEmail, title, message, link: link || undefined },
              { headers: { Authorization: `Bearer ${token()}` } }
            )
          )
        );
      }
      toast.success(`Sent to ${emails.length} recipient(s)`);
      setSelected(new Set());
      setTitle("");
      setMessage("");
      setLink("");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to send notifications");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ marginLeft: 220, padding: 24 }}>
      <h2 className="section-title" style={{ marginBottom: 12 }}>
        Communication Center
      </h2>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 8 }}>
          Compose Message
        </h3>
        <div style={{ display: "grid", gap: 10 }}>
          <input
            placeholder="Title (required)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ minHeight: 80 }}
          />
          <input
            placeholder="Optional link (e.g., /StudentDashboard/Offers)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <h3 className="section-title" style={{ margin: 0 }}>
            Recipients ({selected.size}/{students.length})
          </h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline" onClick={toggleAll}>
              {selected.size === students.length ? "Clear" : "Select All"}
            </button>
            <button
              className="btn btn-primary"
              onClick={send}
              disabled={sending || selected.size === 0 || !title.trim()}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0,1fr))",
            gap: 8,
          }}
        >
          {students.map((s) => {
            const email = s.email;
            const name = [s.firstName, s.lastName].filter(Boolean).join(" ");
            const checked = selected.has(email);
            return (
              <label
                key={email}
                className="card"
                style={{
                  padding: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border:
                    checked ? "2px solid var(--brand-color)" : "1px solid var(--border-color)",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(email)}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>{name || email}</div>
                  <div style={{ fontSize: 12, color: "var(--muted-color)" }}>
                    {email}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}


