import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeGoogleEvent } from "./google.js";

describe("Google event normalization", () => {
  it("normalizes timed and all-day events without exposing SDK objects", () => {
    const timed = normalizeGoogleEvent({ id: "1", summary: "Seminar", start: { dateTime: "2026-07-30T10:00:00+01:00" }, end: { dateTime: "2026-07-30T11:00:00+01:00" }, location: "Room 2", status: "confirmed" });
    const allDay = normalizeGoogleEvent({ id: "2", summary: "Holiday", start: { date: "2026-07-30" }, end: { date: "2026-07-31" }, status: "confirmed" });
    assert.equal(timed?.startAt, "2026-07-30T09:00:00.000Z");
    assert.equal(timed?.location, "Room 2");
    assert.equal(allDay?.allDay, true);
    assert.equal(allDay?.startAt, "2026-07-30T00:00:00.000Z");
  });
});
