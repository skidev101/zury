import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CalendarError } from "./errors.js";
import { CalendarService } from "./service.js";
import type { CalendarCredentials, CalendarEvent, CalendarProvider } from "./provider.js";

const credentials: CalendarCredentials = { accessToken: "access", refreshToken: "refresh", accessTokenExpiresAt: null, scope: "readonly" };
const event: CalendarEvent = { id: "event-1", calendarId: "primary", title: "Lecture", description: null, location: "Hall B", startAt: "2026-07-30T08:00:00.000Z", endAt: "2026-07-30T09:00:00.000Z", allDay: false, status: "confirmed" };

class FakeProvider implements CalendarProvider {
  mode: "current" | "unavailable" | "reconnect" = "current";
  async getAuthorizationUrl() { return "https://example.test/authorize"; }
  async completeAuthorization() { return credentials; }
  async listEvents() {
    if (this.mode === "unavailable") throw new CalendarError("CALENDAR_UNAVAILABLE", "unavailable");
    if (this.mode === "reconnect") throw new CalendarError("CALENDAR_RECONNECT_REQUIRED", "reconnect");
    return { events: [event] };
  }
  async health() { return { available: true }; }
}

class FakeStore {
  connection: { status: "connected" | "reconnect_required"; credentials: CalendarCredentials; connectedAt: Date } | null = null;
  saved: { events: CalendarEvent[]; fetchedAt: Date | null } = { events: [], fetchedAt: null };
  async getConnection() { return this.connection; }
  async saveConnection(_userId: string, value: CalendarCredentials) { this.connection = { status: "connected", credentials: value, connectedAt: new Date() }; }
  async updateCredentials() {}
  async markReconnectRequired() { if (this.connection) this.connection.status = "reconnect_required"; }
  async disconnect() { this.connection = null; }
  async replaceEvents(_userId: string, _start: string, _end: string, events: CalendarEvent[], fetchedAt: Date) { this.saved = { events, fetchedAt }; }
  async getEvents() { return this.saved; }
  async createAuthorizationState() {}
  async consumeAuthorizationState() { return "user-1"; }
}

describe("CalendarService", () => {
  it("returns current data after a successful refresh", async () => {
    const store = new FakeStore();
    store.connection = { status: "connected", credentials, connectedAt: new Date() };
    const result = await new CalendarService(new FakeProvider(), store).getToday("user-1", "start", "end", "Africa/Lagos");
    assert.equal(result.calendar.state, "current");
    assert.deepEqual(result.events, [event]);
  });

  it("returns saved data when the provider is unavailable", async () => {
    const store = new FakeStore();
    store.connection = { status: "connected", credentials, connectedAt: new Date() };
    store.saved = { events: [event], fetchedAt: new Date("2026-07-29T10:00:00.000Z") };
    const provider = new FakeProvider(); provider.mode = "unavailable";
    const result = await new CalendarService(provider, store).getToday("user-1", "start", "end", "UTC");
    assert.equal(result.calendar.state, "saved");
    assert.deepEqual(result.events, [event]);
  });

  it("returns disconnected and reconnect-required states", async () => {
    const store = new FakeStore();
    const service = new CalendarService(new FakeProvider(), store);
    assert.equal((await service.getToday("user-1", "start", "end", "UTC")).calendar.state, "disconnected");
    store.connection = { status: "connected", credentials, connectedAt: new Date() };
    const provider = new FakeProvider(); provider.mode = "reconnect";
    const result = await new CalendarService(provider, store).getToday("user-1", "start", "end", "UTC");
    assert.equal(result.calendar.state, "reconnect_required");
  });
});
