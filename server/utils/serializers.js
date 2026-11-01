// server/utils/serializers.js
// Builds the JSON the browser is allowed to see.
// Secrets (culprit, solution, explanation, evidence, hidden clue text,
// unrevealed hints, "pointsTo") are never copied into the active-game response.

import { DIFFICULTY } from "../config/difficulty.js";
import { calculateScore } from "./scoring.js";

// A suspect is public information.
function publicSuspect(suspect) {
  return {
    id: suspect.id,
    name: suspect.name,
    description: suspect.description,
    motive: suspect.motive,
  };
}

// ---------- Active game (before the accusation) ----------

export function toSafeCase(doc) {
  const rules = DIFFICULTY[doc.difficulty];
  const discovered = new Set(doc.discoveredClues || []);
  const hintsUsed = doc.hintsUsed || 0;

  // Only hints the player already requested. (doc.hints is hidden unless the
  // controller asked for it; if it is missing we simply show none.)
  const revealedHints = (doc.hints || [])
    .slice(0, hintsUsed)
    .map((text, index) => ({ index, text }));

  const clues = doc.clues.map((clue) => {
    const isFound = discovered.has(clue.id);
    const base = {
      id: clue.id,
      label: clue.label,
      location: clue.location,
      discovered: isFound,
    };
    // The clue text is only included once the player has discovered it.
    return isFound ? { ...base, description: clue.description } : base;
  });

  return {
    id: String(doc._id),
    title: doc.title,
    premise: doc.premise,
    story: doc.story,
    difficulty: doc.difficulty,
    status: doc.status,
    suspects: doc.suspects.map(publicSuspect),
    clues,
    revealedHints,
    progress: {
      totalClues: doc.clues.length,
      cluesDiscovered: clues.filter((c) => c.discovered).length,
      totalHints: rules.hints,
      hintsUsed,
      hintsRemaining: Math.max(0, rules.hints - hintsUsed),
    },
    createdAt: doc.createdAt,
  };
}

// ---------- Finished game (after the accusation) ----------

// The controller must only call this when doc.status === "completed".
export function toResult(doc) {
  const culprit = doc.suspects.find((s) => s.id === doc.culpritId);
  const accused = doc.suspects.find((s) => s.id === doc.accusation?.suspectId);
  const discovered = new Set(doc.discoveredClues || []);

  // Link each piece of evidence to its clue so the page can show the details.
  const evidence = (doc.evidence || []).map((item) => {
    const clue = doc.clues.find((c) => c.id === item.clueId);
    return {
      clueId: item.clueId,
      clueLabel: clue ? clue.label : "",
      clueDescription: clue ? clue.description : "",
      explanation: item.explanation,
      wasDiscovered: discovered.has(item.clueId),
    };
  });

  // Same numbers the server used when it saved the score.
  const { breakdown } = calculateScore({
    difficulty: doc.difficulty,
    isCorrect: Boolean(doc.isCorrect),
    discoveredCount: discovered.size,
    hintsUsed: doc.hintsUsed || 0,
  });

  return {
    id: String(doc._id),
    title: doc.title,
    difficulty: doc.difficulty,
    status: doc.status,
    isCorrect: Boolean(doc.isCorrect),
    culprit: culprit ? publicSuspect(culprit) : null,
    accusedSuspect: accused ? publicSuspect(accused) : null,
    playerExplanation: doc.accusation?.explanation || "",
    solution: doc.solution,
    explanation: doc.explanation,
    evidence,
    cluesDiscovered: discovered.size,
    totalClues: doc.clues.length,
    hintsUsed: doc.hintsUsed || 0,
    finalScore: doc.finalScore,
    scoreBreakdown: breakdown,
    completedAt: doc.completedAt,
  };
}