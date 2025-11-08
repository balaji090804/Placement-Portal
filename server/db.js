const mongoose = require("mongoose");

// Robust connection with retry/backoff and saner timeouts
module.exports = async () => {
  mongoose.set("strictQuery", false);

  const uri = process.env.DB || process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      "❌ Database connection failed: DB (or MONGODB_URI) env var is missing"
    );
    process.exit(1);
  }

  const MAX_RETRIES = parseInt(process.env.MONGO_MAX_RETRIES || "8", 10);
  const BASE_DELAY = parseInt(
    process.env.MONGO_RETRY_BASE_DELAY_MS || "1500",
    10
  );

  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    try {
      await mongoose.connect(uri, {
        // Note: useNewUrlParser / useUnifiedTopology are no-ops in Mongoose 6+, but harmless
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: parseInt(
          process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || "10000",
          10
        ),
        connectTimeoutMS: parseInt(
          process.env.MONGO_CONNECT_TIMEOUT_MS || "10000",
          10
        ),
        socketTimeoutMS: parseInt(
          process.env.MONGO_SOCKET_TIMEOUT_MS || "45000",
          10
        ),
        retryWrites: true,
      });
      console.log("✅ Connected to database successfully");

      // Helpful runtime logging
      mongoose.connection.on("disconnected", () => {
        console.warn(
          "⚠️  MongoDB disconnected. Will attempt to reconnect on next request."
        );
      });
      mongoose.connection.on("error", (err) => {
        console.error("MongoDB error:", err.message);
      });
      return; // success
    } catch (error) {
      attempt += 1;
      const isLast = attempt > MAX_RETRIES;
      const delay = Math.min(BASE_DELAY * Math.pow(2, attempt - 1), 15000);
      console.error(
        `❌ Database connection failed (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`
      );

      if (/ENOTFOUND|EAI_AGAIN/i.test(error.message)) {
        console.error(
          "Hint: DNS could not resolve your MongoDB Atlas host.\n- Check that your connection string uses the SRV form (mongodb+srv://...).\n- Verify your internet/DNS works (try switching to a public DNS like 8.8.8.8).\n- Confirm the cluster hostname is correct (copy from Atlas) and your IP is allowed in Atlas Network Access."
        );
      }

      // Common guidance for Atlas SRV DNS timeouts
      if (/querySrv ETIMEOUT/i.test(error.message)) {
        console.error(
          "Hint: Atlas SRV lookup timed out. Ensure internet/DNS works, your IP is allowed in Atlas Network Access, or use a non-SRV URI (mongodb://host:27017) if SRV is blocked."
        );
      }

      if (isLast) {
        console.error("🚫 Giving up after maximum retries. Exiting.");
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }
};
