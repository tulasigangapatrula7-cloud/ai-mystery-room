// server/server.js
// Main entry point: sets up Express, security, CORS, routes, and the database.

import "dotenv/config"; // loads values from server/.env
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { connectDB } from "./config/db.js";
import healthRoutes from "./routes/healthRoutes.js";
import caseRoutes from "./routes/caseRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

// Needed on hosts like Render, which sit behind a proxy.
app.set("trust proxy", 1);

// ----- Security headers -----
app.use(helmet());

// ----- CORS: only your own frontend may call this API -----
const allowedOrigins = [];
if (process.env.CLIENT_URL) {
  // Remove a trailing slash if you accidentally typed one.
  allowedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, ""));
}
if (!isProduction) {
  allowedOrigins.push("http://localhost:5173");
}

app.use(
  cors({
    origin(origin, callback) {
      // No origin = direct visit in the browser or a tool like curl. Allow it.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("This website is not allowed to use the API."));
    },
  })
);

// ----- Read JSON request bodies (small limit for safety) -----
app.use(express.json({ limit: "20kb" }));

// ----- Routes -----
app.get("/", (req, res) => {
  res.json({ success: true, data: { message: "AI Mystery Room API is running." } });
});
app.use("/api/health", healthRoutes);
app.use("/api/cases", caseRoutes);

// ----- Errors (must come after the routes) -----
app.use(notFound);
app.use(errorHandler);

// ----- Start: connect to the database first, then listen -----
async function start() {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Warning: GEMINI_API_KEY is missing in server/.env");
  }

  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    // Show the reason but never the connection string or password.
    console.error("Could not start the server:", error.message);
    process.exit(1);
  }
}

start();