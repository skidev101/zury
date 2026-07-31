import type { Env } from "../config/env.js";
import { getCalendarEnv } from "../config/env.js";
import type { CalendarProvider } from "./provider.js";
import { GoogleCalendarProvider } from "./providers/google.js";

export function createCalendarProvider(env: Env): CalendarProvider {
  const config = getCalendarEnv(env);
  return new GoogleCalendarProvider({
    clientId: config.GOOGLE_CALENDAR_CLIENT_ID,
    clientSecret: config.GOOGLE_CALENDAR_CLIENT_SECRET,
    redirectUri: config.GOOGLE_CALENDAR_REDIRECT_URI,
  });
}
