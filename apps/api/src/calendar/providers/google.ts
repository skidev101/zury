import { google, type calendar_v3 } from "googleapis";
import { CalendarError } from "../errors.js";
import { CALENDAR_READ_SCOPE, type CalendarCredentials, type CalendarEvent, type CalendarProvider } from "../provider.js";

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class GoogleCalendarProvider implements CalendarProvider {
  constructor(private readonly config: GoogleCalendarConfig) {}

  async getAuthorizationUrl(input: { state: string }): Promise<string> {
    return this.createClient().generateAuthUrl({
      access_type: "offline",
      include_granted_scopes: true,
      prompt: "consent",
      scope: [CALENDAR_READ_SCOPE],
      state: input.state,
    });
  }

  async completeAuthorization(input: { code: string }): Promise<CalendarCredentials> {
    try {
      const { tokens } = await this.createClient().getToken(input.code);
      if (!tokens.access_token) {
        throw new Error("Google returned no access token");
      }
      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        accessTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope ?? CALENDAR_READ_SCOPE,
      };
    } catch (error) {
      throw mapGoogleError(error, "CALENDAR_AUTHORIZATION_FAILED");
    }
  }

  async listEvents(input: {
    credentials: CalendarCredentials;
    rangeStart: string;
    rangeEnd: string;
    timezone: string;
  }): Promise<{ events: CalendarEvent[]; credentials?: CalendarCredentials }> {
    const client = this.createClient();
    client.setCredentials({
      access_token: input.credentials.accessToken,
      refresh_token: input.credentials.refreshToken,
      expiry_date: input.credentials.accessTokenExpiresAt?.getTime() ?? null,
      scope: input.credentials.scope,
    });

    let refreshedCredentials: CalendarCredentials | undefined;
    client.on("tokens", (tokens) => {
      if (!tokens.access_token) return;
      refreshedCredentials = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? input.credentials.refreshToken,
        accessTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope ?? input.credentials.scope,
      };
    });

    try {
      const response = await google.calendar({ version: "v3", auth: client }).events.list({
        calendarId: "primary",
        timeMin: input.rangeStart,
        timeMax: input.rangeEnd,
        timeZone: input.timezone,
        singleEvents: true,
        orderBy: "startTime",
        showDeleted: false,
        maxResults: 250,
      });
      const result: { events: CalendarEvent[]; credentials?: CalendarCredentials } = {
        events: (response.data.items ?? []).flatMap((event) => {
          const normalized = normalizeGoogleEvent(event);
          return normalized ? [normalized] : [];
        }),
      };
      if (refreshedCredentials) result.credentials = refreshedCredentials;
      return result;
    } catch (error) {
      throw mapGoogleError(error, "CALENDAR_UNAVAILABLE");
    }
  }

  async health(): Promise<{ available: boolean }> {
    return { available: true };
  }

  private createClient() {
    return new google.auth.OAuth2(this.config.clientId, this.config.clientSecret, this.config.redirectUri);
  }
}

export function normalizeGoogleEvent(event: calendar_v3.Schema$Event): CalendarEvent | null {
  if (!event.id || event.status === "cancelled") return null;
  const allDay = Boolean(event.start?.date);
  const startAt = event.start?.dateTime ?? dateBoundary(event.start?.date);
  const endAt = event.end?.dateTime ?? dateBoundary(event.end?.date);
  if (!startAt || !endAt) return null;

  return {
    id: event.id,
    calendarId: "primary",
    title: event.summary?.trim() || "Untitled event",
    description: event.description?.trim() || null,
    location: event.location?.trim() || null,
    startAt: new Date(startAt).toISOString(),
    endAt: new Date(endAt).toISOString(),
    allDay,
    status: event.status ?? "confirmed",
  };
}

function dateBoundary(date: string | null | undefined): string | null {
  return date ? `${date}T00:00:00.000Z` : null;
}

function mapGoogleError(error: unknown, fallback: "CALENDAR_UNAVAILABLE" | "CALENDAR_AUTHORIZATION_FAILED"): CalendarError {
  const status = getStatus(error);
  if (status === 400 || status === 401 || status === 403) {
    return new CalendarError("CALENDAR_RECONNECT_REQUIRED", "Calendar access needs to be reconnected.", error);
  }
  return new CalendarError(
    fallback,
    fallback === "CALENDAR_AUTHORIZATION_FAILED"
      ? "Calendar could not be connected."
      : "Calendar could not be updated just now.",
    error,
  );
}

function getStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const candidate = error as { code?: unknown; response?: { status?: unknown } };
  if (typeof candidate.response?.status === "number") return candidate.response.status;
  return typeof candidate.code === "number" ? candidate.code : undefined;
}
