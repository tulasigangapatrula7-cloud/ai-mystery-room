// server/middleware/rateLimiters.js
// Limits how many requests one visitor (IP address) can make.

import rateLimit from "express-rate-limit";

const TEN_MINUTES = 10 * 60 * 1000;

// When a visitor goes over the limit, answer in our standard JSON format.
function limitReached(message) {
  return (req, res) => {
    res.status(429).json({
      success: false,
      error: { code: "RATE_LIMITED", message },
    });
  };
}

// Creating a mystery calls Gemini, so it gets a strict limit.
// Default: 5 per 10 minutes. You can change it with CREATE_CASE_LIMIT in .env.
export const createCaseLimiter = rateLimit({
  windowMs: TEN_MINUTES,
  limit: Number(process.env.CREATE_CASE_LIMIT) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitReached(
    "You have created too many mysteries in a short time. Please wait a few minutes and try again."
  ),
});

// Everything else (clues, hints, accusations) gets a generous limit.
export const generalLimiter = rateLimit({
  windowMs: TEN_MINUTES,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitReached("Too many requests. Please slow down and try again shortly."),
});