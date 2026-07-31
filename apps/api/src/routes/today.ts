import { Router, type Router as ExpressRouter } from "express";
import { requireAuth } from "../auth/middleware.js";
import { getDayRange, todayQuerySchema } from "../calendar/date-range.js";
import type { CalendarService } from "../calendar/service.js";

export function createTodayRouter(service: CalendarService): ExpressRouter {
  const router = Router();

  router.get("/api/today", requireAuth, async (request, response, next) => {
    const query = todayQuerySchema.safeParse(request.query);
    if (!query.success) {
      response.status(400).json({
        error: { code: "INVALID_DATE_RANGE", message: "Choose a valid date and timezone." },
      });
      return;
    }
    try {
      const range = getDayRange(query.data.date, query.data.timezone);
      response.json(await service.getToday(
        request.auth!.user.id,
        range.rangeStart,
        range.rangeEnd,
        query.data.timezone,
      ));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
