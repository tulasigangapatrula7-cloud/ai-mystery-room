// server/config/db.js
// Connects the backend to MongoDB Atlas using Mongoose.

import dns from "node:dns";
import mongoose from "mongoose";

// Some home networks block the DNS lookup that Atlas ("mongodb+srv") needs.
// On your own laptop only, use public DNS servers instead. This is skipped in production.
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

// Call this once when the server starts.
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  // Stop early with a clear message if the .env value is missing.
  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing. Add it to server/.env (see .env.example)."
    );
  }

  // Give up after 10 seconds instead of waiting forever.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  // Only prints the database name, never the password.
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}

// The health-check endpoint uses this to report the database status.
export function isDBConnected() {
  return mongoose.connection.readyState === 1;
}