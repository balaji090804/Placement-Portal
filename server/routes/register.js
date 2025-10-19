const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.post('/register', async (req, res) => {
  try {
    let { companyName, studentName, jobRole } = req.body;

    if (!companyName || !studentName || !jobRole) {
      return res.status(400).json({ message: 'Company name, student name, and job role are required.' });
    }

    // Trim inputs
    companyName = companyName.trim();
    studentName = studentName.trim();
    jobRole = jobRole.trim();

    // Remove trailing 's' from companyName if present
    if (companyName.endsWith('s')) {
      companyName = companyName.slice(0, -1);
    }

    // Normalize company name to a safe collection name (e.g., "Tech Corp" -> "tech_corp")
    const safeCollectionName = companyName.replace(/\s+/g, '_').toLowerCase();

    // Define a registration schema including the job role field
    const RegistrationSchema = new mongoose.Schema({
      studentName: { type: String, required: true },
      jobRole: { type: String, required: true },
      registeredAt: { type: Date, default: Date.now }
    });

    // Retrieve or create the dynamic model using the safe collection name.
    // The third parameter forces Mongoose to use the provided collection name exactly.
    let RegistrationModel;
    try {
      RegistrationModel = mongoose.model(safeCollectionName);
    } catch (error) {
      RegistrationModel = mongoose.model(safeCollectionName, RegistrationSchema, safeCollectionName);
    }

    // Check if this student has already registered for this job role at the company
    const existingRegistration = await RegistrationModel.findOne({ studentName, jobRole });
    if (existingRegistration) {
      return res.status(400).json({ message: 'Student has already registered for this job role at this company.' });
    }

    // Insert the student's registration into the company-specific collection
    const registration = new RegistrationModel({ studentName, jobRole });
    await registration.save();

    res.json({ message: 'Student registered successfully' });
  } catch (error) {
    console.error('Error registering student:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;
