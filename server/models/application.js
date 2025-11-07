const mongoose = require("mongoose");

// Expanded, superset-style application lifecycle
const STATUSES = [
  // Eligibility & application
  "Eligible",
  "Applied",
  // Shortlist
  "Shortlisted",
  "Rejected",
  // Assessments
  "TestScheduled",
  "TestDone",
  "TestPass",
  "TestFail",
  // Interviews (multi-round)
  "IntR1Scheduled",
  "IntR1Done",
  "IntR1Pass",
  "IntR1Fail",
  "IntR2Scheduled",
  "IntR2Done",
  "IntR2Pass",
  "IntR2Fail",
  // Offer
  "Offered",
  "OfferAccepted",
  "OfferDeclined",
  // Final
  "Joined",
];

const ApplicationSchema = new mongoose.Schema(
  {
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drive",
      required: true,
      index: true,
    },
    studentEmail: { type: String, required: true, index: true },
    studentName: { type: String },
    status: { type: String, enum: STATUSES, default: "Applied", index: true },
    resumeUrl: { type: String },
    notes: { type: String },
    history: [
      {
        at: { type: Date, default: Date.now },
        by: { type: String },
        action: { type: String },
        meta: { type: Object },
      },
    ],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Application ||
  mongoose.model("Application", ApplicationSchema);
module.exports.STATUSES = STATUSES;
