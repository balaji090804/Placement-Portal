const mongoose = require("mongoose");

const OfferSchema = new mongoose.Schema(
  {
    studentEmail: { type: String, required: true, index: true },
    studentName: { type: String },
    companyName: { type: String, required: true },
    roleTitle: { type: String, required: true },
    ctc: { type: String },
    status: {
      type: String,
      enum: ["Draft", "Released", "Accepted", "Declined", "Expired"],
      default: "Draft",
      index: true,
    },
    releaseDate: { type: Date },
    acceptBy: { type: Date },
    acceptedAt: { type: Date },
    declinedAt: { type: Date },
    notes: { type: String },
    createdBy: { type: String },
    updatedBy: { type: String },
    history: [
      {
        at: { type: Date, default: Date.now },
        by: String,
        action: String,
        meta: Object,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Offer || mongoose.model("Offer", OfferSchema);
