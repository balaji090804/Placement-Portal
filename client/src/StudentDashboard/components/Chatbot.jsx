import React, { useState, useRef } from "react";
import "../styles/chatbot.css";

const canned = {
  help:
    "I can help you find: daily challenge, upcoming drives, practice links, or your performance.",
};

export default function Chatbot({ studentName, studentEmail }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: `Hi ${studentName ||
        "there"}. How can I help? Type 'help' to see options.`,
    },
  ]);
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  const push = (msg) => setMessages((m) => [...m, msg]);

  const fetchDaily = async () => {
    try {
      const r = await fetch("http://localhost:8080/api/daily/leetcode");
      if (!r.ok) throw new Error("daily fetch failed");
      const d = await r.json();
      push({
        from: "bot",
        text: `Today's challenge: ${d.title} (${d.difficulty}). Open: ${d.link}`,
      });
    } catch (e) {
      push({
        from: "bot",
        text: "Sorry, couldn't load the daily challenge right now.",
      });
    }
  };

  const fetchUpcoming = async () => {
    try {
      const r = await fetch("http://localhost:8080/api/announcements/upcoming");
      if (!r.ok) throw new Error("upcoming fetch failed");
      const arr = await r.json();
      if (!arr.length)
        return push({ from: "bot", text: "No upcoming drives found." });
      const lines = arr
        .slice(0, 5)
        .map(
          (a) =>
            `${a.companyName} - ${a.jobRole} @ ${new Date(
              a.dateTime
            ).toLocaleString()}`
        );
      push({ from: "bot", text: `Upcoming drives:\n- ${lines.join("\n- ")}` });
    } catch (e) {
      push({ from: "bot", text: "Sorry, couldn't load upcoming drives." });
    }
  };

  const fetchPerformance = async () => {
    try {
      const r = await fetch(
        `http://localhost:8080/api/performance/${encodeURIComponent(
          studentEmail || ""
        )}`
      );
      if (!r.ok) throw new Error("perf fetch failed");
      const p = await r.json();
      const s = p.mockTestScores || {};
      push({
        from: "bot",
        text: `Your scores — Aptitude: ${s.aptitude ??
          "-"}, Coding: ${s.coding ?? "-"}, Communication: ${s.communication ??
          "-"}, Technical: ${s.technical ??
          "-"}. Interview Score: ${p.interviewScores ?? "-"}.`,
      });
    } catch (e) {
      push({
        from: "bot",
        text: "Sorry, couldn't load your performance right now.",
      });
    }
  };

  const showPractice = () => {
    push({
      from: "bot",
      text:
        "Practice links: Practice Hub (/StudentDashboard/Practice), Faculty Aptitude (/StudentDashboard/Aptitude), Daily Coding (/StudentDashboard/DailyCoding).",
    });
  };

  const onSend = async () => {
    const q = input.trim();
    if (!q) return;
    push({ from: "me", text: q });
    setInput("");

    const lower = q.toLowerCase();
    if (lower.includes("help")) return push({ from: "bot", text: canned.help });
    if (lower.includes("daily")) return fetchDaily();
    if (lower.includes("drive")) return fetchUpcoming();
    if (lower.includes("practice") || lower.includes("aptitude"))
      return showPractice();
    if (lower.includes("performance") || lower.includes("score"))
      return fetchPerformance();

    push({
      from: "bot",
      text:
        "I didn't catch that. Try: daily, drives, practice, performance, or 'help'.",
    });
  };

  return (
    <div className={`chatbot ${open ? "open" : ""}`}>
      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <span>Assistant</span>
            <button className="close" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
          <div className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.from === "me" ? "me" : "bot"}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about daily, drives, practice, performance..."
              onKeyDown={(e) => e.key === "Enter" && onSend()}
            />
            <button onClick={onSend}>Send</button>
          </div>
        </div>
      )}
      <button
        className="fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open assistant"
      >
        {open ? "Close" : "Chat"}
      </button>
    </div>
  );
}
