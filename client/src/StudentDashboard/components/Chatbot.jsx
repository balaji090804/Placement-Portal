import React, { useState, useRef, useEffect } from "react";
import "../styles/chatbot.css";

const canned = {
  help:
    "I can help with: placement opportunities, eligibility criteria, interview preparation, college policies, or your performance. Ask me anything!",
};

export default function Chatbot({ studentName, studentEmail }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: `Hello ${studentName || "there"}! I'm your placement assistant. I can help with upcoming drives, placement statistics, company feedback, prep tips, and more. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const push = (msg) => setMessages((m) => [...m, msg]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
    setLoading(true);

    const lower = q.toLowerCase();
    
    // Handle quick commands first
    if (lower.includes("help")) {
      setLoading(false);
      return push({ from: "bot", text: canned.help });
    }
    if (lower.includes("daily")) {
      setLoading(false);
      return fetchDaily();
    }
    if (lower.includes("drive") || lower.includes("upcoming")) {
      setLoading(false);
      return fetchUpcoming();
    }
    if (lower.includes("practice") || lower.includes("aptitude")) {
      setLoading(false);
      return showPractice();
    }
    if (lower.includes("performance") || lower.includes("score")) {
      setLoading(false);
      return fetchPerformance();
    }

    // Use RAG API for all other queries
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/rag/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: q }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to get response");
      }
      
      const data = await res.json();
      const answer = data.answer || "I couldn't generate a response. Please try rephrasing your question.";
      push({ from: "bot", text: answer });
    } catch (e) {
      push({
        from: "bot",
        text: `Sorry, I encountered an error: ${e.message}. Please try again or use 'help' for quick commands.`,
      });
    } finally {
      setLoading(false);
    }
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
                <div className="msg-content">{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="msg bot">
                <div className="msg-content typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about drives, placement stats, company feedback, prep tips..."
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
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
