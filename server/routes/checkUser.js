const express = require("express");
const bcrypt = require("bcrypt");
const { User } = require("../models/user");
const router = express.Router();

// POST /api/check-user
// Ensures a user exists in MongoDB for a signed-in Firebase user
// Body: { userId, email, name }
router.post("/check-user", async (req, res) => {
  try {
    const { userId, email, name } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Try to find by email
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user with defaults
      const fullName = (name || "").trim();
      const [firstName, ...rest] = fullName
        ? fullName.split(" ")
        : [email.split("@")[0]];
      const lastName = rest.join(" ") || "User";

      // Generate a random password; it's not used for Firebase users but required by schema
      const randomPass =
        Math.random().toString(36).slice(-12) + Date.now().toString(36);
      const salt = await bcrypt.genSalt(Number(process.env.SALT || 10));
      const hashPassword = await bcrypt.hash(randomPass, salt);

      user = new User({
        firstName: (firstName || "User").trim(),
        lastName: (lastName || "User").trim(),
        email,
        password: hashPassword,
        role: "student", // Default new Firebase users to student; admins/faculty should be pre-provisioned
        firebaseUid: userId || undefined,
        Skills: [],
      });
      await user.save();
    } else if (userId && !user.firebaseUid) {
      // Backfill firebaseUid for existing users
      user.firebaseUid = userId;
      await user.save();
    }

    // Issue existing app JWT so client can continue using ProtectedRoute and role-based redirects
    const token = user.generateAuthToken();

    return res.json({
      userId: user.firebaseUid || userId || String(user._id),
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(" "),
      role: user.role,
      token,
    });
  } catch (err) {
    console.error("/api/check-user error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
