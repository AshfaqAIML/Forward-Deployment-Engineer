// src/errors.js — the application error type every layer throws; the HTTP layer
// maps it to a JSON problem response. Anything not an AppError becomes a 500
// without internals leaking to the client.
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
export const badRequest = (msg, details) => new AppError(400, "bad_request", msg, details);
export const unauthorized = (msg = "Authentication required") => new AppError(401, "unauthorized", msg);
export const forbidden = (msg = "You do not have permission to do that") => new AppError(403, "forbidden", msg);
export const notFound = (msg = "Resource not found") => new AppError(404, "not_found", msg);
export const methodNotAllowed = (msg) => new AppError(405, "method_not_allowed", msg);
export const conflict = (msg) => new AppError(409, "conflict", msg);
export const payloadTooLarge = (msg = "Request body too large") => new AppError(413, "payload_too_large", msg);
export const unprocessable = (msg, details) => new AppError(422, "validation_failed", msg, details);
export const tooManyRequests = (msg = "Too many requests") => new AppError(429, "rate_limited", msg);
