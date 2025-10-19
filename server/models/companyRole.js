const mongoose = require("mongoose");

const AppliedStudentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true }
});

const CompanyRoleSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    jobRole: { type: String, required: true },
    appliedStudents: { type: [AppliedStudentSchema], default: [] } // ✅ Corrected: Now stores objects
});

module.exports = mongoose.model("CompanyRole", CompanyRoleSchema);
