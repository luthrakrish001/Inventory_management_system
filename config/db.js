const mongoose = require("mongoose");
require("dotenv").config();
/**
 * Connect to MongoDB Atlas
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb+srv://vasuaneja14_db_user:vasu123@cluster0.lf8b6ai.mongodb.net/";

  if (!uri || uri.includes("<username>") || uri.includes("<password>")) {
    console.warn("==================================================================");
    console.warn("⚠️  WARNING: MongoDB Atlas URI contains placeholder credentials!");
    console.warn("👉 Please update MONGODB_URI in your .env file with your real MongoDB Atlas connection string.");
    console.warn("   Example: mongodb+srv://username:password@cluster.mongodb.net/inventorypilot");
    console.warn("==================================================================");
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: "inventorypilot",
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    });

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host} [DB: ${conn.connection.name}]`);
  } catch (error) {
    console.error(`❌ MongoDB Atlas Connection Error: ${error.message}`);
    console.error("Common Atlas connection issues:");
    console.error("  1. Network Access: Ensure your IP address is whitelisted in MongoDB Atlas Network Access (or set to 0.0.0.0/0 for dev).");
    console.error("  2. Database Access: Ensure your database user credentials (username and password) are correct.");
    console.error("  3. Connection String: Ensure the format starts with mongodb+srv://");
    // Do not terminate process in development so server can still serve health check / static files
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("⚠️  MongoDB disconnected.");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 MongoDB reconnected.");
});

module.exports = connectDB;
