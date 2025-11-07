const mongoose = require("mongoose");

const InterviewSlotSchema = new mongoose.Schema(
  {
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drive",
      required: true,
      index: true,
    },
    slotStart: { type: Date, required: true },
    slotEnd: { type: Date, required: true },
    capacity: { type: Number, default: 1 },
    bookedEmails: [{ type: String }],
    notes: { type: String },
    createdBy: { type: String },
  },
  { timestamps: true }
);

InterviewSlotSchema.virtual("remaining").get(function () {
  const used = (this.bookedEmails || []).length;
  return Math.max(0, (this.capacity || 0) - used);
});

module.exports =
  mongoose.models.InterviewSlot ||
  mongoose.model("InterviewSlot", InterviewSlotSchema);
