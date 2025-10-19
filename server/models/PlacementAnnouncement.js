// models/PlacementAnnouncement.js
const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema({
  roundType: String,
  roundTime: Date
}, { _id: false });

const placementAnnouncementSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  jobRole: { type: String, required: true },
  dateTime: { type: Date, required: true },
  venue: { type: String },
  prePlacementTalkVenue: { type: String },
  prePlacementTalkTime: { type: Date },
  alumniInteractionTime: { type: Date },
  rounds: {
    type: [roundSchema],
    default: []
  },
  requiredItems: { type: String },
  extraInfo: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PlacementAnnouncement", placementAnnouncementSchema);
