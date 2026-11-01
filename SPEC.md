# SPEC.md — AI Mystery Room

Version 1.0 · Blueprint for implementation. Every later phase follows this file.

---

## 1. Project Overview

**AI Mystery Room** is an interactive detective game. A player types a premise (e.g. "A jewel theft at a masquerade ball"), picks a difficulty, and Google's Gemini AI generates a complete, logically consistent mystery. The player reads the story, inspects suspects, discovers clues, asks for hints, accuses a suspect, and sees a verdict, the full solution, and a score.

The whole game is a public website. Anyone with the link can play without installing anything.

## 2. Problem Statement

Mystery games are usually pre-written, so they can be replayed only once. Generating a mystery with AI gives unlimited fresh cases, but raw AI output can be inconsistent, can leak the answer, and can be tampered with if the game logic runs in the browser. This project solves that by:

- generating structured, validated mysteries on the server,
- keeping the culprit and solution private until the player accuses,
- calculating scores only on the server.

## 3. Target Users

- Casual players who enjoy puzzles and detective stories (all ages, teens and up).
- Players on phones, tablets, and desktops.
- No account or login required.

## 4. User Experience

- Mood: dark, cinematic, premium detective agency. Deep navy, black, charcoal, subtle gold accents.
- Typography: serif display font for headings (Playfair Display), clean sans-serif for body (Inter).
- Glassmorphism cards, soft gold glows, smooth fade/slide transitions.
- Loading indicators for every network action, empty states, clear error messages, toast notifications, confirmation dialogs for important actions (accusation, leaving a case).
- Accessibility: semantic HTML, visible focus rings, labelled form fields, sufficient contrast, keyboard-usable controls, `aria-live` for toasts and loading text.
- Responsive: mobile-first layout, tested at ~360px, ~768px, ~1280px.

## 5. Core Features

1. Create a mystery from a custom premise with example suggestions.
2. Three difficulty levels with fixed suspect, clue, and hint counts.
3. AI-generated, Zod-validated mysteries with one correct culprit.
4. Investigation Room: story, suspects, clue discovery, progress tracking.
5. Progressive hints with a limit.
6. Accusation with optional explanation and confirmation.
7. Results with verdict, culprit, full explanation, supporting evidence, and score.
8. Play Again to create a brand-new mystery.
9. Persistence in MongoDB Atlas; the current case ID is remembered in the browser so a refresh does not lose progress.

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 3, React Router DOM 6, Axios |
| Icons / motion | lucide-react, CSS transitions (no heavy animation library) |
| Backend | Node.js 20+, Express 4, Mongoose 8, Zod 3, `@google/genai` |
| Backend security | helmet, cors, express-rate-limit |
| Database | MongoDB Atlas (free M0 cluster) |
| Frontend hosting | Vercel |
| Backend hosting | Render (free web service tier) — chosen because it is beginner-friendly, supports Node, uses a `PORT` env var, and works with GitHub |
| Source control | GitHub |

Exact package versions are pinned in each `package.json` when created. The Gemini model name is read from an optional env var `GEMINI_MODEL` (default set in code) so it can be changed without editing code if Google retires a model.

## 7. Page Specifications

Routes (React Router):

| Route | Page |
|---|---|
| `/` | Home |
| `/create` | Create Mystery |
| `/case/:id` | Investigation Room |
| `/case/:id/accuse` | Accusation |
| `/case/:id/result` | Results |
| `*` | Not Found (with link home) |

### A. Home (`/`)
- Hero with app name, tagline, and **Start Mystery** button → `/create`.
- Short "what is this" intro.
- **How to Play** (4 steps: Choose premise → Investigate → Use clues and hints → Accuse).
- **Difficulty previews** (Easy / Medium / Hard cards showing suspects, clues, hints, base score).
- **Feature highlights** (AI-generated cases, hidden solution, hint system, scoring, works on any device).
- Detective-themed SVG visuals (magnifying glass, silhouette, fingerprint). No external image dependencies.

