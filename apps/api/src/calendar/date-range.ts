import { z } from "zod";
import { CalendarError } from "./errors.js";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const todayQuerySchema = z.object({
  date: z.string().regex(datePattern).refine(isRealDate, "Date must be a valid calendar date"),
  timezone: z.string().min(1).max(100).refine(isIanaTimezone, "Timezone must be a valid IANA timezone"),
});

export const calendarRangeQuerySchema = z.object({
  start: z.string().datetime({ offset: true }),
  end: z.string().datetime({ offset: true }),
  timezone: z.string().min(1).max(100).refine(isIanaTimezone, "Timezone must be a valid IANA timezone"),
}).superRefine((value, context) => {
  const start = new Date(value.start).getTime();
  const end = new Date(value.end).getTime();
  const maxRange = 31 * 24 * 60 * 60 * 1000;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["end"], message: "End must be after start." });
  } else if (end - start > maxRange) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["end"], message: "Calendar ranges cannot exceed 31 days." });
  }
});

export function getDayRange(date: string, timezone: string): { rangeStart: string; rangeEnd: string } {
  const parsed = todayQuerySchema.safeParse({ date, timezone });
  if (!parsed.success) {
    throw new CalendarError("INVALID_DATE_RANGE", "Choose a valid date and timezone.", parsed.error);
  }

  const rangeStart = zonedMidnightToUtc(date, timezone);
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  const rangeEnd = zonedMidnightToUtc(nextDate, timezone);
  return { rangeStart: rangeStart.toISOString(), rangeEnd: rangeEnd.toISOString() };
}

export function zonedDateTimeToUtc(value: string, timezone: string): string {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match || !isIanaTimezone(timezone) || !isRealDate(match[1]!)) {
    throw new CalendarError("INVALID_DATE_RANGE", "Choose a valid date, time and timezone.");
  }
  const [, date, hour, minute, second = "00"] = match;
  const midnight = zonedMidnightToUtc(date!, timezone).getTime();
  return new Date(midnight + Number(hour) * 3_600_000 + Number(minute) * 60_000 + Number(second) * 1_000).toISOString();
}

function zonedMidnightToUtc(date: string, timezone: string): Date {
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const target = Date.UTC(year, month - 1, day);
  let guess = target;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(guess)).map((part) => [part.type, part.value]));
    const represented = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    guess += target - represented;
  }
  return new Date(guess);
}

function isRealDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) === value;
}

function isIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}
