const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const RagChunk = require("../models/RagChunk");
const { User } = require("../models/user");
const StudentProfile = require("../models/studentProfile");
const PlacementAnnouncement = require("../models/PlacementAnnouncement");
const Recruiter = require("../models/recruiters");
const CompanyRole = require("../models/companyRole");
const Assignment = require("../models/assignment");
const FacultyAnnouncement = require("../models/FacultyAnnouncement");
const auth = require("../middleware/authMiddleware");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Safety limits to prevent OOM
const MAX_CHARS = parseInt(process.env.RAG_MAX_CHARS || "1000000", 10); // 1M chars per file
const MAX_CHUNKS_PER_FILE = parseInt(
  process.env.RAG_MAX_CHUNKS_PER_FILE || "2000",
  10
);
const RETRIEVAL_LIMIT = parseInt(process.env.RAG_RETRIEVAL_LIMIT || "5000", 10);

// Helpers
function chunkText(text, chunkSize = 1000, overlap = 200, maxChunks = 10000) {
  if (!text || typeof text !== "string") return [];
  // Guardrail parameters
  chunkSize = Math.max(1, Number(chunkSize) || 1000);
  overlap = Math.max(0, Math.min(Number(overlap) || 0, chunkSize - 1));
  maxChunks = Math.max(1, Number(maxChunks) || 10000);

  const chunks = [];
  let start = 0;
  const N = text.length;

  while (start < N && chunks.length < maxChunks) {
    const end = Math.min(start + chunkSize, N);
    const slice = text.slice(start, end).trim();
    if (slice.length > 0) chunks.push(slice);

    if (end >= N) break; // finished
    // Advance with overlap (ensured < chunkSize above)
    start = end - overlap;
  }

  return chunks;
}

function cosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return -1;
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

// Lazy-load a local embedder using transformers.js (no external key needed)
let embedderPromise = null;
async function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = (async () => {
      const mod = await import("@xenova/transformers");
      const pipe = await mod.pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );
      return pipe;
    })();
  }
  return embedderPromise;
}

// Gemini client
let resolvedGeminiModelName = null;
async function resolveGeminiModelName() {
  if (process.env.GEMINI_MODEL) return process.env.GEMINI_MODEL;
  if (resolvedGeminiModelName) return resolvedGeminiModelName;

  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set in environment");

  // Try v1 first, then v1beta as fallback
  const endpoints = [
    "https://generativelanguage.googleapis.com/v1/models",
    "https://generativelanguage.googleapis.com/v1beta/models",
  ];

  let models = [];
  for (const base of endpoints) {
    try {
      const r = await fetch(`${base}?key=${encodeURIComponent(key)}`);
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data.models)) {
          models = data.models;
          break;
        }
      }
    } catch (_) {
      // ignore and try next endpoint
    }
  }

  // Filter models that support generateContent
  const gc = models.filter(
    (m) =>
      Array.isArray(m.supportedGenerationMethods) &&
      m.supportedGenerationMethods.includes("generateContent")
  );

  // Preferred order of generally-available/free-friendly models
  const preferred = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b-latest",
    "gemini-1.5-pro-latest",
    "gemini-1.0-pro-latest",
    "gemini-pro",
  ];

  const names = new Set(gc.map((m) => m.name || m.model || m.id));
  for (const p of preferred) {
    if (names.has(p)) {
      resolvedGeminiModelName = p;
      return p;
    }
  }

  // Fallback to first available generateContent model
  if (gc.length) {
    const fallback = gc[0].name || gc[0].model || gc[0].id;
    resolvedGeminiModelName = fallback;
    return fallback;
  }

  // Ultimate fallback – a commonly available alias
  resolvedGeminiModelName = "gemini-1.5-flash-latest";
  return resolvedGeminiModelName;
}

async function getGeminiModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set in environment");
  const genAI = new GoogleGenerativeAI(key);
  const modelName = await resolveGeminiModelName();
  return genAI.getGenerativeModel({ model: modelName });
}

// Admin-only upload endpoint
router.post("/upload", auth, upload.array("files", 10), async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: admin only" });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    let totalChunks = 0;

    for (const file of req.files) {
      const { originalname, mimetype, size, buffer } = file;

      let text = "";
      if (
        mimetype === "application/pdf" ||
        originalname.toLowerCase().endsWith(".pdf")
      ) {
        const pdfData = await pdfParse(buffer);
        text = pdfData.text || "";
      } else if (
        mimetype.startsWith("text/") ||
        originalname.toLowerCase().endsWith(".txt")
      ) {
        text = buffer.toString("utf8");
      } else {
        // skip unsupported types for now
        continue;
      }

      text = text.replace(/\s+/g, " ").trim();
      if (text.length > MAX_CHARS) {
        text = text.slice(0, MAX_CHARS);
      }
      let chunks = chunkText(text, 1000, 200);
      if (chunks.length > MAX_CHUNKS_PER_FILE) {
        chunks = chunks.slice(0, MAX_CHUNKS_PER_FILE);
      }

      const embedder = await getEmbedder();
      for (let idx = 0; idx < chunks.length; idx++) {
        const chunk = chunks[idx];
        const output = await embedder(chunk, {
          pooling: "mean",
          normalize: true,
        });
        const vector = Array.from(output.data);

        await RagChunk.create({
          content: chunk,
          embedding: vector,
          metadata: {
            filename: originalname,
            mimeType: mimetype,
            size,
            chunkIndex: idx,
            uploadedByEmail: req.user?.email,
            uploadedByRole: req.user?.role,
            visibility: "all",
          },
        });
        totalChunks++;
      }
    }

    res.json({ message: "Files embedded successfully", chunks: totalChunks });
  } catch (err) {
    console.error("/api/rag/upload error", err);
    res.status(500).json({ message: err.message || "Upload failed" });
  }
});

