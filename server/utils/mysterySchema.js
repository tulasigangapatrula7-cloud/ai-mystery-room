// server/utils/mysterySchema.js
// Zod rules that every AI-generated mystery must pass before it is saved.

import { z } from "zod";
import { DIFFICULTY } from "../config/difficulty.js";

// How many clues must point to the real culprit, per difficulty.
// The other clues can be red herrings that point to other suspects.
const MIN_SUPPORTING_CLUES = { easy: 3, medium: 4, hard: 5 };

// IDs look like "s1" or "c3": lowercase letters, numbers, "_" or "-".
const idRule = z
  .string()
  .trim()
  .regex(/^[a-z0-9_-]{1,40}$/, "IDs may only use lowercase letters, numbers, _ and -");

const text = (max) => z.string().trim().min(1, "Text cannot be empty").max(max);

const suspectSchema = z.object({
  id: idRule,
  name: text(80),
  description: text(600),
  motive: text(600),
});

const clueSchema = z.object({
  id: idRule,
  label: text(120),
  location: text(160),
  description: text(800),
  pointsTo: idRule,
});

const evidenceSchema = z.object({
  clueId: idRule,
  explanation: text(800),
});

// Build the rules for one difficulty level (easy, medium, or hard).
export function buildMysterySchema(difficulty) {
  const rules = DIFFICULTY[difficulty];

  return z
    .object({
      title: text(120),
      story: text(3500),
      suspects: z.array(suspectSchema),
      clues: z.array(clueSchema),
      hints: z.array(text(400)),
      culpritId: idRule,
      solution: text(2000),
      explanation: text(2500),
      evidence: z.array(evidenceSchema),
    })
    .superRefine((data, ctx) => {
      const problem = (message, path) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, message, path });

      // 1. Exact counts for this difficulty.
      if (data.suspects.length !== rules.suspects) {
        problem(`Need exactly ${rules.suspects} suspects, got ${data.suspects.length}`, ["suspects"]);
      }
      if (data.clues.length !== rules.clues) {
        problem(`Need exactly ${rules.clues} clues, got ${data.clues.length}`, ["clues"]);
      }
      if (data.hints.length !== rules.hints) {
        problem(`Need exactly ${rules.hints} hints, got ${data.hints.length}`, ["hints"]);
      }

      // 2. IDs must be unique.
      const suspectIds = data.suspects.map((s) => s.id);
      const clueIds = data.clues.map((c) => c.id);
      if (new Set(suspectIds).size !== suspectIds.length) {
        problem("Suspect IDs must be unique", ["suspects"]);
      }
      if (new Set(clueIds).size !== clueIds.length) {
        problem("Clue IDs must be unique", ["clues"]);
      }

      // 3. Exactly one culprit, and that suspect must exist.
      if (!suspectIds.includes(data.culpritId)) {
        problem("culpritId must match one of the suspect IDs", ["culpritId"]);
      }

      // 4. Every clue must point to a real suspect.
      data.clues.forEach((clue, i) => {
        if (!suspectIds.includes(clue.pointsTo)) {
          problem(`Clue "${clue.id}" points to an unknown suspect`, ["clues", i, "pointsTo"]);
        }
      });

      // 5. Evidence must use real, different clues.
      const evidenceIds = data.evidence.map((e) => e.clueId);
      data.evidence.forEach((item, i) => {
        if (!clueIds.includes(item.clueId)) {
          problem(`Evidence uses an unknown clue "${item.clueId}"`, ["evidence", i, "clueId"]);
        }
      });
      if (new Set(evidenceIds).size !== evidenceIds.length) {
        problem("Each clue can appear in the evidence list only once", ["evidence"]);
      }

      // 6. The mystery must be solvable: enough clues must support the culprit.
      const needed = MIN_SUPPORTING_CLUES[difficulty];
      const supporting = data.clues.filter((c) => c.pointsTo === data.culpritId);
      if (supporting.length < needed) {
        problem(
          `At least ${needed} clues must point to the culprit, got ${supporting.length}`,
          ["clues"]
        );
      }
      // Every piece of evidence should be a clue that points to the culprit.
      data.evidence.forEach((item, i) => {
        const clue = data.clues.find((c) => c.id === item.clueId);
        if (clue && clue.pointsTo !== data.culpritId) {
          problem(`Evidence clue "${item.clueId}" does not point to the culprit`, ["evidence", i, "clueId"]);
        }
      });
      if (data.evidence.length < needed) {
        problem(`At least ${needed} evidence entries are needed`, ["evidence"]);
      }

      // 7. Hints must not give the culprit away by name.
      const culprit = data.suspects.find((s) => s.id === data.culpritId);
      if (culprit) {
        const culpritName = culprit.name.toLowerCase();
        data.hints.forEach((hint, i) => {
          if (hint.toLowerCase().includes(culpritName)) {
            problem("A hint names the culprit directly", ["hints", i]);
          }
        });
      }
    });
}

// Turns a Zod error into short text. We send this back to Gemini on a retry
// so it knows exactly what to fix.
export function summarizeZodError(error) {
  return error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`)
    .join("; ");
}