### B. Create Mystery (`/create`)
- Premise textarea (live character counter).
- Clickable example premises that fill the textarea.
- Difficulty selector (3 radio-style cards).
- **Generate Mystery** button.
- Validation: premise trimmed, 10–300 characters; difficulty must be one of three values. Inline error messages.
- While generating (can take 10–30 s): full-card loading state with rotating status text, buttons disabled.
- On success: remember case ID, navigate to `/case/:id`. On failure: friendly error plus Retry.

### C. Investigation Room (`/case/:id`)
- Header: title, difficulty badge, progress (clues discovered X / total), hints remaining.
- Case story panel.
- Suspect cards (name, description, motive).
- Clue board: each undiscovered clue shows a label and location ("Search: the wine cellar") and a **Discover** button. Discovered clues show their full description and are collected under **Discovered Clues**.
- **Request Hint** button (disabled at zero remaining) with confirmation that each hint costs 10 points. Revealed hints are listed.
- **Accuse Suspect** button → `/case/:id/accuse`.
- If the case is already completed, redirect to `/case/:id/result`.
- Invalid or missing case ID → friendly "Case not found" empty state.

### D. Accusation (`/case/:id/accuse`)
- Selectable suspect cards (single choice).
- Optional explanation textarea (max 500 characters).
- **Submit Accusation** → confirmation dialog ("This is final") → POST to backend → navigate to `/case/:id/result`.

### E. Results (`/case/:id/result`)
- Verdict banner (correct / incorrect).
- Actual culprit and player's chosen suspect.
- Full solution and logical explanation.
- Evidence list linking clues to the culprit.
- Clues discovered, hints used, final score (with a short score breakdown).
- **Play Again** → clears the stored case and goes to `/create`.
- If the case is not yet completed, redirect back to the Investigation Room.

## 8. User Flow

```
Home → Create Mystery → (backend: Gemini → Zod validate → save)
     → Investigation Room ⇄ (discover clues / request hints)
     → Accusation → (backend: score + complete)
     → Results → Play Again → Create Mystery
```

## 9. API Specifications

Base path: `/api`. All bodies are JSON. All IDs in URLs are validated (case ID must be a valid MongoDB ObjectId; clue ID must match `^[a-z0-9_-]+$`, max 40 chars).

Standard error format:
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Readable message" } }
```

Standard success format: `{ "success": true, "data": { ... } }`

### Health
`GET /api/health` → `200 { success: true, data: { status: "ok", database: "connected" } }` (503 if the DB is not connected). Used as the backend health-check URL.

### 1. `POST /api/cases` — create a case
Body: `{ "premise": string (10–300), "difficulty": "easy" | "medium" | "hard" }`
- Calls Gemini, validates with Zod (retries up to 2 times on invalid output), saves.
- `201` → safe case data (see "Safe case shape" below).
- `400` invalid input · `429` rate-limited · `502` AI failed after retries / invalid output · `503` AI quota/unavailable.

### 2. `GET /api/cases/:id` — get active case
- `200` safe case data including progress.
- `404` not found · `400` bad ID.
- If the case is already completed, returns `200` with `status: "completed"` (still safe data; the solution is only available via `/result`).

### 3. `POST /api/cases/:id/clues/:clueId/discover`
- Adds the clue to `discoveredClues` using an atomic update (`$addToSet` guarded by a query condition) so double-clicks and parallel requests cannot double-count.
- `200` updated safe case. If already discovered: `200` with `alreadyDiscovered: true` and no change to the count.
- `404` case or clue not found · `409` case already completed.

### 4. `POST /api/cases/:id/hints`
- Returns the next unrevealed hint, increments `hintsUsed` atomically, never exceeds the difficulty limit.
- `200 { hint: { index, text }, hintsUsed, hintsRemaining }`
- `403` (`HINT_LIMIT_REACHED`) if no hints remain · `404` · `409` if completed.

### 5. `POST /api/cases/:id/accuse`
Body: `{ "suspectId": string, "explanation"?: string (max 500) }`
- Validates the suspect ID belongs to this case.
- Completes the case atomically (only if still active), calculates the score on the server.
- `200 { status: "completed", correct, finalScore }`
- `400` invalid suspect · `404` · `409` already completed.

### 6. `GET /api/cases/:id/result`
- `200` full result (culprit, solution, explanation, evidence, player's accusation, score, counts).
- `403` (`CASE_NOT_COMPLETED`) if the case is still active.

### Safe case shape (what the frontend can ever receive before accusation)
```json
{
  "id": "…",
  "title": "…",
  "premise": "…",
  "story": "…",
  "difficulty": "easy",
  "status": "active",
  "suspects": [{ "id": "s1", "name": "…", "description": "…", "motive": "…" }],
  "clues": [
    { "id": "c1", "label": "…", "location": "…", "discovered": false },
    { "id": "c2", "label": "…", "location": "…", "discovered": true, "description": "…" }
  ],
  "revealedHints": [{ "index": 0, "text": "…" }],
  "progress": {
    "totalClues": 5, "cluesDiscovered": 1,
    "totalHints": 2, "hintsUsed": 1, "hintsRemaining": 1
  },
  "createdAt": "…"
}
```
Undiscovered clue descriptions, unrevealed hints, `culpritId`, `solution`, `explanation`, and `evidence` are never included.

### Cross-cutting
- CORS: only `CLIENT_URL` (and `http://localhost:5173` when `NODE_ENV !== "production"`).
- `express.json({ limit: "20kb" })`.
- Rate limits: `POST /api/cases` — 5 per 10 minutes per IP (protects the Gemini quota); other routes — 120 per 10 minutes per IP.
- `helmet` security headers; centralized error-handling middleware; unknown routes return `404` JSON.

