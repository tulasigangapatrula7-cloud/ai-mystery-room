// server/models/Case.js
// The database "shape" of one mystery game (one document per game).

import mongoose from "mongoose";

const { Schema } = mongoose;

// A suspect. All of this is safe to show the player.
const suspectSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    motive: { type: String, required: true },
  },
  { _id: false }
);

// A clue. "description" is only shown after the player discovers it.
// "pointsTo" is the suspect the clue supports and is always private.
const clueSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    pointsTo: { type: String, required: true },
  },
  { _id: false }
);

// Evidence links a clue to the real culprit (shown only on the Results page).
const evidenceSchema = new Schema(
  {
    clueId: { type: String, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const caseSchema = new Schema(
  {
    // ----- Public game data -----
    title: { type: String, required: true },
    premise: { type: String, required: true },
    story: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    suspects: { type: [suspectSchema], required: true },
    clues: { type: [clueSchema], required: true },

    // Hints are revealed one at a time, so the full list is hidden by default.
    hints: { type: [String], required: true, select: false },

    // ----- PRIVATE solution (hidden from queries by default) -----
    culpritId: { type: String, required: true, select: false },
    solution: { type: String, required: true, select: false },
    explanation: { type: String, required: true, select: false },
    evidence: { type: [evidenceSchema], required: true, select: false },

    // ----- Player progress (always set by the server) -----
    discoveredClues: { type: [String], default: [] },
    hintsUsed: { type: Number, default: 0, min: 0 },

    // ----- Accusation and result -----
    accusation: {
      suspectId: { type: String },
      explanation: { type: String },
    },
    isCorrect: { type: Boolean },
    finalScore: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    completedAt: { type: Date },
  },
  // Adds createdAt and updatedAt automatically.
  { timestamps: true }
);

export default mongoose.model("Case", caseSchema);