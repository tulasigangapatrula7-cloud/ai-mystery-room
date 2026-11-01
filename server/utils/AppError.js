// server/utils/AppError.js
// An error with a status code and a message that is safe to show the player.

export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "AppError";
    this.status = status; // HTTP status, e.g. 400, 404, 503
    this.code = code; // short label, e.g. "HINT_LIMIT_REACHED"
    this.expose = true; // true = the message is safe to send to the browser
  }
}