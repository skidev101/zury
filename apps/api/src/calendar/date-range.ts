import { z } from "zod";
import { CalendarError } from "./errors.js";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const todayQuerySchema = z.object({
  date: z.string().regex(datePattern).refine(isRealDate, "Date must be a valid calendar date"),
  timezone: z.string().min(1).max(100).refine(isIanaTimezone, "Timezone must be a valid IANA timezone"),
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
