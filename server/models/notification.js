const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    toEmail: { type: String, index: true },
    title: { type: String, required: true },
    message: { type: String },
    link: { type: String },
    read: { type: Boolean, default: false, index: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
