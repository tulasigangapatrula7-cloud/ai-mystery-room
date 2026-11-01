// server/config/difficulty.js
// The single source of truth for difficulty rules.

export const DIFFICULTY = {
  easy: { suspects: 3, clues: 5, hints: 2, baseScore: 100 },
  medium: { suspects: 4, clues: 7, hints: 3, baseScore: 150 },
  hard: { suspects: 5, clues: 9, hints: 3, baseScore: 200 },
};

// ["easy", "medium", "hard"]
export const DIFFICULTY_LEVELS = Object.keys(DIFFICULTY);

// Scoring numbers from the project requirements.
export const POINTS_PER_CLUE = 5;
export const POINTS_PER_HINT = 10;