## 10. Database Schema

MongoDB Atlas, database `ai-mystery-room`, collection `cases` (Mongoose model `Case`, `timestamps: true`).

| Field | Type | Notes |
|---|---|---|
| `title` | String | required |
| `premise` | String | player's input, required |
| `story` | String | required |
| `difficulty` | String enum `easy/medium/hard` | required |
| `suspects[]` | `{ id, name, description, motive }` | counts match difficulty |
| `clues[]` | `{ id, label, location, description, pointsTo }` | `description` hidden until discovered; `pointsTo` is private |
| `hints[]` | `[String]` | revealed one at a time |
| `culpritId` | String | **private** |
| `solution` | String | **private** |
| `explanation` | String | **private** |
| `evidence[]` | `{ clueId, explanation }` | **private**, links clues to culprit |
| `discoveredClues` | `[String]` | clue IDs, no duplicates |
| `hintsUsed` | Number, default 0 | |
| `accusation` | `{ suspectId, explanation }` | set on accuse |
| `isCorrect` | Boolean | set on accuse |
| `finalScore` | Number | set on accuse |
| `status` | String enum `active/completed` | default `active` |
| `completedAt` | Date | set on accuse |
| `createdAt`, `updatedAt` | Date | automatic |

Private fields use `select: false` so they are excluded from queries unless explicitly requested, and a dedicated "serializer" function builds the safe response shape (defense in depth).

## 11. Gemini AI Output Structure

The backend asks Gemini for JSON only (structured-output mode with a response schema, plus a strong system instruction). The result is parsed and validated with Zod.

```json
{
  "title": "string",
  "story": "string (150–400 words)",
  "suspects": [
    { "id": "s1", "name": "string", "description": "string", "motive": "string" }
  ],
  "clues": [
    { "id": "c1", "label": "string", "location": "string", "description": "string", "pointsTo": "s1" }
  ],
  "hints": ["string"],
  "culpritId": "s2",
  "solution": "string",
  "explanation": "string",
  "evidence": [
    { "clueId": "c1", "explanation": "string" }
  ]
}
```

Validation rules beyond shape (enforced in Zod `superRefine`):
1. Suspect count, clue count, and hint count exactly match the difficulty.
2. Suspect IDs are unique; clue IDs are unique.
3. `culpritId` matches exactly one suspect.
4. Every `pointsTo` and every `evidence.clueId` refers to an existing ID.
5. At least 3 clues (Easy), 4 (Medium), 5 (Hard) must support the culprit via evidence entries, so the case is solvable; the remaining clues may be red herrings pointing to other suspects.
6. Hints must not name the culprit outright; the prompt instructs progressive hints (vague → more specific). The server also rejects a hint that contains the culprit's full name.
7. No empty strings; text lengths capped.

