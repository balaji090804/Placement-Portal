const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Gemini model resolution (same logic as RAG route)
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

// Initialize Gemini AI
async function getGeminiModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set in environment");
  const genAI = new GoogleGenerativeAI(key);
  const modelName = await resolveGeminiModelName();
  return genAI.getGenerativeModel({ model: modelName });
}

// POST /api/ats/score
// Analyzes a resume and provides an ATS score with feedback
router.post("/score", auth, async (req, res) => {
  try {
    const { resumeData } = req.body;

    if (!resumeData) {
      return res.status(400).json({ message: "Resume data is required." });
    }

    // Build resume text for AI analysis
    const resumeText = `
NAME: ${resumeData.name || "Not provided"}
EMAIL: ${resumeData.email || "Not provided"}
PHONE: ${resumeData.phone || "Not provided"}
LINKEDIN: ${resumeData.linkedin || "Not provided"}
GITHUB: ${resumeData.github || "Not provided"}

PROFESSIONAL SUMMARY:
${resumeData.summary || "Not provided"}

TECHNICAL SKILLS:
${resumeData.skills || "Not provided"}

PROFESSIONAL EXPERIENCE:
${resumeData.experience || "Not provided"}

PROJECTS:
${resumeData.projects || "Not provided"}

EDUCATION:
${resumeData.education || "Not provided"}

CERTIFICATIONS:
${resumeData.certifications || "Not provided"}
    `.trim();

    // Create AI prompt for ATS analysis
    const prompt = `You are an expert ATS (Applicant Tracking System) analyzer and career coach. Analyze the following resume and provide:

1. An ATS compatibility score out of 100 based on:
   - Keyword optimization and relevance
   - Formatting and structure clarity
   - Completeness of sections (contact info, summary, skills, experience, education)
   - Action verbs and quantifiable achievements
   - Professional presentation
   - Industry-standard terminology

2. Detailed feedback (2-3 paragraphs) explaining the score, highlighting:
   - What the resume does well
   - Critical gaps or weaknesses
   - Overall impression from an ATS perspective

3. 3-5 specific, actionable suggestions for improvement

Resume to analyze:
---
${resumeText}
---

Respond in this exact JSON format (no markdown, no code blocks, just valid JSON):
{
  "score": <number between 0-100>,
  "feedback": "<detailed feedback as a single string>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>", ...]
}`;

    const gemini = await getGeminiModel();
    const result = await gemini.generateContent(prompt);
    const responseText = result?.response?.text() || "";

    // Parse AI response
    let atsAnalysis;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = responseText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      atsAnalysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText);
      // Fallback response
      atsAnalysis = {
        score: 50,
        feedback:
          "Unable to generate detailed analysis at this time. Please ensure all resume sections are filled out completely.",
        suggestions: [
          "Add quantifiable achievements to your experience section",
          "Include relevant keywords from your target job descriptions",
          "Ensure all contact information is complete and professional",
        ],
      };
    }

    // Validate score
    if (
      typeof atsAnalysis.score !== "number" ||
      atsAnalysis.score < 0 ||
      atsAnalysis.score > 100
    ) {
      atsAnalysis.score = Math.max(
        0,
        Math.min(100, parseInt(atsAnalysis.score) || 50)
      );
    }

    res.json(atsAnalysis);
  } catch (error) {
    console.error("❌ Error in ATS scoring:", error);
    res.status(500).json({
      message: "Failed to analyze resume. Please try again later.",
      error: error.message,
    });
  }
});

module.exports = router;
