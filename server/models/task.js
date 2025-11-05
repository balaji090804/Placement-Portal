const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    studentEmail: { type: String, required: true, index: true },
    text: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    dueDate: { type: Date },
    assignedBy: { type: String }, // optional: faculty/admin email or name
  },
  { timestamps: true }
);

module.exports = mongoose.models.Task || mongoose.model("Task", TaskSchema);
