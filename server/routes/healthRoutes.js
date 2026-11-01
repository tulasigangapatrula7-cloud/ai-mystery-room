// server/routes/healthRoutes.js
// Health check: tells you if the server and the database are working.

import { Router } from "express";
import { isDBConnected } from "../config/db.js";

const router = Router();

// GET /api/health
router.get("/", (req, res) => {
  const connected = isDBConnected();

  // 200 = everything is fine, 503 = the server is up but the database is not.
  res.status(connected ? 200 : 503).json({
    success: connected,
    data: {
      status: connected ? "ok" : "database_unavailable",
      database: connected ? "connected" : "disconnected",
    },
  });
});

export default router;