// models/StudentAnnouncement.js
const mongoose = require("mongoose");

const RoundSchema = new mongoose.Schema({
  roundType: String,
  roundTime: Date,
}, { _id: false });

const StudentAnnouncementSchema = new mongoose.Schema({
  facultyAnnouncementId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "FacultyAnnouncement", 
    required: true 
  },
  venue: { type: String },
  extraInfo: { type: String },
  prePlacementTalkVenue: { type: String },
  prePlacementTalkTime: { type: Date },
  alumniInteractionTime: { type: Date },
  rounds: { 
    type: [RoundSchema], 
    default: [] 
  },
  requiredItems: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

// Automatically update updatedAt before saving
StudentAnnouncementSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("StudentAnnouncement", StudentAnnouncementSchema);
