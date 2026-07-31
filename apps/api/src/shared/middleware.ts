import type { ErrorRequestHandler, RequestHandler } from "express";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { CalendarError } from "../calendar/errors.js";
import { GitHubProviderError } from "../github/provider.js";

export const requestLogger: RequestHandler = (request, response, next) => {
  const startedAt = performance.now();

  response.on("finish", () => {
    logger.info("Request completed", {
      method: request.method,
      path: request.originalUrl,
      status: response.statusCode,
      durationMs: Math.round(performance.now() - startedAt),
    });
  });

  next();
};

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({ error: "Not found" });
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (isPayloadTooLarge(error)) {
    response.status(413).json({
      error: { code: "PAYLOAD_TOO_LARGE", message: "Choose a PDF smaller than 15 MB." },
    });
    return;
  }
  if (error instanceof CalendarError) {
    logger.warn("Calendar request failed", { code: error.code });
    response.status(error.code === "INVALID_DATE_RANGE" ? 400 : 503).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }
  if (error instanceof GitHubProviderError) {
    const status = error.code === "RECONNECT_REQUIRED" ? 409 : error.code === "AUTHORIZATION_FAILED" ? 400 : 503;
    response.status(status).json({ error: { code: `GITHUB_${error.code}`, message: error.message } });
    return;
  }
  logger.error("Unhandled request error", error);
  response.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: env.NODE_ENV === "production" ? "Something went wrong." : getErrorMessage(error),
    },
  });
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Internal server error";
}

function isPayloadTooLarge(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "type" in error && error.type === "entity.too.large");
}
