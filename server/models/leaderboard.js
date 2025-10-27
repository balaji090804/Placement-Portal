const mongoose = require("mongoose");

const LeaderboardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  score: { type: Number, required: true, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Leaderboard", LeaderboardSchema);
