const express = require("express");
const router = express.Router();

const StudentSelection = require("../models/StudentSelection");
const Offer = require("../models/offer");
const Drive = require("../models/drive");

// GET /api/tracking/placements
// Aggregates round progress (StudentSelection), drive status (Drive), and offers (Offer)
router.get("/placements", async (req, res) => {
  try {
    const [selections, offers, drives] = await Promise.all([
      StudentSelection.find({}).sort({ createdAt: 1 }).lean(),
      Offer.find({}).lean(),
      Drive.find({ archived: { $ne: true } }).lean(),
    ]);

    // Index offers by composite key: company + role + studentEmail
    const offerIndex = new Map();
    for (const o of offers) {
      const key = `${(o.companyName || "").toLowerCase()}__${(o.roleTitle || "").toLowerCase()}__${(o.studentEmail || "").toLowerCase()}`;
      offerIndex.set(key, o);
    }

    // Index drives by composite key: company + role
    const driveIndex = new Map();
    for (const d of drives) {
      const key = `${(d.companyName || "").toLowerCase()}__${(d.roleTitle || "").toLowerCase()}`;
      driveIndex.set(key, d);
    }

    // Group selections
    const groupMap = new Map();
    for (const rec of selections) {
      const gkey = `${(rec.companyName || "").toLowerCase()}__${(rec.jobRole || "").toLowerCase()}`;
      if (!groupMap.has(gkey)) {
        const drv = driveIndex.get(gkey);
        groupMap.set(gkey, {
          companyName: rec.companyName,
          jobRole: rec.jobRole,
          driveStatus: drv?.status || "Published",
          students: [],
        });
      }
      const grp = groupMap.get(gkey);
      let stu = grp.students.find((s) => s.studentEmail === rec.studentEmail);
      if (!stu) {
        const okey = `${(rec.companyName || "").toLowerCase()}__${(rec.jobRole || "").toLowerCase()}__${(rec.studentEmail || "").toLowerCase()}`;
        const o = offerIndex.get(okey);
        stu = {
          studentName: rec.studentName,
          studentEmail: rec.studentEmail,
          offerStatus: o?.status || null,
          offerCTC: o?.ctc || null,
          rounds: [],
        };
        grp.students.push(stu);
      }
      stu.rounds.push({
        roundNumber: rec.roundNumber,
        venue: rec.nextRoundVenue,
        time: rec.nextRoundTime,
      });
    }

    // Sort rounds and compute lastRound
    const out = Array.from(groupMap.values()).map((g) => {
      g.students.forEach((s) => {
        s.rounds.sort((a, b) => a.roundNumber - b.roundNumber);
        s.lastRound = s.rounds.length ? s.rounds[s.rounds.length - 1].roundNumber : 0;
      });
      return g;
    });

    res.json({ groups: out });
  } catch (e) {
    console.error("tracking placements error:", e);
    res.status(500).json({ message: "Failed to load tracking data" });
  }
});

module.exports = router;


