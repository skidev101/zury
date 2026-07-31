export const CALENDAR_READ_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

export interface CalendarCredentials {
  accessToken: string;
  refreshToken: string | null;
  accessTokenExpiresAt: Date | null;
  scope: string;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  status: string;
}

export interface CalendarProvider {
  getAuthorizationUrl(input: { state: string }): Promise<string>;
  completeAuthorization(input: { code: string }): Promise<CalendarCredentials>;
  listEvents(input: {
    credentials: CalendarCredentials;
    rangeStart: string;
    rangeEnd: string;
    timezone: string;
  }): Promise<{ events: CalendarEvent[]; credentials?: CalendarCredentials }>;
  health(): Promise<{ available: boolean }>;
}
