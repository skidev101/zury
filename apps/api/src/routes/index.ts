import { Router, type Router as ExpressRouter } from "express";
import { healthRouter } from "./health.js";
import { calendarService } from "../composition.js";
import { createCalendarRouter } from "./calendar.js";
import { createTodayRouter } from "./today.js";
import { conversationService, githubService } from "../composition.js";
import { createConversationRouter } from "./conversation.js";
import { createGitHubRouter } from "./github.js";

export const routes: ExpressRouter = Router();

routes.use(healthRouter);
routes.use(createCalendarRouter(calendarService));
routes.use(createTodayRouter(calendarService, githubService));
routes.use(createConversationRouter(conversationService));
routes.use(createGitHubRouter(githubService));
