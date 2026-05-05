import connectDB from "./mongo";

let dbConnected = false;

export async function ensureDbConnected() {
  if (dbConnected) return;
  await connectDB();
  dbConnected = true;
}

