const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema({
    facultyEmail: { type: String, required: true },
    studentEmail: { type: String, required: true },
    assignedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Assignment", AssignmentSchema);
