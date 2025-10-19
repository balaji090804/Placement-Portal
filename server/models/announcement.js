const mongoose = require("mongoose");

const AnnouncementSchema = new mongoose.Schema({
    recipientEmail: { type: String, required: true }, // Student or Faculty Email
    message: { type: String, required: true },
    type: { type: String, enum: ["faculty", "student"], required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Announcement", AnnouncementSchema);
