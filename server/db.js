const mongoose = require("mongoose");

module.exports = async () => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(process.env.DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to database successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1); // stop app if DB connection fails
  }
};