On invalid output: retry up to 2 more times (with the validation error summarized to the model). If it still fails, return `502` with a friendly message. Model output is never trusted blindly: IDs and text are sanitized and length-limited before saving.

The player's premise is passed to Gemini as clearly delimited user data, with instructions to treat it only as a story theme, to reduce prompt-injection attempts. Content must be suitable for general audiences (no graphic gore).

## 12. Difficulty Configuration

| Difficulty | Suspects | Clues | Hints | Base Correct Score |
|---|---|---|---|---|
| Easy | 3 | 5 | 2 | 100 |
| Medium | 4 | 7 | 3 | 150 |
| Hard | 5 | 9 | 3 | 200 |

Defined once in `server/config/difficulty.js` (and mirrored for display only on the client; the server is the authority).

## 13. Scoring Rules

Computed on the server only, at accusation time:

```
Correct accusation:   score = Base + (DiscoveredClues × 5) − (HintsUsed × 10)
Incorrect accusation: score = (DiscoveredClues × 5) − (HintsUsed × 10)   // no base score
Final score = max(0, score)
```

- Base: Easy 100, Medium 150, Hard 200.
- Discovered clues counted from the database (unique IDs only), never from the request.
- Hints used counted from the database.
- The frontend only displays the returned score.

Worked example (Medium, correct, 5 clues, 1 hint): 150 + 25 − 10 = **165**.
Worked example (Hard, incorrect, 2 clues, 3 hints): 10 − 30 = −20 → **0**.

*Interpretation note:* the original requirement says incorrect accusations "must not receive the correct-accusation base score." This spec implements that by removing the base score for incorrect accusations while still applying the clue and hint terms, floored at 0.

## 14. Security Requirements

1. Gemini API key and MongoDB URI live only in backend environment variables. The frontend has only `VITE_API_URL` (a public URL, not a secret).
2. `.gitignore` in the repo root and in both folders excludes `.env`, `node_modules`, `dist`. Only `.env.example` files are committed.
3. Culprit, solution, explanation, evidence, undiscovered clue descriptions, and unrevealed hints are never sent before accusation (`select: false` + safe serializer + tests).
4. All requests validated with Zod (body, params). Invalid ObjectIds return `400`, not a crash.
5. Atomic database updates prevent duplicate clue scoring, hint overuse, and double accusation, even with simultaneous requests.
6. Suspect IDs are verified against the case's own suspects.
7. Score and progress values from the client are ignored entirely.
8. Production CORS allows only the deployed frontend origin from `CLIENT_URL`.
9. Rate limiting on all routes; stricter on AI generation.
10. `helmet`, request size limits, no stack traces in production error responses, no secrets in logs.
11. No fake authentication and no fake database operations. The game is anonymous by design (see Limitations).

## 15. Acceptance Criteria

The project is complete only when all are true:

1. Home page loads and **Start Mystery** goes to `/create`.
2. Easy, Medium, and Hard mysteries can each be created.
3. Gemini output passes Zod validation; counts match the difficulty table.
4. Clues can be discovered; discovering the same clue twice does not change the count or score.
5. Hints work within the limit; a request beyond the limit returns `403` and a clear message.
6. Accusations work; invalid suspect IDs are rejected; a second accusation on a completed case is rejected.
7. Correct and incorrect accusations produce the correct verdict and score per Section 13.
8. Inspecting network responses and page source before accusation never reveals the culprit or solution.
9. Results page shows culprit, explanation, evidence, counts, and score.
10. Play Again creates a new, different case.
11. Data persists in MongoDB Atlas (a refresh keeps progress).
12. API failures (AI down, DB down, bad input, rate limit) show useful messages.
13. Layout works on mobile and desktop.
14. Deployed frontend talks to the deployed backend with no `localhost` URLs.
15. Refreshing any route on Vercel (e.g. `/case/abc`) works (SPA rewrite configured).
16. A complete game is played start to finish on the public URL, on a second device or browser.

