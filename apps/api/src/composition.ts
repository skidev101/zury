import { AgentRuntime } from "./agent/runtime.js";
import { createAIProvider } from "./ai/create-provider.js";
import { env } from "./config/env.js";
import { createCalendarProvider } from "./calendar/create-provider.js";
import { TokenCipher } from "./calendar/crypto.js";
import { CalendarRepository } from "./calendar/repository.js";
import { CalendarService } from "./calendar/service.js";
import { getCalendarEnv } from "./config/env.js";
import { db } from "./db/index.js";

export const aiProvider = createAIProvider(env);
export const agentRuntime = new AgentRuntime(aiProvider);

const calendarEnv = getCalendarEnv(env);
export const calendarProvider = createCalendarProvider(env);
export const calendarRepository = new CalendarRepository(
  db,
  new TokenCipher(calendarEnv.CALENDAR_TOKEN_ENCRYPTION_KEY),
);
export const calendarService = new CalendarService(calendarProvider, calendarRepository);
