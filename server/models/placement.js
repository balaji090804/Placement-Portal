const mongoose = require("mongoose");

const PlacementSchema = new mongoose.Schema({
    studentName: String,
    studentEmail: String,
    branch: String,
    company: String,
    jobRole: String,
    package: String,
    status: { type: String, enum: ["Placed", "Pending", "Rejected"], default: "Pending" },
    dateOfOffer: Date
});

module.exports = mongoose.model("Placement", PlacementSchema);
