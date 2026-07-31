export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

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
  createEvent(input: {
    credentials: CalendarCredentials;
    event: CreateCalendarEventInput;
  }): Promise<{ event: CalendarEvent; credentials?: CalendarCredentials }>;
  updateEvent?(input: {
    credentials: CalendarCredentials;
    event: UpdateCalendarEventInput;
  }): Promise<{ event: CalendarEvent; credentials?: CalendarCredentials }>;
  deleteEvent?(input: {
    credentials: CalendarCredentials;
    event: DeleteCalendarEventInput;
  }): Promise<{ credentials?: CalendarCredentials }>;
  health(): Promise<{ available: boolean }>;
}

export interface CreateCalendarEventInput {
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  timezone: string;
}

export interface UpdateCalendarEventInput {
  externalEventId: string;
  title?: string;
  description?: string | null;
  location?: string | null;
  startAt?: string;
  endAt?: string;
  allDay?: boolean;
  timezone: string;
}

export interface DeleteCalendarEventInput {
  externalEventId: string;
}
