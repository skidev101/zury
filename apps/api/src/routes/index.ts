import { Router, type Router as ExpressRouter } from "express";
import { healthRouter } from "./health.js";
import { calendarService } from "../composition.js";
import { createCalendarRouter } from "./calendar.js";
import { createTodayRouter } from "./today.js";

export const routes: ExpressRouter = Router();

routes.use(healthRouter);
routes.use(createCalendarRouter(calendarService));
routes.use(createTodayRouter(calendarService));
