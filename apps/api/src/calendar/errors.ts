export type CalendarErrorCode =
  | "CALENDAR_NOT_CONNECTED"
  | "CALENDAR_UNAVAILABLE"
  | "CALENDAR_AUTHORIZATION_FAILED"
  | "CALENDAR_RECONNECT_REQUIRED"
  | "INVALID_DATE_RANGE";

export class CalendarError extends Error {
  constructor(
    public readonly code: CalendarErrorCode,
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = "CalendarError";
  }
}

export function isReconnectError(error: unknown): boolean {
  return error instanceof CalendarError && error.code === "CALENDAR_RECONNECT_REQUIRED";
}
