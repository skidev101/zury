import { Router, type Router as ExpressRouter } from "express";
import type { CalendarService } from "../calendar/service.js";
import { requireAuth } from "../auth/middleware.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export function createCalendarRouter(service: CalendarService): ExpressRouter {
  const router = Router();

  router.get("/api/calendar/connection", requireAuth, async (request, response, next) => {
    try {
      response.json(await service.getConnection(request.auth!.user.id));
    } catch (error) {
      next(error);
    }
  });

  router.post("/api/calendar/connect", requireAuth, async (request, response, next) => {
    try {
      response.json({ authorizationUrl: await service.beginAuthorization(request.auth!.user.id) });
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/calendar/callback", async (request, response) => {
    const code = typeof request.query.code === "string" ? request.query.code : null;
    const state = typeof request.query.state === "string" ? request.query.state : null;
    if (!code || !state || request.query.error) {
      response.redirect(`${env.WEB_URL}/dashboard?calendar=failed`);
      return;
    }
    try {
      await service.completeAuthorization(code, state);
      response.redirect(`${env.WEB_URL}/dashboard?calendar=connected`);
    } catch (error) {
      logger.warn("Calendar authorization callback failed", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
      response.redirect(`${env.WEB_URL}/dashboard?calendar=failed`);
    }
  });

  router.delete("/api/calendar/connection", requireAuth, async (request, response, next) => {
    try {
      await service.disconnect(request.auth!.user.id);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
