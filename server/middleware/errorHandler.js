// server/middleware/errorHandler.js
// Handles unknown URLs and all errors, always answering in the same JSON format.

// Runs when no route matches the URL.
export function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
}

// Runs whenever something throws an error.
// Express needs all 4 parameters here, even though "next" is unused.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let code = typeof err.code === "string" ? err.code : "SERVER_ERROR";
  let message = err.message || "Something went wrong on the server.";

  // The browser sent broken JSON.
  if (err.type === "entity.parse.failed") {
    status = 400;
    code = "INVALID_JSON";
    message = "The request body is not valid JSON.";
  }

  // The request body was too big.
  if (err.type === "entity.too.large") {
    status = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "The request is too large.";
  }

  // A badly formed ID (Mongoose could not read it).
  if (err.name === "CastError") {
    status = 400;
    code = "INVALID_ID";
    message = "That ID is not valid.";
  }

  // The CORS rule in server.js rejected the website.
  if (message === "This website is not allowed to use the API.") {
    status = 403;
    code = "CORS_BLOCKED";
  }

  // Real server problems: log the details in your terminal only.
  if (status >= 500) {
    console.error("Server error:", err.expose ? err.message : err);

    // Unexpected errors get a generic message. Our own AppError messages
    // (err.expose = true) are written for players, so they are shown.
    if (!err.expose) {
      code = "SERVER_ERROR";
      if (process.env.NODE_ENV === "production") {
        message = "Something went wrong on the server. Please try again.";
      }
    }
  }

  res.status(status).json({ success: false, error: { code, message } });
}