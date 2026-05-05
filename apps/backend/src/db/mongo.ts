import { setServers } from "dns";
import mongoose, { connect } from "mongoose";

// Global dns.setServers([public DNS only]) breaks Docker's 127.0.0.11 resolver
// (ENOTFOUND for `redis`, `mongo1`, etc.). Optional: MONGO_DNS_SERVERS=1.1.1.1,8.8.8.8

const mongoDns = process.env.MONGO_DNS_SERVERS?.trim();
if (mongoDns) {
  setServers(
    mongoDns
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is not defined");

  await connect(mongoUri, {
    dbName: process.env.MONGO_DB_NAME,
    serverSelectionTimeoutMS: 10000,
    /** Keep long-lived Docker connections alive; driver will probe and reconnect after drops. */
    heartbeatFrequencyMS: 10_000,
    socketTimeoutMS: 120_000,
    maxPoolSize: 10,
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[mongo] disconnected — driver will retry if possible");
  });
  mongoose.connection.on("reconnected", () => {
    console.log("[mongo] reconnected");
  });

  console.log("Connected to MongoDB");
};

export default connectDB;
