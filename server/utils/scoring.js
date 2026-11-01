// server/utils/scoring.js
// Calculates the final score. Runs on the server only.

import { DIFFICULTY, POINTS_PER_CLUE, POINTS_PER_HINT } from "../config/difficulty.js";

// Formula:
//   Correct accusation:   base + (clues * 5) - (hints * 10)
//   Incorrect accusation: (clues * 5) - (hints * 10)   (no base score)
//   The score never goes below 0.
export function calculateScore({ difficulty, isCorrect, discoveredCount, hintsUsed }) {
  const rules = DIFFICULTY[difficulty];
  if (!rules) {
    throw new Error(`Unknown difficulty: ${difficulty}`);
  }

  const base = isCorrect ? rules.baseScore : 0;
  const cluePoints = discoveredCount * POINTS_PER_CLUE;
  const hintPenalty = hintsUsed * POINTS_PER_HINT;

  const total = Math.max(0, base + cluePoints - hintPenalty);

  // The Results page uses this breakdown to explain the score.
  return {
    finalScore: total,
    breakdown: { base, cluePoints, hintPenalty },
  };
}