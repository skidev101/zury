import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getDayRange } from "./date-range.js";
import { CalendarError } from "./errors.js";

describe("calendar date ranges", () => {
  it("uses the requested timezone at DST boundaries", () => {
    const range = getDayRange("2026-07-30", "Africa/Lagos");
    assert.equal(range.rangeStart, "2026-07-29T23:00:00.000Z");
    assert.equal(range.rangeEnd, "2026-07-30T23:00:00.000Z");
  });

  it("rejects invalid dates and timezones", () => {
    assert.throws(() => getDayRange("2026-02-30", "UTC"), CalendarError);
    assert.throws(() => getDayRange("2026-07-30", "not/a-timezone"), CalendarError);
  });
});
