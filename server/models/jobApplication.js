const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema({
    studentName: { type: String, required: true },
    companyName: { type: String, required: true },
    jobRole: { type: String, required: true },
    appliedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
