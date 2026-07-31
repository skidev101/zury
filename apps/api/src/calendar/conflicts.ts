import type { CalendarEvent } from "./provider.js";

export interface CalendarConflict {
  event: CalendarEvent;
  reason: "overlap";
}

/** Calendar intervals are half-open: an event ending at the proposed start is safe. */
export function findCalendarConflicts(
  events: CalendarEvent[],
  proposed: Pick<CalendarEvent, "startAt" | "endAt">,
): CalendarConflict[] {
  const start = Date.parse(proposed.startAt);
  const end = Date.parse(proposed.endAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
  return events
    .filter((event) => {
      const eventStart = Date.parse(event.startAt);
      const eventEnd = Date.parse(event.endAt);
      return Number.isFinite(eventStart) && Number.isFinite(eventEnd) && eventStart < end && eventEnd > start;
    })
    .map((event) => ({ event, reason: "overlap" as const }));
}
