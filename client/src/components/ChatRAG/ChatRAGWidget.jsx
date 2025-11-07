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
      // Mark if answer came from college docs (server returns topScore when RAG docs used)
      const usedDocs = typeof data.topScore === "number" && data.topScore >= 0.15;
      setDocBadge(!!usedDocs);
      // Show only the assistant's answer; do not render citations or source names
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: answer,
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
                Ask about placements, upcoming drives, placement statistics, company feedback, prep tips, policies, or resources.
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={
                    m.role === "user" ? styles.itemUser : styles.itemAssistant
                  }
                >
                  {m.content}
                </div>
              ))
            )}
            {docBadge && (
              <div className={styles.docBadge}>
                Answered using uploaded college documents
              </div>
            )}
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
            {/* Quick intents */}
            <div className={styles.quickRow}>
              <button
                type="button"
                className={styles.quickChip}
                onClick={() => send("What are the upcoming drives?")}
                disabled={busy}
              >
                Upcoming Drives
              </button>
              <button
                type="button"
                className={styles.quickChip}
                onClick={() => send("What is the placement percentage?")}
                disabled={busy}
              >
                Placement %
              </button>
              <button
                type="button"
                className={styles.quickChip}
                onClick={() => send("Show company feedback and prep tips for Amazon")}
                disabled={busy}
              >
                Company Tips
              </button>
              <button
                type="button"
                className={styles.quickChip}
                onClick={() => send("College policy: internship attendance and eligibility")}
                disabled={busy}
              >
                Policy
              </button>
            </div>
            <div className={styles.inputRow}>
              <input
                className={styles.input}
                placeholder={busy ? "Waiting for response…" : "Ask about placements, drives, stats, prep tips..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
                disabled={busy}
              />
              <button className={styles.sendBtn} onClick={() => send()} disabled={busy}>
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
