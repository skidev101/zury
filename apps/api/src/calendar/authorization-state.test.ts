import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CalendarError } from "./errors.js";
import { CalendarService } from "./service.js";
import type { CalendarProvider } from "./provider.js";

describe("calendar authorization state", () => {
  it("rejects an unknown or expired state before exchanging a code", async () => {
    let exchanged = false;
    const provider: CalendarProvider = {
      async getAuthorizationUrl() { return "https://example.test"; },
      async completeAuthorization() { exchanged = true; return { accessToken: "x", refreshToken: null, accessTokenExpiresAt: null, scope: "read" }; },
      async listEvents() { return { events: [] }; },
      async createEvent() { throw new Error("not used"); },
      async health() { return { available: true }; },
    };
    const store = {
      async getConnection() { return null; }, async saveConnection() {}, async updateCredentials() {},
      async markReconnectRequired() {}, async disconnect() {}, async replaceEvents() {},
      async getEvents() { return { events: [], fetchedAt: null }; }, async createAuthorizationState() {},
      async consumeAuthorizationState() { return null; },
    };
    await assert.rejects(
      new CalendarService(provider, store).completeAuthorization("code", "invalid"),
      (error: unknown) => error instanceof CalendarError && error.code === "CALENDAR_AUTHORIZATION_FAILED",
    );
    assert.equal(exchanged, false);
  });
});
