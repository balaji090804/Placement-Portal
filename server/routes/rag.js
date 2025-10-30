const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const RagChunk = require("../models/RagChunk");
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

    const system = `You are a helpful assistant for a college placement portal.
Use only the provided sources to answer.
If the answer isn't in the sources, say you don't know.
Keep answers concise.
Important: Do NOT include citations, source IDs, file names, links, or any implementation details in your reply.`;

    const messages = [
      { role: "system", content: system },
      {
        role: "user",
        content: `Query: ${message}\n\nRelevant sources:\n${context}`,
      },
    ];

    // Gemini doesn't use the same chat format; build a single prompt
    const prompt = `${system}\n\nUser: ${message}\n\nRelevant sources (use for answering, but do not include citations in your reply):\n${context}`;
    const result = await gemini.generateContent(prompt);
    let answer =
      result && result.response && typeof result.response.text === "function"
        ? result.response.text()
        : "";
    // Strip any citation-like artifacts just in case the model adds them
    answer = answer
      .replace(/\s*\[S\d+(?:[^\]]*)\]/g, "") // remove [S1], [S1: filename], etc.
      .replace(/\s*\(S\d+\)/g, "") // remove (S1)
      .replace(/\s*Sources?:[\s\S]*$/i, "")
      .trim(); // drop trailing Sources sections
    const citations = scored.map((s, i) => ({
      index: i + 1,
      filename: s.metadata.filename,
      score: Number(s.score.toFixed(4)),
    }));

    res.json({ answer, citations });
  } catch (err) {
    console.error("/api/rag/chat error", err);
    res.status(500).json({ message: err.message || "Chat failed" });
  }
});

module.exports = router;
