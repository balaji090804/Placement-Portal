const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { User } = require("../models/user");
const Offer = require("../models/offer");
const Notification = require("../models/notification");
const { recordPerformanceEvent } = require("../utils/performanceEvent");

function role(req) {
  return req.actor?.role;
}
async function loadActor(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select(
      "email role firstName lastName"
    );
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    req.actor = user;
    next();
  } catch {
    return res.status(500).json({ message: "Auth failed" });
  }
}

// List offers (admin/faculty: all, student: own)
router.get("/", auth, loadActor, async (req, res) => {
  try {
    let filter = {};
    if (role(req) === "student") filter.studentEmail = req.actor.email;
    const items = await Offer.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Failed to list offers" });
  }
});

// Create/Release offer (admin/faculty)
router.post("/", auth, loadActor, async (req, res) => {
  if (!["admin", "faculty"].includes(role(req)))
    return res.status(403).json({ message: "Forbidden" });
  try {
    const payload = req.body || {};
    const offer = await Offer.create({
      ...payload,
      createdBy: req.actor.email,
      history: [
        {
          by: req.actor.email,
          action: "create",
          meta: { status: payload.status || "Draft" },
        },
      ],
    });
    if (offer.status === "Released") {
      try {
        await Notification.create({
          toEmail: offer.studentEmail,
          title: "Offer Released",
          message: `An offer has been released for ${
            offer.companyName || "a role"
          }.`,
          link: "/StudentDashboard/Offers",
          createdBy: req.actor.email,
        });
      } catch {}
    }
    res.status(201).json(offer);
  } catch (e) {
    res.status(500).json({ message: "Failed to create offer" });
  }
});

// Update offer (admin/faculty)
router.put("/:id", auth, loadActor, async (req, res) => {
  if (!["admin", "faculty"].includes(role(req)))
    return res.status(403).json({ message: "Forbidden" });
  try {
    const prev = await Offer.findById(req.params.id);
    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      {
        $set: { ...req.body, updatedBy: req.actor.email },
        $push: {
          history: {
            by: req.actor.email,
            action: "update",
            meta: { to: req.body?.status },
          },
        },
      },
      { new: true }
    );
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    if (prev && prev.status !== "Released" && offer.status === "Released") {
      try {
        await Notification.create({
          toEmail: offer.studentEmail,
          title: "Offer Released",
          message: `An offer has been released for ${
            offer.companyName || "a role"
          }.`,
          link: "/StudentDashboard/Offers",
          createdBy: req.actor.email,
        });
      } catch {}
    }
    res.json(offer);
  } catch (e) {
    res.status(500).json({ message: "Failed to update offer" });
  }
});

// Student accepts offer
router.post("/:id/accept", auth, loadActor, async (req, res) => {
  if (role(req) !== "student")
    return res.status(403).json({ message: "Forbidden" });
  try {
    const offer = await Offer.findOne({
      _id: req.params.id,
      studentEmail: req.actor.email,
    });
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    offer.status = "Accepted";
    offer.acceptedAt = new Date();
    offer.history = offer.history || [];
    offer.history.push({
      by: req.actor.email,
      action: "accept",
      meta: { status: "Accepted" },
      at: new Date(),
    });
    try {
      await Notification.create({
        toEmail: offer.studentEmail,
        title: "Offer Accepted",
        message: "You accepted your offer.",
        link: "/StudentDashboard/Offers",
        createdBy: req.actor.email,
      });
    } catch {}
    await offer.save();
    await recordPerformanceEvent(req.app, offer.studentEmail, "offerAccepted", {
      offerId: String(offer._id),
      companyName: offer.companyName,
      roleTitle: offer.roleTitle,
    });
    res.json(offer);
  } catch (e) {
    res.status(500).json({ message: "Failed to accept" });
  }
});

// Student declines offer
router.post("/:id/decline", auth, loadActor, async (req, res) => {
  if (role(req) !== "student")
    return res.status(403).json({ message: "Forbidden" });
  try {
    const offer = await Offer.findOne({
      _id: req.params.id,
      studentEmail: req.actor.email,
    });
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    offer.status = "Declined";
    offer.declinedAt = new Date();
    offer.history = offer.history || [];
    offer.history.push({
      by: req.actor.email,
      action: "decline",
      meta: { status: "Declined" },
      at: new Date(),
    });
    try {
      await Notification.create({
        toEmail: offer.studentEmail,
        title: "Offer Declined",
        message: "You declined your offer.",
        link: "/StudentDashboard/Offers",
        createdBy: req.actor.email,
      });
    } catch {}
    // Record performance event for real-time tracker and counters
    try {
      await recordPerformanceEvent(
        req.app,
        offer.studentEmail,
        "offerAccepted",
        {
          companyName: offer.companyName,
          roleTitle: offer.roleTitle,
        }
      );
    } catch {}
    await offer.save();
    await recordPerformanceEvent(req.app, offer.studentEmail, "offerDeclined", {
      offerId: String(offer._id),
      companyName: offer.companyName,
      roleTitle: offer.roleTitle,
    });
    res.json(offer);
  } catch (e) {
    res.status(500).json({ message: "Failed to decline" });
  }
});

module.exports = router;