## 16. Limitations

- No user accounts: anyone who has a case ID can open that case. IDs are random and unguessable in practice, but not secret credentials. Resuming a game relies on the browser remembering the case ID.
- No leaderboard (out of scope).
- AI quality varies; the validator guarantees structure and internal consistency checks, but cannot guarantee every story is perfect. Retries reduce this.
- Gemini free-tier quota and rate limits may cause temporary failures; the app shows a clear message.
- Render's free tier sleeps after inactivity, so the first request after a pause can take about 30–60 seconds. The frontend shows a "waking up the server" message when requests are slow.
- Content is intended to be general-audience; the premise is not guaranteed to be filtered perfectly.

## 17. Deployment Plan

**Important:** I (the AI assistant) work inside a chat sandbox. I cannot log in to your GitHub, MongoDB Atlas, Render, Vercel, or Google accounts, and I cannot reach the internet from the code sandbox. So I will prepare every file and give exact, beginner-friendly steps, but **you** perform the account actions. I will not claim anything is deployed or verified until you confirm it and share the real URLs. A final checklist will help you test the live site.

Order:
1. **MongoDB Atlas**: create free cluster, database user, network access (allow `0.0.0.0/0` since Render's IPs change), copy connection string.
2. **Gemini API key**: create in Google AI Studio.
3. **GitHub**: create repository, push the project (secrets excluded).
4. **Backend on Render**: Web Service from the GitHub repo, root directory `server`, build `npm install`, start `npm start`, env vars `MONGODB_URI`, `GEMINI_API_KEY`, `CLIENT_URL` (placeholder first), `NODE_ENV=production` (Render supplies `PORT`). Verify `https://<backend>.onrender.com/api/health`.
5. **Frontend on Vercel**: import repo, root directory `client`, framework Vite, env var `VITE_API_URL=https://<backend>.onrender.com/api`. `client/vercel.json` rewrites all routes to `index.html`.
6. **Connect**: set Render `CLIENT_URL` to the Vercel URL (no trailing slash) and redeploy the backend.
7. **Verify on production**: play Easy, Medium, and Hard on the public URL from a different device.

Environment variables:

| Where | Variable | Purpose |
|---|---|---|
| Backend | `PORT` | Set by host; defaults to 5000 locally |
| Backend | `MONGODB_URI` | Atlas connection string |
| Backend | `GEMINI_API_KEY` | Gemini key |
| Backend | `CLIENT_URL` | Allowed frontend origin for CORS |
| Backend (optional) | `GEMINI_MODEL`, `NODE_ENV` | Model override, production flag |
| Frontend | `VITE_API_URL` | Public backend API base URL |

## 18. Final Deliverables

1. Complete source code (`client/`, `server/`).
2. `SPEC.md` (this file).
3. `README.md` with setup, testing, GitHub, and deployment instructions.
4. Working frontend and backend.
5. MongoDB Atlas integration.
6. Real Gemini integration (no mock data).
7. GitHub repository (created by you, using my instructions).
8. Public deployed website URL and backend health-check URL (provided by you after deploying; recorded in README).
9. Verified gameplay on the deployed site (checklist provided; verified by you).

Submission form: https://bit.ly/ai-mystery-room-sub-form · Deadline: **November 2, 11:59 PM**.

## 19. Implementation Phases

1. **Phase 1** — SPEC.md, folder structure, dependencies, `.env.example` files, `.gitignore`.
2. **Phase 2** — Express server, MongoDB connection, Case model, routes/controllers, Gemini service, Zod validation.
3. **Phase 3** — React pages, router, reusable components, API service, game flows.
4. **Phase 4** — Scoring, error handling, testing all difficulties and security checks, bug fixes.
5. **Phase 5** — GitHub, Render, Atlas, Vercel, production verification.

Each phase ends with a short check you can run before we continue.
