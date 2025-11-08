const mongoose = require("mongoose");

const ChatAuditSchema = new mongoose.Schema(
  {
    userEmail: { type: String, index: true },
    role: { type: String },
    query: { type: String, required: true },
    answer: { type: String },
    intents: [{ type: String }],
    sources: [
      {
        filename: String,
        chunkIndex: Number,
        score: Number,
        preview: String,
      },
    ],
    escalated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ChatAudit || mongoose.model("ChatAudit", ChatAuditSchema);
