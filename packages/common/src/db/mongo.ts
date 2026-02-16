import { connect } from "mongoose";
import dns from "dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is not defined");

  await connect(mongoUri, {
    dbName: process.env.MONGO_DB_NAME,
    serverSelectionTimeoutMS: 10000,
  });

  console.log("Connected to MongoDB");
};

export default connectDB;
