const mongoose = require("mongoose");

const RagChunkSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    embedding: { type: [Number], required: true, index: false },
    metadata: {
      filename: { type: String },
      mimeType: { type: String },
      size: { type: Number },
      chunkIndex: { type: Number },
      uploadedByEmail: { type: String },
      uploadedByRole: { type: String },
      visibility: { type: String, default: "all" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RagChunk", RagChunkSchema);
