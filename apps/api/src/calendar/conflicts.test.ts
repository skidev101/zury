import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findCalendarConflicts } from "./conflicts.js";
import type { CalendarEvent } from "./provider.js";

const event = (startAt: string, endAt: string, allDay = false): CalendarEvent => ({ id: "event", calendarId: "primary", title: "Existing", description: null, location: null, startAt, endAt, allDay, status: "confirmed" });

describe("findCalendarConflicts", () => {
  it("detects overlap but not exact boundaries", () => {
    assert.equal(findCalendarConflicts([event("2026-08-01T10:00:00Z", "2026-08-01T11:00:00Z")], { startAt: "2026-08-01T11:00:00Z", endAt: "2026-08-01T12:00:00Z" }).length, 0);
    assert.equal(findCalendarConflicts([event("2026-08-01T10:00:00Z", "2026-08-01T11:00:00Z")], { startAt: "2026-08-01T10:30:00Z", endAt: "2026-08-01T12:00:00Z" }).length, 1);
  });

  it("handles all-day ranges as intervals", () => {
    assert.equal(findCalendarConflicts([event("2026-08-01T00:00:00Z", "2026-08-02T00:00:00Z", true)], { startAt: "2026-08-01T12:00:00Z", endAt: "2026-08-01T13:00:00Z" }).length, 1);
  });
});
