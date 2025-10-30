const express = require("express");
const router = express.Router();

// Utility: POST JSON using global fetch (Node 18+) or https fallback
async function postJson(url, body, headers = {}) {
  if (typeof fetch === "function") {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // Fallback for older Node without fetch
  const https = require("https");
  const urlObj = new URL(url);
  const options = {
    method: "POST",
    hostname: urlObj.hostname,
    path: urlObj.pathname,
    headers: { "Content-Type": "application/json", ...headers },
  };

  const payload = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// GET /api/daily/leetcode - Today's LeetCode Daily Challenge
router.get("/leetcode", async (req, res) => {
  try {
    const query = `query questionOfToday {\n  activeDailyCodingChallengeQuestion {\n    date\n    link\n    question {\n      questionFrontendId\n      title\n      titleSlug\n      difficulty\n      acRate\n    }\n  }\n}`;

    const result = await postJson(
      "https://leetcode.com/graphql",
      { query },
      {
        Referer: "https://leetcode.com/",
        Origin: "https://leetcode.com",
        Accept: "application/json",
        "User-Agent": "Placement-Portal/1.0",
      }
    );

    const payload = result?.data?.activeDailyCodingChallengeQuestion;
    if (!payload) {
      return res
        .status(502)
        .json({ message: "Unable to fetch LeetCode daily challenge" });
    }

    const q = payload.question || {};
    // Normalize link to a full absolute URL pointing to LeetCode
    const linkPath =
      payload.link || (q.titleSlug ? `/problems/${q.titleSlug}/` : null);
    const fullLink = linkPath
      ? linkPath.startsWith("http")
        ? linkPath
        : `https://leetcode.com${linkPath}`
      : null;
    return res.json({
      provider: "leetcode",
      date: payload.date,
      title: q.title,
      difficulty: q.difficulty,
      acRate: q.acRate,
      questionId: q.questionFrontendId,
      slug: q.titleSlug,
      link: fullLink,
    });
  } catch (err) {
    console.error("LeetCode daily fetch error:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
