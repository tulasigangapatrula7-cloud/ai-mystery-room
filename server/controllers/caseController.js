// server/controllers/caseController.js
// The game logic behind the 6 case endpoints.

import { z } from "zod";
import Case from "../models/Case.js";
import { generateMystery } from "../services/geminiService.js";
import { DIFFICULTY, DIFFICULTY_LEVELS } from "../config/difficulty.js";
import { calculateScore } from "../utils/scoring.js";
import { toSafeCase, toResult } from "../utils/serializers.js";
import { AppError } from "../utils/AppError.js";

// ---------- Validation rules ----------

const idSchema = z
  .string()
  .regex(/^[a-f0-9]{24}$/i, "That case ID is not valid.");

const gameItemIdSchema = z
  .string()
  .regex(/^[a-z0-9_-]{1,40}$/, "That ID is not valid.");

const createSchema = z.object({
  premise: z
    .string({
      required_error: "Please enter a mystery premise.",
      invalid_type_error: "The premise must be text.",
    })
    .trim()
    .min(10, "Your premise must be at least 10 characters long.")
    .max(300, "Your premise must be 300 characters or fewer."),
  difficulty: z.enum(DIFFICULTY_LEVELS, {
    errorMap: () => ({ message: "Difficulty must be easy, medium, or hard." }),
  }),
});

const accuseSchema = z.object({
  suspectId: gameItemIdSchema,
  explanation: z
    .string()
    .trim()
    .max(500, "Your explanation must be 500 characters or fewer.")
    .optional(),
});

// Checks a value and throws a friendly 400 error if it is wrong.
function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(400, "VALIDATION_ERROR", result.error.issues[0].message);
  }
  return result.data;
}

// Express 4 does not catch errors in async functions by itself.
// This wrapper sends them to the error handler.
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const notFound = () => new AppError(404, "CASE_NOT_FOUND", "That case could not be found.");
const alreadyCompleted = () =>
  new AppError(409, "CASE_COMPLETED", "This case is already solved.");
const changedMeanwhile = () =>
  new AppError(409, "CASE_CHANGED", "The case changed while you were acting. Please try again.");

// ---------- 1. POST /api/cases ----------

export const createCase = wrap(async (req, res) => {
  const { premise, difficulty } = parse(createSchema, req.body ?? {});

  // Gemini writes the mystery; it is already checked by Zod inside.
  const mystery = await generateMystery(premise, difficulty);

  const doc = await Case.create({ premise, difficulty, ...mystery });

  res.status(201).json({ success: true, data: toSafeCase(doc) });
});

// ---------- 2. GET /api/cases/:id ----------

export const getCase = wrap(async (req, res) => {
  const id = parse(idSchema, req.params.id);

  // "+hints" lets the serializer show hints the player already requested.
  const doc = await Case.findById(id).select("+hints");
  if (!doc) throw notFound();

  res.json({ success: true, data: toSafeCase(doc) });
});

// ---------- 3. POST /api/cases/:id/clues/:clueId/discover ----------

export const discoverClue = wrap(async (req, res) => {
  const id = parse(idSchema, req.params.id);
  const clueId = parse(gameItemIdSchema, req.params.clueId);

  const doc = await Case.findById(id);
  if (!doc) throw notFound();
  if (doc.status === "completed") throw alreadyCompleted();
  if (!doc.clues.some((clue) => clue.id === clueId)) {
    throw new AppError(404, "CLUE_NOT_FOUND", "That clue does not exist in this case.");
  }

  // Atomic update: it only succeeds if the clue is NOT already discovered.
  // Even two clicks at the same moment cannot add it twice.
  const updated = await Case.findOneAndUpdate(
    { _id: id, status: "active", discoveredClues: { $ne: clueId } },
    { $addToSet: { discoveredClues: clueId } },
    { new: true }
  ).select("+hints");

  const alreadyDiscovered = !updated;
  const current = updated || (await Case.findById(id).select("+hints"));
  if (!current) throw notFound();

  res.json({
    success: true,
    data: { ...toSafeCase(current), alreadyDiscovered },
  });
});

// ---------- 4. POST /api/cases/:id/hints ----------

export const requestHint = wrap(async (req, res) => {
  const id = parse(idSchema, req.params.id);

  const doc = await Case.findById(id).select("+hints");
  if (!doc) throw notFound();
  if (doc.status === "completed") throw alreadyCompleted();

  const limit = DIFFICULTY[doc.difficulty].hints;
  const index = doc.hintsUsed;

  if (index >= limit || index >= doc.hints.length) {
    throw new AppError(
      403,
      "HINT_LIMIT_REACHED",
      "You have used all of your hints for this case."
    );
  }

  // Atomic update: it only works if hintsUsed is still the same number we read,
  // so two quick requests cannot both get a hint past the limit.
  const updated = await Case.findOneAndUpdate(
    { _id: id, status: "active", hintsUsed: index },
    { $inc: { hintsUsed: 1 } },
    { new: true }
  ).select("+hints");
  if (!updated) throw changedMeanwhile();

  res.json({
    success: true,
    data: {
      hint: { index, text: doc.hints[index] },
      hintsUsed: updated.hintsUsed,
      hintsRemaining: limit - updated.hintsUsed,
      case: toSafeCase(updated),
    },
  });
});

// ---------- 5. POST /api/cases/:id/accuse ----------

export const accuseSuspect = wrap(async (req, res) => {
  const id = parse(idSchema, req.params.id);
  const { suspectId, explanation } = parse(accuseSchema, req.body ?? {});

  const doc = await Case.findById(id).select("+culpritId");
  if (!doc) throw notFound();
  if (doc.status === "completed") throw alreadyCompleted();

  // The suspect must belong to THIS case.
  if (!doc.suspects.some((suspect) => suspect.id === suspectId)) {
    throw new AppError(400, "INVALID_SUSPECT", "That suspect is not part of this case.");
  }

  const isCorrect = suspectId === doc.culpritId;
  const discoveredCount = new Set(doc.discoveredClues).size;

  // The score is calculated here, from numbers stored in the database.
  const { finalScore } = calculateScore({
    difficulty: doc.difficulty,
    isCorrect,
    discoveredCount,
    hintsUsed: doc.hintsUsed,
  });

  // Atomic update: only completes the case if it is still active and the
  // clue/hint counts have not changed since we calculated the score.
  const completed = await Case.findOneAndUpdate(
    {
      _id: id,
      status: "active",
      hintsUsed: doc.hintsUsed,
      discoveredClues: { $size: doc.discoveredClues.length },
    },
    {
      $set: {
        status: "completed",
        accusation: { suspectId, explanation: explanation || "" },
        isCorrect,
        finalScore,
        completedAt: new Date(),
      },
    },
    { new: true }
  );
  if (!completed) throw changedMeanwhile();

  res.json({
    success: true,
    data: { status: "completed", correct: isCorrect, finalScore },
  });
});

// ---------- 6. GET /api/cases/:id/result ----------

export const getResult = wrap(async (req, res) => {
  const id = parse(idSchema, req.params.id);

  // The only place where the private solution fields are loaded.
  const doc = await Case.findById(id).select("+culpritId +solution +explanation +evidence");
  if (!doc) throw notFound();

  if (doc.status !== "completed") {
    throw new AppError(
      403,
      "CASE_NOT_COMPLETED",
      "The solution stays hidden until you make your accusation."
    );
  }

  res.json({ success: true, data: toResult(doc) });
});