// Chat endpoint (all authenticated roles)
router.post("/chat", auth, async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "message is required" });
    }

    // Fetch current user context (email, role)
    const role = req.user?.role;
    const userDoc = req.user?._id
      ? await User.findById(req.user._id).select(
          "email firstName lastName role"
        )
      : null;
    const email = (userDoc?.email || "").toLowerCase();

    const msg = message.toLowerCase();

    // 1) Role-aware dynamic shortcuts
    // Student: "eligible jobs", "what can I apply", etc.
    const studentIntent =
      role === "student" &&
      (/(what|which).*job.*eligible/.test(msg) ||
        /eligible.*apply/.test(msg) ||
        /can i apply/.test(msg) ||
        /jobs.*for me/.test(msg));

    // Faculty: "my tasks", "what's assigned to me", "pending announcements"
    const facultyIntent =
      role === "faculty" &&
      (/(my|what).*(task|assignment|students).*(assigned|pending)/.test(msg) ||
        /pending announcements/.test(msg) ||
        /what.*assigned.*me/.test(msg));

    if (studentIntent && email) {
      // Build student-specific recommendation from upcoming announcements and their profile
      const now = new Date();
      const upcoming = await PlacementAnnouncement.find({
        dateTime: { $gte: now },
      })
        .sort({ dateTime: 1 })
        .lean();

      const profile = await StudentProfile.findOne({
        collegeEmail: email,
      }).lean();
      const skillsText = (profile?.skills || "").toLowerCase();
      const branch = (profile?.branch || "").toLowerCase();
      const stream = (profile?.stream || "").toLowerCase();
      const cgpa = profile?.cgpa;

      // Join with Recruiter docs to get eligibility/skills for the role
      const enriched = [];
      for (const ann of upcoming) {
        const rec = await Recruiter.findOne({
          companyName: ann.companyName,
          jobTitle: ann.jobRole,
        })
          .sort({ postedAt: -1 })
          .lean();

        const eligibility = (rec?.eligibilityCriteria || "").toLowerCase();
        const requiredSkills = Array.isArray(rec?.requiredSkills)
          ? rec.requiredSkills.map((s) => String(s).toLowerCase())
          : [];

        // Simple heuristic filters (never leak others' data):
        // - If eligibility mentions a branch/stream and student's doesn't match, deprioritize
        // - If cgpa is present and eligibility contains a cut-off like 'cgpa 8', do a naive check
        // - If required skills overlap with student's skills, prioritize
        let score = 0;
        if (requiredSkills.length && skillsText) {
          for (const rs of requiredSkills)
            if (skillsText.includes(rs)) score += 2;
        }
        if (branch && eligibility && eligibility.includes(branch)) score += 1;
        if (stream && eligibility && eligibility.includes(stream)) score += 1;
        if (cgpa && /cgpa\s*(\d+(?:\.\d+)?)/i.test(eligibility)) {
          const m = eligibility.match(/cgpa\s*(\d+(?:\.\d+)?)/i);
          const reqCg = m ? parseFloat(m[1]) : null;
          if (reqCg && cgpa >= reqCg) score += 1;
          else if (reqCg && cgpa < reqCg) score -= 1;
        }

        enriched.push({ ann, rec, score });
      }

      enriched.sort((a, b) => b.score - a.score);
      const top = enriched.slice(0, 6);

      if (top.length === 0) {
        const answer =
          "I couldn't find upcoming placement announcements right now. Check again later or ask the admin to publish the announcement.";
        return res.json({ answer, citations: [], topScore: null });
      }

      const lines = top.map(({ ann, rec }) => {
        const dateStr = new Date(ann.dateTime).toLocaleString();
        const skills = Array.isArray(rec?.requiredSkills)
          ? rec.requiredSkills.join(", ")
          : "—";
        const elig = rec?.eligibilityCriteria || "—";
        return `• ${ann.companyName} – ${ann.jobRole} (Drive: ${dateStr})\n  Skills: ${skills}\n  Eligibility: ${elig}`;
      });

      const header = profile
        ? `Based on your profile (branch: ${branch || "—"}, cgpa: ${
            cgpa ?? "—"
          }), here are upcoming opportunities you can apply to:`
        : `Here are upcoming placement announcements you can apply to:`;

      const answer = `${header}\n\n${lines.join(
        "\n\n"
      )}\n\nTip: Keep your Student Profile updated to get better matches.`;
      return res.json({ answer, citations: [], topScore: null });
    }

    if (facultyIntent && email) {
      // Faculty-specific snapshot: pending announcements and assigned students
      const pendingAnnouncements = await FacultyAnnouncement.find({
        assignedFacultyEmail: email,
        isCompleted: { $ne: true },
      })
        .sort({ dateTime: 1 })
        .lean();

      const assigned = await Assignment.find({ facultyEmail: email })
        .sort({ assignedAt: -1 })
        .lean();

      const annLines = pendingAnnouncements.map(
        (a) =>
          `• ${a.companyName} – ${a.jobRole} on ${new Date(
            a.dateTime
          ).toLocaleString()}`
      );
      const stuLines = assigned.map((s) => `• ${s.studentEmail}`);

      let answer = "";
      if (annLines.length === 0 && stuLines.length === 0) {
        answer =
          "You currently have no pending placement announcements or assigned students.";
      } else {
        if (annLines.length) {
          answer += `Pending announcements assigned to you:\n${annLines.join(
            "\n"
          )}\n\n`;
        }
        if (stuLines.length) {
          answer += `Students assigned to you (${
            assigned.length
          }):\n${stuLines.join("\n")}`;
        }
      }
      return res.json({ answer, citations: [], topScore: null });
    }

    const gemini = await getGeminiModel();

    // Embed query
    const embedder = await getEmbedder();
    const qOut = await embedder(message, { pooling: "mean", normalize: true });
    const qVec = Array.from(qOut.data);

    // Retrieve candidates (naive; optimize with filtering/pagination if large)
    const candidates = await RagChunk.find({ "metadata.visibility": "all" })
      .sort({ createdAt: -1 })
      .limit(RETRIEVAL_LIMIT)
      .select({ content: 1, embedding: 1, metadata: 1 })
      .lean();

    // Score with cosine similarity
    const scored = candidates
      .map((c) => ({
        score: cosineSim(qVec, c.embedding),
        content: c.content,
        metadata: c.metadata,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const context = scored
      .map((s, i) => `# Source ${i + 1}:\n${s.content}`)
      .join("\n\n");

    // If nothing relevant is found, switch to a helpful fallback mode
    const MIN_SIM = parseFloat(process.env.RAG_MIN_SIM || "0.25");
    const topScore = scored.length ? scored[0].score : -1;

    let system;
    let prompt;
    if (topScore < MIN_SIM) {
      // Fallback: provide general, structured guidance (no strict RAG constraint)
      system = `You are a placement preparation mentor. When sources are missing or irrelevant, still provide clear, actionable guidance.
Keep answers skimmable and organized with short sections and bullet points.
If the user's question suggests a company-specific prep (e.g., Amazon, Google, etc.), include:
- Core DSA topics and difficulty ranges
- Systems topics (for experienced) or basic design fundamentals (for freshers)
- Behavioral/values rounds (e.g., leadership principles)
- Suggested 4–6 week roadmap with weekly goals and checkpoints
- Mock interview cadence and evaluation criteria
Do not invent private data or links to internal files. Avoid sharing secrets.`;
      prompt = `${system}\n\nUser: ${message}\n\n(There were no relevant internal sources. Provide a best-effort, general plan.)`;
    } else {
      system = `You are a helpful assistant for a college placement portal.
Use the provided sources to answer. If something isn't in the sources, you may add general high-level guidance, but prefer the sources.
Keep answers concise. Do NOT include citations, source IDs, file names, links, or implementation details.`;
      prompt = `${system}\n\nUser: ${message}\n\nRelevant sources (use for answering, but do not include citations in your reply):\n${context}`;
    }

    const result = await gemini.generateContent(prompt);
    let answer =
      result && result.response && typeof result.response.text === "function"
        ? result.response.text()
        : "";
    // Strip any citation-like artifacts just in case the model adds them
    answer = answer
      .replace(/\s*\[S\d+(?:[^\]]*)\]/g, "")
      .replace(/\s*\(S\d+\)/g, "")
      .replace(/\s*Sources?:[\s\S]*$/i, "")
      .trim();

    const citations = scored.map((s, i) => ({
      index: i + 1,
      filename: s.metadata.filename,
      score: Number(s.score.toFixed(4)),
    }));

    // If we fell back, add a gentle nudge for improving results
    if (topScore < MIN_SIM) {
      answer += `\n\nTip: Upload your syllabus/notes in the RAG Library to get source-backed, customized answers.`;
    }

    res.json({ answer, citations, topScore });
  } catch (err) {
    console.error("/api/rag/chat error", err);
    res.status(500).json({ message: err.message || "Chat failed" });
  }
});

module.exports = router;
