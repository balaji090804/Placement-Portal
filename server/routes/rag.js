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
const Placement = require("../models/placement");
const Drive = require("../models/drive");
const auth = require("../middleware/authMiddleware");
const ChatAudit = require("../models/ChatAudit");
const InterviewSlot = require("../models/interviewSlot");
const Task = require("../models/task");
const Class = require("../models/class");
const Notification = require("../models/notification");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Load training resources map
const path = require("path");
let trainingMap = {};
try {
  trainingMap = require(path.join(__dirname, "../resources/trainingMap.json"));
} catch (err) {
  console.warn("trainingMap.json not found, resource recommendations disabled");
}

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

// Lightweight metric extraction from free-form text (best effort)
function extractPrevYearMetricsFromText(text, year) {
  const out = {
    placedTotal: null,
    totalStudents: null,
    avg: null,
    highest: null,
    median: null,
    byDept: [],
  };
  if (!text) return out;
  const y = String(year);
  const T = text.replace(/\n+/g, " ").replace(/\s+/g, " ");

  // placed counts like "2024 placed: 120" or "2024_placed": 120
  // Put '-' at end of char class to avoid invalid range ([_- ]) => use [ _-]
  const placedRe1 = new RegExp(`${y}[ _-]?placed\s*[:=]?\s*(\\d{1,5})`, "i");
  const mPlaced = T.match(placedRe1);
  if (mPlaced) out.placedTotal = Number(mPlaced[1]);

  // avg package e.g. "average package: 9.8 LPA" or "avg: 7 LPA"
  const avgRe =
    /(average\s*package|avg)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*lpa/i;
  const mAvg = T.match(avgRe);
  if (mAvg) out.avg = `${mAvg[2]} LPA`;

  // highest/median
  const highRe =
    /(highest\s*package|highest)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*lpa/i;
  const mHigh = T.match(highRe);
  if (mHigh) out.highest = `${mHigh[2]} LPA`;

  const medRe =
    /(median\s*package|median)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*lpa/i;
  const mMed = T.match(medRe);
  if (mMed) out.median = `${mMed[2]} LPA`;

  // department lines like: "CSE": { "2024_placed": 120, "average_package": "9.8 LPA" }
  // Build pattern dynamically to inject the year safely
  const deptPattern = `"?([A-Z]{2,6})"?\\s*[:=]\\s*\\{[^}]*?"?${y}[ _-]?placed"?\\s*[:=]\\s*(\\d{1,5})[^}]*?(average[ _-]?package"?\\s*[:=]\\s*"?([0-9]+(?:\\.[0-9]+)?)\\s*lpa)?`;
  const deptRe = new RegExp(deptPattern, "g");
  let dm;
  while ((dm = deptRe.exec(text)) !== null) {
    const tokenRaw = dm[1] || "";
    const token = tokenRaw.toUpperCase();
    const placed = Number(dm[2]);
    const avg = dm[4] ? `${dm[4]} LPA` : null;
    const banned = new Set([
      "WISE",
      "DEPARTMENT",
      "DEPT",
      "TOTAL",
      "STUDENTS",
      "PLACED",
      "PACKAGE",
      "AVERAGE",
      "MEDIAN",
      "YEAR",
    ]);
    // Only allow short all-caps dept codes like CSE, ECE, IT, MECH, CIVIL, EEE, etc.
    if (/^[A-Z]{2,6}$/.test(token) && !banned.has(token) && placed) {
      out.byDept.push({ dept: token, placed, avg });
    }
  }
  // If no overall placedTotal but have department breakdowns, sum them
  if ((out.placedTotal == null || out.placedTotal === 0) && out.byDept.length) {
    const sum = out.byDept.reduce((s, d) => s + (Number(d.placed) || 0), 0);
    if (sum > 0) out.placedTotal = sum;
  }

  // Try to detect total students from doc (best-effort)
  // Patterns like: "total students: 320", "overall students 320", "batch size: 320"
  const totalStudentsRe = new RegExp(
    `(total|overall|batch)\s*(students|size)\s*[:=]?\s*(\\d{1,5})`,
    "i"
  );
  const mTotal = T.match(totalStudentsRe);
  if (mTotal) out.totalStudents = Number(mTotal[3]);
  return out;
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

    const intents = [];

    // 1) Real-time portal data queries (available to all roles) - Make these more specific
    // Only match if explicitly asking for real-time data, not general questions
    const upcomingDrivesQuery =
      /^(what|list|show|tell|give).*(upcoming|coming|scheduled).*(drive|placement|interview)/.test(
        msg
      ) ||
      /(upcoming|coming|scheduled).*(drive|placement|interview).*(list|show|tell)/.test(
        msg
      ) ||
      /^what.*(drive|placement|interview).*(upcoming|coming|scheduled)/.test(
        msg
      );

    // Separate previous-year stats so we can treat them differently
    // Previous-year stats intent detection was too narrow: user might ask
    // 'What is the placement statistics last year' (year phrase at end) or
    // specify an explicit year like '2023 placement percentage'. We expand patterns.
    const explicitYearMatch = msg.match(/\b(20[0-9]{2})\b/); // capture explicit year if present
    const yearToken = explicitYearMatch
      ? parseInt(explicitYearMatch[1], 10)
      : null;
    const prevYearPhrasePattern = /(previous|last|past).*(year)/.test(msg);
    const prevYearStatsTerms =
      /(placement|placed|percentage|percent|stat|statistics|rate)/.test(msg);
    const trailingLastYearPattern =
      /(placement|placed|percentage|percent|stat|statistics|rate).*last year/.test(
        msg
      );
    const previousYearStatsQuery =
      (prevYearPhrasePattern && prevYearStatsTerms) ||
      trailingLastYearPattern ||
      (yearToken && prevYearStatsTerms && yearToken < new Date().getFullYear());
    const placementStatsQuery =
      (/^(what|tell|show).*(placement|placed).*(percentage|percent|stat|statistic|rate|ratio)/.test(
        msg
      ) ||
        /^how.*many.*(placed|placement)/.test(msg) ||
        /^placement.*(rate|percentage|stat)/.test(msg)) &&
      !previousYearStatsQuery;

    const companyFeedbackQuery =
      /^(what|tell|show).*(feedback|experience).*(amazon|google|microsoft|tcs|infosys|wipro|accenture)/.test(
        msg
      ) ||
      /^(amazon|google|microsoft|tcs|infosys|wipro|accenture).*(placed|student).*(feedback|experience)/.test(
        msg
      );

    const companyPrepQuery =
      /^(how|what).*prepare.*(for|amazon|google|microsoft|tcs|infosys|wipro|accenture)/.test(
        msg
      ) ||
      /^(prep|preparation|tip|advice).*(for|amazon|google|microsoft|tcs|infosys|wipro|accenture)/.test(
        msg
      );

    // 2) Role-aware dynamic shortcuts
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

    // Handle real-time portal data queries
    if (upcomingDrivesQuery) {
      intents.push("upcoming_drives");
      const now = new Date();
      const upcoming = await PlacementAnnouncement.find({
        dateTime: { $gte: now },
      })
        .sort({ dateTime: 1 })
        .limit(10)
        .lean();

      if (upcoming.length === 0) {
        return res.json({
          answer:
            "There are no upcoming placement drives scheduled at the moment. Check back later or contact the placement office for updates.",
          citations: [],
          topScore: null,
        });
      }

      const driveList = upcoming
        .map((ann, idx) => {
          const dateStr = new Date(ann.dateTime).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          return `${idx + 1}. ${ann.companyName} - ${
            ann.jobRole
          } on ${dateStr}`;
        })
        .join("\n");

      const answer = `Here are the upcoming placement drives:\n\n${driveList}\n\nTotal: ${upcoming.length} drive(s) scheduled.`;
      await ChatAudit.create({
        userEmail: email,
        role,
        query: message,
        answer,
        intents,
        sources: [],
        escalated: false,
      });
      return res.json({
        answer,
        type: "upcoming_drives",
        sources: [],
        topScore: null,
        intents,
        escalated: false,
      });
    }

    // Generic announcements query (covers prompts like: "any announcement?"),
    // role-aware: faculty -> FacultyAnnouncement assigned to them; others -> placement announcements
    const announcementsGenericQuery =
      /(\bannouncement\b|\bannouncements\b)/.test(msg);
    if (announcementsGenericQuery) {
      intents.push("announcements_generic");
      const now = new Date();

      if (role === "faculty" && email) {
        // Upcoming faculty-assigned announcements
        const upcoming = await FacultyAnnouncement.find({
          assignedFacultyEmail: email,
          dateTime: { $gte: now },
        })
          .sort({ dateTime: 1 })
          .limit(10)
          .lean();

        if (upcoming.length > 0) {
          const list = upcoming
            .map((a, i) => {
              const when = new Date(a.dateTime).toLocaleString();
              return `${i + 1}. ${a.companyName} – ${a.jobRole} on ${when}`;
            })
            .join("\n");
          const answer = `You have the following upcoming announcements assigned to you:\n\n${list}\n\nTotal: ${upcoming.length}.`;
          await ChatAudit.create({
            userEmail: email,
            role,
            query: message,
            answer,
            intents,
            sources: [],
            escalated: false,
          });
          return res.json({
            answer,
            type: "announcements_faculty",
            sources: [],
            topScore: null,
            intents,
            escalated: false,
          });
        }

        // If none upcoming, show pending (not completed)
        const pending = await FacultyAnnouncement.find({
          assignedFacultyEmail: email,
          isCompleted: { $ne: true },
        })
          .sort({ dateTime: 1 })
          .limit(10)
          .lean();

        if (pending.length === 0) {
          const answer =
            "You currently have no upcoming or pending announcements assigned.";
          await ChatAudit.create({
            userEmail: email,
            role,
            query: message,
            answer,
            intents,
            sources: [],
            escalated: false,
          });
          return res.json({
            answer,
            type: "announcements_faculty",
            sources: [],
            topScore: null,
            intents,
            escalated: false,
          });
        }

        const list = pending
          .map((a, i) => {
            const when = a.dateTime
              ? new Date(a.dateTime).toLocaleString()
              : "TBA";
            return `${i + 1}. ${a.companyName} – ${a.jobRole}${
              when ? ` on ${when}` : ""
            }`;
          })
          .join("\n");
        const answer = `Pending announcements assigned to you:\n\n${list}\n\nTotal pending: ${pending.length}.`;
        await ChatAudit.create({
          userEmail: email,
          role,
          query: message,
          answer,
          intents,
          sources: [],
          escalated: false,
        });
        return res.json({
          answer,
          type: "announcements_faculty",
          sources: [],
          topScore: null,
          intents,
          escalated: false,
        });
      } else {
        // Non-faculty: show upcoming placement announcements (same as upcoming drives)
        const upcoming = await PlacementAnnouncement.find({
          dateTime: { $gte: now },
        })
          .sort({ dateTime: 1 })
          .limit(10)
          .lean();

        if (upcoming.length === 0) {
          const answer =
            "There are no upcoming announcements at the moment. Please check back later.";
          await ChatAudit.create({
            userEmail: email,
            role,
            query: message,
            answer,
            intents,
            sources: [],
            escalated: false,
          });
          return res.json({
            answer,
            type: "announcements_general",
            sources: [],
            topScore: null,
            intents,
            escalated: false,
          });
        }

        const lines = upcoming
          .map((ann, idx) => {
            const dateStr = new Date(ann.dateTime).toLocaleString();
            return `${idx + 1}. ${ann.companyName} – ${
              ann.jobRole
            } on ${dateStr}`;
          })
          .join("\n");
        const answer = `Here are the upcoming announcements:\n\n${lines}\n\nTotal: ${upcoming.length}.`;
        await ChatAudit.create({
          userEmail: email,
          role,
          query: message,
          answer,
          intents,
          sources: [],
          escalated: false,
        });
        return res.json({
          answer,
          type: "announcements_general",
          sources: [],
          topScore: null,
          intents,
          escalated: false,
        });
      }
    }

    if (previousYearStatsQuery) {
      intents.push("placement_stats_previous_year");
      // Resolve target year: explicit year if given and < current year, else previous calendar year
      const currentYear = new Date().getFullYear();
      const year =
        yearToken && yearToken < currentYear ? yearToken : currentYear - 1;
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      const totalStudentsPrev = await User.countDocuments({ role: "student" }); // baseline (if historical student counts not stored)
      const placedPrev = await Placement.countDocuments({
        status: "Placed",
        dateOfOffer: { $gte: start, $lte: end },
      });
      const pctPrev =
        totalStudentsPrev > 0
          ? ((placedPrev / totalStudentsPrev) * 100).toFixed(2)
          : "0.00";

      // Attempt supplemental context from RAG chunks mentioning the previous year
      const prevYearStr = String(year);
      const ragYearChunks = await RagChunk.find({
        content: { $regex: prevYearStr, $options: "i" },
        "metadata.visibility": "all",
      })
        .limit(5)
        .lean();

      // Extract structured metrics from first few chunks
      let docMetrics = null;
      for (const c of ragYearChunks) {
        const metrics = extractPrevYearMetricsFromText(c.content, year);
        if (metrics.placedTotal || metrics.byDept.length) {
          docMetrics = metrics;
          break;
        }
      }

      // Compute effective metrics (allow doc override if DB shows zero)
      let effectivePlaced = placedPrev;
      let effectiveTotal = totalStudentsPrev;
      let effectivePct = pctPrev;
      let docOverrideUsed = false;
      if (docMetrics && placedPrev === 0) {
        // Prefer explicit placedTotal from doc; else sum of dept placements
        const docPlaced =
          typeof docMetrics.placedTotal === "number" &&
          docMetrics.placedTotal > 0
            ? docMetrics.placedTotal
            : Array.isArray(docMetrics.byDept)
            ? docMetrics.byDept.reduce((s, d) => s + (Number(d.placed) || 0), 0)
            : 0;
        if (docPlaced > 0) {
          effectivePlaced = docPlaced;
          // If document also provided totalStudents, use it; else ensure denominator >= numerator
          if (
            typeof docMetrics.totalStudents === "number" &&
            docMetrics.totalStudents > 0
          ) {
            effectiveTotal = docMetrics.totalStudents;
          }
          if (effectivePlaced > effectiveTotal)
            effectiveTotal = effectivePlaced;
          effectivePct = effectiveTotal
            ? ((effectivePlaced / effectiveTotal) * 100).toFixed(2)
            : "0.00";
          docOverrideUsed = true;
        }
      }

      const lines = [];
      lines.push(`Previous Year (${year}) Placement Statistics:`);
      lines.push("");
      lines.push(`Placed Students: ${effectivePlaced}`);
      lines.push(`Total Students (reference): ${effectiveTotal}`);
      lines.push(`Placement Percentage: ${effectivePct}%`);

      if (docMetrics) {
        lines.push("");
        if (docMetrics.avg) lines.push(`Average Package: ${docMetrics.avg}`);
        if (docMetrics.highest)
          lines.push(`Highest Package: ${docMetrics.highest}`);
        if (docMetrics.median)
          lines.push(`Median Package: ${docMetrics.median}`);
        if (docMetrics.byDept.length) {
          lines.push("");
          lines.push("Dept-wise Highlights:");
          docMetrics.byDept.slice(0, 6).forEach((d) => {
            lines.push(
              `• ${d.dept}: placed ${d.placed}${d.avg ? `, avg ${d.avg}` : ""}`
            );
          });
        }
      } else if (ragYearChunks.length) {
        // Provide a single concise summary line from the first chunk if no structured extraction
        const snippet = ragYearChunks[0].content
          .slice(0, 140)
          .replace(/\s+/g, " ");
        lines.push("");
        lines.push(
          `Doc Snippet: ${snippet}${
            ragYearChunks[0].content.length > 140 ? "…" : ""
          }`
        );
      } else {
        lines.push("");
        lines.push(
          "No uploaded document context found for last year. Upload a stats report PDF to enrich this answer."
        );
      }

      if (docOverrideUsed) {
        lines.push("");
        lines.push(
          "(Note: Placement count derived from uploaded document metrics; database had no records for that year.)"
        );
      }
      const answer = lines.join("\n");
      await ChatAudit.create({
        userEmail: email,
        role,
        query: message,
        answer,
        intents,
        sources: [],
        escalated: false,
      });
      return res.json({
        answer,
        type: "placement_stats_previous_year",
        sources: [],
        topScore: null,
        intents,
        escalated: false,
      });
    }

    if (placementStatsQuery) {
      intents.push("placement_stats");
      const totalStudents = await User.countDocuments({ role: "student" });
      const placedStudents = await Placement.countDocuments({
        status: "Placed",
      });
      const placementPercentage =
        totalStudents > 0
          ? ((placedStudents / totalStudents) * 100).toFixed(2)
          : 0;

      // Get company-wise placement stats
      const companyStats = await Placement.aggregate([
        { $match: { status: "Placed" } },
        { $group: { _id: "$company", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      let companyStatsText = "";
      if (companyStats.length > 0) {
        companyStatsText =
          "\n\nTop companies:\n" +
          companyStats
            .map((c, idx) => `${idx + 1}. ${c._id}: ${c.count} student(s)`)
            .join("\n");
      }

      const answer = `Placement Statistics:\n\nTotal Students: ${totalStudents}\nPlaced Students: ${placedStudents}\nPlacement Percentage: ${placementPercentage}%${companyStatsText}`;
      await ChatAudit.create({
        userEmail: email,
        role,
        query: message,
        answer,
        intents,
        sources: [],
        escalated: false,
      });
      return res.json({
        answer,
        type: "placement_stats",
        sources: [],
        topScore: null,
        intents,
        escalated: false,
      });
    }

    if (companyFeedbackQuery || companyPrepQuery) {
      intents.push(companyFeedbackQuery ? "company_feedback" : "company_prep");
      // Extract company name from query
      const companies = [
        "amazon",
        "google",
        "microsoft",
        "tcs",
        "infosys",
        "wipro",
        "accenture",
      ];
      const mentionedCompany = companies.find((c) => msg.includes(c));

      if (mentionedCompany) {
        // Get placements for this company
        const companyPlacements = await Placement.find({
          company: new RegExp(mentionedCompany, "i"),
          status: "Placed",
        })
          .limit(5)
          .lean();

        // Get recruiter info for prep tips
        const recruiterInfo = await Recruiter.findOne({
          companyName: new RegExp(mentionedCompany, "i"),
        })
          .sort({ postedAt: -1 })
          .lean();

        let answer = "";
        if (companyPlacements.length > 0) {
          answer = `Found ${
            companyPlacements.length
          } placement(s) at ${mentionedCompany.toUpperCase()}.\n\n`;
          if (companyFeedbackQuery) {
            answer +=
              "For specific student feedback, please contact the placement office or check the placement records section.\n\n";
          }
        } else {
          answer = `No recent placements found for ${mentionedCompany.toUpperCase()}.\n\n`;
        }

        if (companyPrepQuery && recruiterInfo) {
          const skills = Array.isArray(recruiterInfo.requiredSkills)
            ? recruiterInfo.requiredSkills.join(", ")
            : "Not specified";
          const eligibility =
            recruiterInfo.eligibilityCriteria || "Not specified";

          answer += `Preparation Tips for ${mentionedCompany.toUpperCase()}:\n\n`;
          answer += `Required Skills: ${skills}\n`;
          answer += `Eligibility: ${eligibility}\n\n`;
          answer += "General Tips:\n";
          answer += "• Focus on data structures and algorithms\n";
          answer += "• Practice coding problems regularly\n";
          answer += "• Prepare for behavioral interviews\n";
          answer += "• Review company-specific interview patterns\n";
        } else if (companyPrepQuery) {
          answer += `General preparation tips for ${mentionedCompany.toUpperCase()}:\n\n`;
          answer += "• Focus on data structures and algorithms\n";
          answer += "• Practice coding problems regularly\n";
          answer += "• Prepare for behavioral interviews\n";
          answer += "• Review company-specific interview patterns\n";
        }

        await ChatAudit.create({
          userEmail: email,
          role,
          query: message,
          answer,
          intents,
          sources: [],
          escalated: false,
        });
        return res.json({
          answer,
          type: intents[intents.length - 1],
          sources: [],
          topScore: null,
          intents,
          escalated: false,
        });
      } else {
        // General prep tips
        let answer = "General Placement Preparation Tips:\n\n";
        answer += "• Focus on data structures and algorithms\n";
        answer +=
          "• Practice coding problems regularly (LeetCode, HackerRank)\n";
        answer += "• Prepare for behavioral interviews (STAR method)\n";
        answer += "• Review company-specific interview patterns\n";
        answer += "• Build a strong resume highlighting relevant projects\n";
        answer += "• Practice mock interviews\n";
        answer += "• Stay updated with industry trends\n\n";
        answer +=
          "For company-specific tips, mention the company name (e.g., 'Amazon prep tips').";
        await ChatAudit.create({
          userEmail: email,
          role,
          query: message,
          answer,
          intents,
          sources: [],
          escalated: false,
        });
        return res.json({
          answer,
          type: intents[intents.length - 1],
          sources: [],
          topScore: null,
          intents,
          escalated: false,
        });
      }
    }

    // Application status intent: "my application status"
    const appStatusIntent =
      role === "student" &&
      /(my|application).*(status|applied|applications)/.test(msg);
    if (appStatusIntent && email) {
      intents.push("application_status");
      const apps =
        (await (await import("../models/application")).default?.find) ||
        require("../models/application").find;
      const myApps = await require("../models/application")
        .find({ studentEmail: email })
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean();
      const ids = myApps.map((a) => a.driveId).filter(Boolean);
      const drivesById = ids.length
        ? (await Drive.find({ _id: { $in: ids } }).lean()).reduce(
            (m, d) => ((m[d._id.toString()] = d), m),
            {}
          )
        : {};
      if (!myApps.length) {
        const answer =
          "You don't have any applications yet. Explore the Placement Drives page to apply.";
        await ChatAudit.create({
          userEmail: email,
          role,
          query: message,
          answer,
          intents,
          sources: [],
          escalated: false,
        });
        return res.json({
          answer,
          type: "application_status",
          sources: [],
          topScore: null,
          intents,
          escalated: false,
        });
      }
      const lines = myApps.map((a) => {
        const d = drivesById[a.driveId?.toString()] || {};
        const comp = d.companyName || "Unknown Company";
        const roleTitle = d.roleTitle || d.title || "Role";
        return `• ${comp} – ${roleTitle}: ${a.status}`;
      });
      const answer = `Your recent applications:\n\n${lines.join("\n")}`;
      await ChatAudit.create({
        userEmail: email,
        role,
        query: message,
        answer,
        intents,
        sources: [],
        escalated: false,
      });
      return res.json({
        answer,
        type: "application_status",
        sources: [],
        topScore: null,
        intents,
        escalated: false,
      });
    }

    // Eligibility intent: explicit single-company check like "eligible for Infosys drive"
    const eligibilityIntent =
      role === "student" &&
      /(eligible).*(infosys|tcs|wipro|accenture|amazon|google|microsoft)/.test(
        msg
      );
    if (eligibilityIntent) {
      intents.push("eligibility_check");
      // Extract company
      const companies = [
        "infosys",
        "tcs",
        "wipro",
        "accenture",
        "amazon",
        "google",
        "microsoft",
      ];
      const company = companies.find((c) => msg.includes(c));
      let answer;
      let sources = [];
      if (!company) {
        answer =
          "I couldn't identify the company. Please specify the company name explicitly.";
        await ChatAudit.create({
          userEmail: email,
          role,
          query: message,
          answer,
          intents,
          sources,
          escalated: false,
        });
        return res.json({
          answer,
          type: "eligibility_check",
          sources,
          topScore: null,
          intents,
          escalated: false,
        });
      }
      const profile = await StudentProfile.findOne({
        collegeEmail: email,
      }).lean();
      if (!profile) {
        answer =
          "Please complete your profile first (CGPA, branch, skills) to evaluate eligibility.";
        await ChatAudit.create({
          userEmail: email,
          role,
          query: message,
          answer,
          intents,
          sources,
          escalated: false,
        });
        return res.json({
          answer,
          type: "eligibility_check",
          sources,
          topScore: null,
          intents,
          escalated: false,
        });
      }
      const recruiterDocs = await Recruiter.find({
        companyName: new RegExp(company, "i"),
      })
        .sort({ postedAt: -1 })
        .limit(3)
        .lean();
      let verdict = "Undetermined";
      let reasons = [];
      if (recruiterDocs.length === 0) {
        verdict = "No recruiter document found";
        reasons.push("Company data not uploaded yet.");
      } else {
        // Check first doc eligibilityCriteria
        const doc = recruiterDocs[0];
        const crit = (doc.eligibilityCriteria || "").toLowerCase();
        const cgMatch = crit.match(/cgpa\s*(\d+(?:\.\d+)?)/);
        if (cgMatch && profile.cgpa) {
          const reqCg = parseFloat(cgMatch[1]);
          if (profile.cgpa >= reqCg)
            reasons.push(`CGPA OK (${profile.cgpa} ≥ ${reqCg})`);
          else reasons.push(`CGPA LOW (${profile.cgpa} < ${reqCg})`);
        }
        if (
          crit.includes("backlog") &&
          /(no backlog|0 backlog)/.test(crit) &&
          profile.backlogs > 0
        ) {
          reasons.push(`Backlogs present (${profile.backlogs})`);
        }
        const branch = (profile.branch || "").toLowerCase();
        if (/cse|cs/i.test(crit) && !/cse|cs/.test(branch))
          reasons.push(`Branch mismatch (${profile.branch})`);
        // Skills
        const skillsText = (profile.skills || "").toLowerCase();
        const requiredSkills = Array.isArray(doc.requiredSkills)
          ? doc.requiredSkills.map((s) => String(s).toLowerCase())
          : [];
        const hasSkill = requiredSkills.some((rs) => skillsText.includes(rs));
        if (requiredSkills.length)
          reasons.push(hasSkill ? "Skill match" : "Skills missing");
        // Verdict heuristic
        const negatives = reasons.filter((r) =>
          /LOW|mismatch|missing|Backlogs/.test(r)
        ).length;
        verdict = negatives === 0 ? "Eligible" : "Not Eligible";
        sources.push({
          filename: doc.companyName + " recruiter doc",
          chunkIndex: 0,
          score: 1,
          preview: (doc.eligibilityCriteria || "").slice(0, 160),
        });
      }
      answer = `${verdict}: ${reasons.join("; ")}`;
      await ChatAudit.create({
        userEmail: email,
        role,
        query: message,
        answer,
        intents,
        sources,
        escalated: false,
      });
      return res.json({
        answer,
        type: "eligibility_check",
        sources,
        topScore: null,
        intents,
        escalated: false,
      });
    }

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
        ? `Based on your profile (${branch || "—"} branch, CGPA: ${
            cgpa ?? "—"
          }), here are relevant opportunities:`
        : `Here are upcoming placement opportunities:`;

      // Limit to top 3 most relevant to keep response concise
      const topThree = lines.slice(0, 3);
      const answer = `${header}\n\n${topThree.join(
        "\n\n"
      )}\n\nTip: Keep your profile updated for better matches.`;
      await ChatAudit.create({
        userEmail: email,
        role,
        query: message,
        answer,
        intents: intents.concat(["student_recommendations"]),
        sources: [],
        escalated: false,
      });
      return res.json({
        answer,
        type: "student_recommendations",
        sources: [],
        topScore: null,
        intents: intents.concat(["student_recommendations"]),
        escalated: false,
      });
    }

    // Next interview intent (student): "next interview", "when is my interview"
    const nextInterviewIntent =
      role === "student" && /(next|upcoming).*(interview|test)/.test(msg);
    if (nextInterviewIntent) {
      intents.push("next_interview");
      const slots = await InterviewSlot.find({
        bookedEmails: email,
        slotStart: { $gte: new Date() },
      })
        .sort({ slotStart: 1 })
        .limit(1)
        .lean();
      let answer;
      let payload = {};
      if (!slots.length) {
        answer =
          "No upcoming interview or test slot booked. You can book a slot from the Interview Slots page.";
      } else {
        const s = slots[0];
        answer = `Your next interview/test is on ${new Date(
          s.slotStart
        ).toLocaleString()} (ends ${new Date(
          s.slotEnd
        ).toLocaleString()}). Capacity remaining: ${Math.max(
          0,
          (s.capacity || 0) - (s.bookedEmails || []).length
        )}.`;
        payload.event = {
          title: "Interview",
          start: s.slotStart,
          end: s.slotEnd,
        };
      }
      await ChatAudit.create({
        userEmail: email,
        role,
        query: message,
        answer,
        intents,
        sources: [],
        escalated: false,
      });
      return res.json({
        answer,
        type: "next_interview",
        sources: [],
        topScore: null,
        intents,
        escalated: false,
        ...payload,
      });
    }

    // Tasks intent (student): "my tasks", "tasks for tomorrow", "pending tasks"
    const tasksIntent =
      role === "student" &&
      /(my|pending|upcoming).*(task|assignment|deadline)/.test(msg);
    const tasksTomorrowIntent =
      role === "student" &&
      /(class|task|assignment).*(tomorrow|today)/.test(msg);
    if (tasksIntent || tasksTomorrowIntent) {
      intents.push("tasks_query");
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      let filter = { studentEmail: email };
      if (tasksTomorrowIntent) {
        filter.dueDate = { $gte: today, $lte: tomorrow };
      } else if (/pending/.test(msg)) {
        filter.status = "Pending";
      }

      const tasks = await Task.find(filter)
        .sort({ dueDate: 1 })
        .limit(10)
        .lean();

      if (!tasks.length) {
        const answer = tasksTomorrowIntent
          ? "You don't have any tasks or assignments due tomorrow."
          : "You don't have any pending tasks.";
        await ChatAudit.create({
          userEmail: email,
          role,
          query: message,
          answer,
          intents,
          sources: [],
          escalated: false,
        });
        return res.json({
          answer,
          type: "tasks_query",
          sources: [],
          topScore: null,
          intents,
          escalated: false,
        });
      }

      const lines = tasks.map((t) => {
        const due = t.dueDate
          ? new Date(t.dueDate).toLocaleDateString()
          : "No due date";
        const priority = t.priority || "Medium";
        return `• [${priority}] ${t.text} - Due: ${due} (${t.status})`;
      });

      const answer = `Your tasks:\n\n${lines.join("\n")}`;
      await ChatAudit.create({
        userEmail: email,
        role,
        query: message,
        answer,
        intents,
        sources: [],
        escalated: false,
      });
      return res.json({
        answer,
        type: "tasks_query",
        sources: [],
        topScore: null,
        intents,
        escalated: false,
      });
    }

    // Classes intent (student): "class schedule", "classes tomorrow", "my classes"
    const classesIntent =
      role === "student" &&
      /(class|lecture|schedule).*(tomorrow|today|assigned)/.test(msg);
    if (classesIntent) {
      intents.push("classes_query");
      const classes = await Class.find({ studentEmails: email })
        .limit(10)
        .lean();

      if (!classes.length) {
        const answer =
          "You don't have any classes assigned. The class schedule is managed by your department.";
        await ChatAudit.create({
          userEmail: email,
          role,
          query: message,
          answer,
          intents,
          sources: [],
          escalated: false,
        });
        return res.json({
          answer,
          type: "classes_query",
          sources: [],
          topScore: null,
          intents,
          escalated: false,
        });
      }

      const lines = classes.map((c) => {
        const schedule = c.schedule || "Schedule TBA";
        const room = c.room || "Room TBA";
        const instructor = c.instructor || "Instructor TBA";
        return `• ${c.courseName} (${c.department})\n  Schedule: ${schedule}\n  Room: ${room}\n  Instructor: ${instructor}`;
      });

      const answer = `Your classes:\n\n${lines.join("\n\n")}`;
      await ChatAudit.create({
        userEmail: email,
        role,
        query: message,
        answer,
        intents,
        sources: [],
        escalated: false,
      });
      return res.json({
        answer,
        type: "classes_query",
        sources: [],
        topScore: null,
        intents,
        escalated: false,
      });
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
          "You currently have no pending announcements or assigned students.";
      } else {
        if (annLines.length) {
          // Limit to top 5 to keep response concise
          const topAnn = annLines.slice(0, 5);
          answer += `Pending announcements (${
            pendingAnnouncements.length
          }):\n${topAnn.join("\n")}`;
          if (annLines.length > 5) {
            answer += `\n...and ${annLines.length - 5} more.`;
          }
        }
        if (stuLines.length) {
          answer += `\n\nAssigned students (${assigned.length}):\n${stuLines
            .slice(0, 5)
            .join("\n")}`;
          if (stuLines.length > 5) {
            answer += `\n...and ${stuLines.length - 5} more.`;
          }
        }
      }
      await ChatAudit.create({
        userEmail: email,
        role,
        query: message,
        answer,
        intents: intents.concat(["faculty_snapshot"]),
        sources: [],
        escalated: false,
      });
      return res.json({
        answer,
        type: "faculty_snapshot",
        sources: [],
        topScore: null,
        intents: intents.concat(["faculty_snapshot"]),
        escalated: false,
      });
    }

    // Resume builder intent (student): "help with resume", "build resume", "resume for SDE"
    const resumeIntent =
      role === "student" &&
      /(help|build|make|create|optimize).*(resume|cv)/.test(msg);
    if (resumeIntent && email) {
      intents.push("resume_builder");
      const profile = await StudentProfile.findOne({
        collegeEmail: email,
      }).lean();
      if (!profile) {
        const answer =
          "Please complete your profile first to generate a resume. Visit the Profile page.";
        await ChatAudit.create({
          userEmail: email,
          role,
          query: message,
          answer,
          intents,
          sources: [],
          escalated: false,
        });
        return res.json({
          answer,
          type: "resume_builder",
          sources: [],
          topScore: null,
          intents,
          escalated: false,
        });
      }

      // Build structured resume JSON
      const resumeData = {
        name: profile.name || "Your Name",
        email: profile.collegeEmail,
        phone: profile.contactNumber || "",
        headline: profile.headline || "",
        summary: profile.summary || "",
        education: profile.education || [],
        experience: profile.employmentHistory || [],
        projects: profile.projects || [],
        skills: (profile.skills || "")
          .split(",")
          .filter(Boolean)
          .map((s) => s.trim()),
        certifications: profile.certifications || [],
        links: {
          linkedin: profile.linkedin || "",
          github: profile.github || "",
        },
      };

      // Extract role from query for targeted optimization
      const roleMatch = msg.match(
        /(sde|software|data engineer|backend|frontend|fullstack|devops|analyst)/i
      );
      const targetRole = roleMatch ? roleMatch[1] : "general";

      let answer = `I've prepared your resume data. Here's a summary:\n\n`;
      answer += `**Name:** ${resumeData.name}\n`;
      answer += `**Skills:** ${resumeData.skills.slice(0, 8).join(", ")}${
        resumeData.skills.length > 8 ? "..." : ""
      }\n`;
      answer += `**Projects:** ${resumeData.projects.length}\n`;
      answer += `**Experience:** ${resumeData.experience.length}\n\n`;
      answer += `To download your resume as PDF, visit the Resume Builder page. I've optimized it for **${targetRole}** roles.`;

      // Store in response payload for client to use
      await ChatAudit.create({
        userEmail: email,
        role,
        query: message,
        answer,
        intents,
        sources: [],
        escalated: false,
      });
      return res.json({
        answer,
        type: "resume_builder",
        sources: [],
        topScore: null,
        intents,
        escalated: false,
        resumeData,
        targetRole,
      });
    }

    // Mock interview intent (student): "mock interview", "practice questions", "interview prep for Amazon"
    const mockInterviewIntent =
      role === "student" && /(mock|practice).*(interview|question)/.test(msg);
    if (mockInterviewIntent) {
      intents.push("mock_interview");

      // Extract company if mentioned
      const companies = [
        "amazon",
        "google",
        "microsoft",
        "tcs",
        "infosys",
        "wipro",
        "accenture",
      ];
      const company = companies.find((c) => msg.includes(c));
      const roleMatch = msg.match(
        /(sde|software|data engineer|backend|frontend|analyst|devops)/i
      );
      const targetRole = roleMatch ? roleMatch[1] : "Software Engineer";

      const companyText = company ? ` for ${company.toUpperCase()}` : "";

      // Generate mock questions using Gemini
      try {
        const gemini = await getGeminiModel();
        const prompt = `Generate a concise mock interview question set for a ${targetRole} role${companyText}. Format as follows (max 12 questions total, no answers):

**Coding (5 questions - titles only):**
1. [Question title]
2. ...

**Behavioral (4 questions):**
1. [STAR-method question]
2. ...

**Technical Concepts (3 questions):**
1. [Concept question]
2. ...

Keep it brief and actionable.`;

        const result = await gemini.generateContent(prompt);
        let answer =
          result &&
          result.response &&
          typeof result.response.text === "function"
            ? result.response.text()
            : "";

        // Sanitize
        answer = answer.trim();

        // Add footer
        answer += `\n\n**Tip:** Practice these using the STAR method for behavioral questions. Good luck!`;

        await ChatAudit.create({
          userEmail: email,
          role,
          query: message,
          answer,
          intents,
          sources: [],
          escalated: false,
        });
        return res.json({
          answer,
          type: "mock_interview",
          sources: [],
          topScore: null,
          intents,
          escalated: false,
        });
      } catch (err) {
        console.error("Mock interview generation failed:", err);
        const answer = `I couldn't generate mock questions right now. Here are general tips:\n\n• Practice data structures & algorithms\n• Prepare STAR-method behavioral answers\n• Review system design basics\n• Mock interview with peers\n\nTry again or visit the Interview Preparation page.`;
        await ChatAudit.create({
          userEmail: email,
          role,
          query: message,
          answer,
          intents,
          sources: [],
          escalated: false,
        });
        return res.json({
          answer,
          type: "mock_interview",
          sources: [],
          topScore: null,
          intents,
          escalated: false,
        });
      }
    }

    // Resource recommendation intent: "resources for SDE", "what to study for backend"
    const resourceIntent =
      /(resource|study|learn|prepare|material).*(for|backend|frontend|sde|analyst|devops|data engineer)/.test(
        msg
      );
    if (resourceIntent) {
      intents.push("resource_recommendation");
      const roleMatch = msg.match(
        /(sde|software|data engineer|backend|frontend|analyst|devops)/i
      );
      const targetRole = roleMatch ? roleMatch[1].toLowerCase() : "general";
      const normalizedRole =
        targetRole.includes("software") || targetRole.includes("sde")
          ? "sde"
          : targetRole;

      const resourceData =
        trainingMap[normalizedRole] || trainingMap["general"];

      if (!resourceData) {
        const answer =
          "I don't have specific resources for that role yet. Try general placement resources or ask the placement office.";
        await ChatAudit.create({
          userEmail: email,
          role,
          query: message,
          answer,
          intents,
          sources: [],
          escalated: false,
        });
        return res.json({
          answer,
          type: "resource_recommendation",
          sources: [],
          topScore: null,
          intents,
          escalated: false,
        });
      }

      const lines = resourceData.resources.map(
        (r, i) =>
          `${i + 1}. **${r.title}** ${r.url ? `- [Link](${r.url})` : ""} (${
            r.type
          })`
      );

      let answer = `**Resources for ${normalizedRole.toUpperCase()} role:**\n\n`;
      answer += `**Key Skills:** ${resourceData.skills.join(", ")}\n\n`;
      answer += `**Recommended Resources:**\n${lines.join("\n")}\n\n`;
      answer += `Good luck with your preparation!`;

      await ChatAudit.create({
        userEmail: email,
        role,
        query: message,
        answer,
        intents,
        sources: [],
        escalated: false,
      });
      return res.json({
        answer,
        type: "resource_recommendation",
        sources: [],
        topScore: null,
        intents,
        escalated: false,
      });
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
      .filter((c) => c.score > 0) // Filter out negative scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Get more chunks for better context

    // Lower threshold to allow more document matches
    const MIN_SIM = parseFloat(process.env.RAG_MIN_SIM || "0.15");
    const topScore = scored.length > 0 ? scored[0].score : -1;

    // Build context from relevant chunks
    const relevantChunks = scored.filter((s) => s.score >= MIN_SIM);
    const context =
      relevantChunks.length > 0
        ? relevantChunks
            .map(
              (s, i) =>
                `# Source ${i + 1} (from ${
                  s.metadata.filename || "college document"
                }):\n${s.content}`
            )
            .join("\n\n")
        : "";

    let system;
    let prompt;

    if (context && context.length > 0 && relevantChunks.length > 0) {
      // Use RAG context from uploaded documents
      system = `You are a specialized placement assistant for this college's placement portal. Your role is to help students, faculty, and administrators with placement-related queries.

IMPORTANT GUIDELINES:
- Use the provided college-specific documents to answer the question
- Base your answer PRIMARILY on the provided sources - these are official college documents
- Keep answers CONCISE (2-4 sentences maximum, unless detailed explanation is specifically requested)
- Focus on placement-related topics: job opportunities, eligibility criteria, interview preparation, placement procedures, college policies, placement statistics, upcoming drives
- Do NOT include citations, source IDs, file names, links, or implementation details in your response
- Do NOT over-populate responses - be clear and direct
- If the question isn't fully answered by the sources, provide what you can from the sources and acknowledge limitations
- Be professional and accurate
- If the sources contain specific information about the college, use that information directly
- Answer based on what is in the documents provided`;

      prompt = `${system}\n\nUser Question: ${message}\n\nRelevant College Documents (use these to answer the question, but do NOT mention sources in your reply):\n${context}`;
    } else {
      // Fallback: provide general, structured guidance (no strict RAG constraint)
      system = `You are a specialized placement assistant for this college's placement portal. Your role is to help students, faculty, and administrators with placement-related queries.

IMPORTANT GUIDELINES:
- Keep answers CONCISE (2-4 sentences maximum, unless detailed explanation is specifically requested)
- Focus on placement-related topics: job opportunities, eligibility criteria, interview preparation, placement procedures, college policies, placement statistics, upcoming drives
- If asked about company-specific prep, provide brief, actionable guidance only
- Do NOT over-populate responses with excessive information
- Be professional, clear, and direct
- If you don't know something specific to this college, say so rather than guessing
- Do not invent private data, links, or internal file references
- For real-time data queries (upcoming drives, placement stats), direct users to ask specific questions like "what are the upcoming drives" or "what is the placement percentage"
- Note: No college-specific documents were found in the knowledge base. If the question is about college policies or procedures, suggest that the admin upload relevant documents.`;

      prompt = `${system}\n\nUser Question: ${message}\n\n(No relevant college-specific documents found in the knowledge base. Provide a brief, helpful response based on general placement knowledge. If the question is about college-specific information, suggest that the admin upload relevant documents.)`;
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

    // Limit answer length to prevent over-population (max 500 characters for concise responses)
    const MAX_ANSWER_LENGTH = 500;
    if (answer.length > MAX_ANSWER_LENGTH) {
      // Try to cut at a sentence boundary
      const truncated = answer.substring(0, MAX_ANSWER_LENGTH);
      const lastPeriod = truncated.lastIndexOf(".");
      const lastQuestion = truncated.lastIndexOf("?");
      const lastExclamation = truncated.lastIndexOf("!");
      const lastSentenceEnd = Math.max(
        lastPeriod,
        lastQuestion,
        lastExclamation
      );

      if (lastSentenceEnd > MAX_ANSWER_LENGTH * 0.7) {
        answer = truncated.substring(0, lastSentenceEnd + 1);
      } else {
        answer = truncated + "...";
      }
    }

    const citations = scored.map((s, i) => ({
      index: i + 1,
      filename: s.metadata.filename,
      score: Number(s.score.toFixed(4)),
    }));

    // If we fell back, add a gentle nudge for improving results (but keep it brief)
    if (!context || context.length === 0) {
      answer += `\n\nTip: For college-specific information, ask the admin to upload relevant documents in the RAG Library.`;
    }

    const sources = citations.map((c) => ({
      filename: c.filename,
      chunkIndex: c.index - 1,
      score: c.score,
      preview: "",
    }));

    // Escalation logic: low confidence
    const lowConfidence = topScore < 0.12 && sources.length === 0;
    const escalated = lowConfidence;

    if (escalated) {
      // Create a notification for placement officer
      try {
        await Notification.create({
          toEmail: "placement@college.edu", // Configure this in env or settings
          title: "Student query needs attention",
          message: `Query from ${email}: "${message.slice(0, 100)}${
            message.length > 100 ? "..." : ""
          }"`,
          link: `/admin/chat-audit`,
          createdBy: "chatbot",
        });
      } catch (notifErr) {
        console.error("Failed to create escalation notification:", notifErr);
      }
      answer += `\n\n**Note:** I've notified the placement officer about your query. You should receive a follow-up soon.`;
    }

    await ChatAudit.create({
      userEmail: email,
      role,
      query: message,
      answer,
      intents: intents.concat(["rag_fallback"]),
      sources,
      escalated,
    });
    res.json({
      answer,
      type: "rag_fallback",
      sources,
      topScore,
      intents: intents.concat(["rag_fallback"]),
      escalated,
    });
  } catch (err) {
    console.error("/api/rag/chat error", err);
    res.status(500).json({ message: err.message || "Chat failed" });
  }
});

// Manual escalation endpoint
router.post("/escalate", auth, async (req, res) => {
  try {
    const { query, context } = req.body || {};
    const userDoc = req.user?._id
      ? await User.findById(req.user._id).select("email role")
      : null;
    const email = (userDoc?.email || "").toLowerCase();
    const role = userDoc?.role;

    if (!query) return res.status(400).json({ message: "Query required" });

    // Create notification for placement officer
    await Notification.create({
      toEmail: "placement@college.edu", // Configure in env
      title: `Manual escalation from ${role}`,
      message: `User ${email} requests assistance: "${query.slice(0, 150)}${
        query.length > 150 ? "..." : ""
      }"`,
      link: `/admin/chat-audit`,
      createdBy: email,
    });

    // Log audit
    await ChatAudit.create({
      userEmail: email,
      role,
      query,
      answer: "User manually escalated query to placement officer",
      intents: ["manual_escalation"],
      sources: [],
      escalated: true,
    });

    res.json({
      message:
        "Your query has been escalated to the placement officer. You'll receive a response soon.",
    });
  } catch (err) {
    console.error("/api/rag/escalate error", err);
    res.status(500).json({ message: "Escalation failed" });
  }
});

module.exports = router;
