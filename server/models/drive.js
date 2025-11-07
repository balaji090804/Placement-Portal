const mongoose = require("mongoose");

const DRIVE_STATUSES = [
  "Draft",
  "Published",
  "ApplicationsOpen",
  "Shortlisting",
  "Interviews",
  "Offers",
  "Closed",
];

const DriveSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    companyName: { type: String, required: true },
    roleTitle: { type: String, required: true },
    description: { type: String },
    eligibilityRules: {
      cgpaMin: { type: Number },
      backlogsAllowed: { type: Number, default: 0 },
      branchesAllowed: [{ type: String }],
      skillsRequired: [{ type: String }],
    },
    status: {
      type: String,
      enum: DRIVE_STATUSES,
      default: "Draft",
      index: true,
    },
    statusTimestamps: {
      Draft: { type: Date, default: Date.now },
      Published: { type: Date },
      ApplicationsOpen: { type: Date },
      Shortlisting: { type: Date },
      Interviews: { type: Date },
      Offers: { type: Date },
      Closed: { type: Date },
    },
    applicationWindow: {
      opensAt: { type: Date },
      closesAt: { type: Date },
    },
    interviewWindow: {
      startsAt: { type: Date },
      endsAt: { type: Date },
    },
    offerReleaseAt: { type: Date },
    createdBy: { type: String }, // admin/faculty email
    updatedBy: { type: String },
    archived: { type: Boolean, default: false },
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

// Text index for search
DriveSchema.index({
  title: "text",
  companyName: "text",
  roleTitle: "text",
  description: "text",
});

module.exports = mongoose.models.Drive || mongoose.model("Drive", DriveSchema);
module.exports.DRIVE_STATUSES = DRIVE_STATUSES;
