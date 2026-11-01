// server/routes/caseRoutes.js
// Connects each URL to its function in the controller.
// All of these are under /api/cases (set in server.js).

import { Router } from "express";
import {
  createCase,
  getCase,
  discoverClue,
  requestHint,
  accuseSuspect,
  getResult,
} from "../controllers/caseController.js";
import { createCaseLimiter, generalLimiter } from "../middleware/rateLimiters.js";

const router = Router();

// Every route below gets the general limit.
router.use(generalLimiter);

// POST /api/cases                              -> create a mystery (strict limit)
router.post("/", createCaseLimiter, createCase);

// GET  /api/cases/:id                          -> load the active game
router.get("/:id", getCase);

// POST /api/cases/:id/clues/:clueId/discover   -> discover a clue
router.post("/:id/clues/:clueId/discover", discoverClue);

// POST /api/cases/:id/hints                    -> request the next hint
router.post("/:id/hints", requestHint);

// POST /api/cases/:id/accuse                   -> accuse a suspect
router.post("/:id/accuse", accuseSuspect);

// GET  /api/cases/:id/result                   -> see the solution (after accusing)
router.get("/:id/result", getResult);

export default router;