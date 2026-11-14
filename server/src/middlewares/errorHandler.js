import { env } from "../config/env.js";

export function notFound(req, _res, next) {
  next(
    Object.assign(
      new Error(`Route not found: ${req.method} ${req.originalUrl}`),
      { statusCode: 404 },
    ),
  );
}

export function errorHandler(error, req, res, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error.";

  if (error.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "File is larger than the 10 MB upload limit.";
  } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    message = "Unexpected file field.";
  } else if (error.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large.";
  } else if (error.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Request body contains invalid JSON.";
  } else if (error.code === 11000) {
    statusCode = 409;
    message = "A record with this value already exists.";
  } else if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier.";
  } else if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Database validation failed.";
  }

  if (res.headersSent) return;
  const safeMessage =
    statusCode >= 500 && env.isProduction ? "Internal server error." : message;
  res.status(statusCode).json({
    success: false,
    message: safeMessage,
    requestId: req.requestId,
    ...(error.details ? { details: error.details } : {}),
    ...(env.nodeEnv === "development" && statusCode >= 500
      ? { stack: error.stack }
      : {}),
  });
}
