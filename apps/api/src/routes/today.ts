import { Router, type Router as ExpressRouter } from "express";
import { requireAuth } from "../auth/middleware.js";
import { getDayRange, todayQuerySchema } from "../calendar/date-range.js";
import type { CalendarService } from "../calendar/service.js";
import type { GitHubService } from "../github/service.js";

export function createTodayRouter(service: CalendarService, github: GitHubService | null): ExpressRouter {
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
      const calendar = await service.getToday(
        request.auth!.user.id,
        range.rangeStart,
        range.rangeEnd,
        query.data.timezone,
      );
      const githubContext = github ? await github.activity(request.auth!.user.id) : { state: "disconnected" as const, activity: { commits: [], pullRequests: [] } };
      response.json({ ...calendar, github: githubContext });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
