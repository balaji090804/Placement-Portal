const express = require("express");
const { User, validate } = require("../models/user");
const bcrypt = require("bcrypt");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Route to Fetch Logged-in User Details
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password"); // Exclude password
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// ✅ Signup Route (User Registration)
router.post("/", async (req, res) => {
    try {
        const { error } = validate(req.body);
        if (error) return res.status(400).send({ message: error.details[0].message });

        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) return res.status(409).send({ message: "User already exists!" });

        // Hash password before saving
        const salt = await bcrypt.genSalt(Number(process.env.SALT || 10));
        const hashPassword = await bcrypt.hash(req.body.password, salt);

        const newUser = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hashPassword,  // Store hashed password
            role: req.body.role,      // Store role
            Skills: req.body.Skills.split(",").map((s) => s.trim()), // Convert skills to array
        });

        await newUser.save();
        res.status(201).send({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error.message });
    }
});


// 📌 Fetch all faculties
router.get("/faculty", async (req, res) => {
    try {
      const faculties = await User.find({ role: "faculty" });
      res.json(faculties);
    } catch (error) {
      console.error("Error fetching faculties:", error);
      res.status(500).json({ message: "Error fetching faculties" });
    }
  });

// 📌 Fetch all students
router.get("/students", async (req, res) => {
    try {
        const students = await User.find({ role: "student" }, { firstName: 1, lastName: 1, email: 1, _id: 0 });
        res.json(students);
    } catch (error) {
        console.error("❌ Error fetching students:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});



module.exports = router;
