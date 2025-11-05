const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "faculty", "admin"], required: true },
  // Optional link to Firebase user id when using Firebase Authentication
  firebaseUid: { type: String, required: false },
  Skills: { type: [String], required: false },
});

// Generate JWT Token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { _id: this._id, role: this.role },
    process.env.JWTPRIVATEKEY,
    { expiresIn: "7d" }
  );
};

const User = mongoose.model("user", userSchema);

// Validation
const validate = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: passwordComplexity().required(),
    role: Joi.string().valid("student", "faculty", "admin").required(),
    // Skills required only for students; optional for others
    Skills: Joi.when("role", {
      is: "student",
      then: Joi.string().trim().required(),
      otherwise: Joi.string().allow("").optional(),
    }),
  });
  return schema.validate(data);
};

module.exports = { User, validate };
