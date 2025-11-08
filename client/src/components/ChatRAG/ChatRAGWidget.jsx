import React, { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

const ChatRAGWidget = () => {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const fileRef = useRef();
  const [docBadge, setDocBadge] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [lastSources, setLastSources] = useState([]);
  const [lastType, setLastType] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("http://localhost:8080/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const u = await res.json();
          setIsAdmin(u.role === "admin");
        }
      } catch {}
    };
    load();
  }, []);

  const send = async (prefill) => {
    if (busy) return; // guard against double-submit
    const text = (prefill ?? input).trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/rag/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Chat failed");
      const answer = data.answer || "";
      setLastSources(Array.isArray(data.sources) ? data.sources : []);
      setLastType(data.type || "");
      // Mark if answer came from college docs (server returns topScore when RAG docs used)
      const usedDocs =
        typeof data.topScore === "number" && data.topScore >= 0.15;
      setDocBadge(!!usedDocs);
      // Show only the assistant's answer; do not render citations or source names
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: answer,
          type: data.type,
          resumeData: data.resumeData,
          event: data.event,
          escalated: data.escalated,
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Error: ${e.message}` },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadBusy(true);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await fetch("http://localhost:8080/api/rag/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Uploaded and embedded successfully. Chunks: ${data.chunks}`,
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Upload error: ${e.message}` },
      ]);
    } finally {
      setUploadBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const escalate = async () => {
    const lastUserMsg = messages.filter((m) => m.role === "user").pop();
    if (!lastUserMsg) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/rag/escalate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: lastUserMsg.content }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.message || "Escalation successful.",
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Failed to escalate. Please try again." },
      ]);
    }
  };

  const handleCalendarDownload = (event) => {
    if (!event) return;
    const { title, start, end } = event;
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${title || "Interview"}
DTSTART:${
      new Date(start)
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")[0]
    }Z
DTEND:${
      new Date(end)
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")[0]
    }Z
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "interview.ics";
    a.click();
  };

  const openResumeBuilder = (resumeData) => {
    if (!resumeData) return;
    localStorage.setItem("resumeDraft", JSON.stringify(resumeData));
    window.location.href = "/StudentDashboard/ResumeBuilder";
  };

  return (
    <div className={styles.wrapper}>
      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <div>College Assistant</div>
            <button
              type="button"
              aria-label="Close chat"
              title="Close"
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <div className={styles.body}>
            {messages.length === 0 ? (
              <div className={styles.placeholder}>
                Ask about placements, upcoming drives, placement statistics,
                company feedback, prep tips, policies, or resources.
              </div>
            ) : (
              messages.map((m, idx) => (
                <div key={idx}>
                  <div
                    className={
                      m.role === "user" ? styles.itemUser : styles.itemAssistant
                    }
                  >
                    {m.content}
                  </div>
                  {m.type === "next_interview" && m.event && (
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => handleCalendarDownload(m.event)}
                    >
                      📅 Add to Calendar
                    </button>
                  )}
                  {m.type === "resume_builder" && m.resumeData && (
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => openResumeBuilder(m.resumeData)}
                    >
                      📄 Open Resume Builder
                    </button>
                  )}
                  {m.escalated && (
                    <div className={styles.escalatedBadge}>
                      ⚠️ Escalated to placement officer
                    </div>
                  )}
                </div>
              ))
            )}
            {docBadge && (
              <div className={styles.docBadge}>
                Answered using uploaded college documents
              </div>
            )}
            {lastSources && lastSources.length > 0 && (
              <div className={styles.sourcesToggleRow}>
                <button
                  type="button"
                  className={styles.quickChip}
                  onClick={() => setShowSources((v) => !v)}
                >
                  {showSources ? "Hide Sources" : "Show Sources"}
                </button>
                {lastType && (
                  <span className={styles.hint}>Type: {lastType}</span>
                )}
              </div>
            )}
            {showSources && lastSources && lastSources.length > 0 && (
              <div className={styles.sourcesPanel}>
                {lastSources.map((s, i) => (
                  <div key={i} className={styles.sourceItem}>
                    <div className={styles.sourceTitle}>
                      {s.filename || "Document"}{" "}
                      {typeof s.score === "number"
                        ? `(score: ${s.score.toFixed(2)})`
                        : ""}
                    </div>
                    {s.preview && (
                      <div className={styles.sourcePreview}>{s.preview}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* Escalation UI removed as requested */}
          </div>
          <div className={styles.footer}>
            {isAdmin && (
              <div className={styles.uploadRow}>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  multiple
                  disabled={uploadBusy}
                  onChange={handleUpload}
                  ref={fileRef}
                />
                {uploadBusy && <span className={styles.hint}>Embedding…</span>}
              </div>
            )}
            {/* Quick intent chips removed as requested */}
            <div className={styles.inputRow}>
              <input
                className={styles.input}
                placeholder={
                  busy
                    ? "Waiting for response…"
                    : "Ask about placements, drives, stats, prep tips..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
                disabled={busy}
              />
              <button
                className={styles.sendBtn}
                onClick={() => send()}
                disabled={busy}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <button className={styles.fab} onClick={() => setOpen((v) => !v)}>
        {open ? "Close" : "Chat"}
      </button>
    </div>
  );
};

export default ChatRAGWidget;
