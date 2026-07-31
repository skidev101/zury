import { randomBytes } from "node:crypto";
import { logger } from "../config/logger.js";
import { CalendarError, isReconnectError } from "./errors.js";
import type { CalendarCredentials, CalendarEvent, CalendarProvider } from "./provider.js";

interface CalendarStore {
  getConnection(userId: string): Promise<{
    status: "connected" | "reconnect_required";
    credentials: CalendarCredentials;
    connectedAt: Date;
  } | null>;
  saveConnection(userId: string, credentials: CalendarCredentials): Promise<void>;
  updateCredentials(userId: string, credentials: CalendarCredentials): Promise<void>;
  markReconnectRequired(userId: string): Promise<void>;
  disconnect(userId: string): Promise<void>;
  replaceEvents(userId: string, rangeStart: string, rangeEnd: string, events: CalendarEvent[], fetchedAt: Date): Promise<void>;
  getEvents(userId: string, rangeStart: string, rangeEnd: string): Promise<{ events: CalendarEvent[]; fetchedAt: Date | null }>;
  createAuthorizationState(userId: string, state: string, expiresAt: Date): Promise<void>;
  consumeAuthorizationState(state: string): Promise<string | null>;
}

export type TodayResponse = {
  calendar: {
    state: "disconnected" | "current" | "saved" | "unavailable" | "reconnect_required";
    updatedAt: string | null;
  };
  events: CalendarEvent[];
};

export class CalendarService {
  constructor(private readonly provider: CalendarProvider, private readonly store: CalendarStore) {}

  async getConnection(userId: string) {
    const connection = await this.store.getConnection(userId);
    if (!connection) return { status: "disconnected" as const, connectedAt: null };
    return { status: connection.status, connectedAt: connection.connectedAt.toISOString() };
  }

  async beginAuthorization(userId: string): Promise<string> {
    const state = randomBytes(32).toString("base64url");
    await this.store.createAuthorizationState(userId, state, new Date(Date.now() + 10 * 60_000));
    return this.provider.getAuthorizationUrl({ state });
  }

  async completeAuthorization(code: string, state: string): Promise<void> {
    const userId = await this.store.consumeAuthorizationState(state);
    if (!userId) {
      throw new CalendarError("CALENDAR_AUTHORIZATION_FAILED", "This calendar connection request has expired.");
    }
    const credentials = await this.provider.completeAuthorization({ code });
    await this.store.saveConnection(userId, credentials);
  }

  async disconnect(userId: string): Promise<void> {
    await this.store.disconnect(userId);
  }

  async getToday(userId: string, rangeStart: string, rangeEnd: string, timezone: string): Promise<TodayResponse> {
    const connection = await this.store.getConnection(userId);
    if (!connection) return { calendar: { state: "disconnected", updatedAt: null }, events: [] };
    if (connection.status === "reconnect_required") {
      const saved = await this.store.getEvents(userId, rangeStart, rangeEnd);
      return { calendar: { state: "reconnect_required", updatedAt: saved.fetchedAt?.toISOString() ?? null }, events: saved.events };
    }

    try {
      const result = await this.provider.listEvents({
        credentials: connection.credentials, rangeStart, rangeEnd, timezone,
      });
      if (result.credentials) await this.store.updateCredentials(userId, result.credentials);
      const fetchedAt = new Date();
      await this.store.replaceEvents(userId, rangeStart, rangeEnd, result.events, fetchedAt);
      return { calendar: { state: "current", updatedAt: fetchedAt.toISOString() }, events: result.events };
    } catch (error) {
      logger.warn("Calendar refresh failed", {
        userId,
        code: error instanceof CalendarError ? error.code : "UNKNOWN",
      });
      if (isReconnectError(error)) await this.store.markReconnectRequired(userId);
      const saved = await this.store.getEvents(userId, rangeStart, rangeEnd);
      if (isReconnectError(error)) {
        return { calendar: { state: "reconnect_required", updatedAt: saved.fetchedAt?.toISOString() ?? null }, events: saved.events };
      }
      if (saved.fetchedAt) {
        return { calendar: { state: "saved", updatedAt: saved.fetchedAt.toISOString() }, events: saved.events };
      }
      return { calendar: { state: "unavailable", updatedAt: null }, events: [] };
    }
  }
}
