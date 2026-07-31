import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { type Express } from "express";
import { auth } from "./auth/auth.js";
import { sessionMiddleware } from "./auth/middleware.js";
import { env } from "./config/env.js";
import { routes } from "./routes/index.js";
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
} from "./shared/middleware.js";
import "./types.js";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(requestLogger);
  app.use(cors({ origin: env.WEB_URL, credentials: true }));

  // Better Auth reads the raw request body, so its handler precedes JSON parsing.
  const authHandler = toNodeHandler(auth);
  app.use((request, response, next) => {
    if (!request.originalUrl.startsWith("/api/auth/")) {
      next();
      return;
    }

    // Better Auth must receive its complete configured base path.
    request.url = request.originalUrl;
    return authHandler(request, response);
  });

  app.use(express.json({ limit: "1mb" }));
  app.use(sessionMiddleware);
  app.use(routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
