export const apiUrl = process.env.NODE_ENV === "production"
  ? ""
  : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(`${apiUrl}${path}`, { credentials: "include", ...init });
}

export const calendarUpdatedEvent = "zury:calendar-updated";
