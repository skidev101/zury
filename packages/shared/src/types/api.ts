import type { CalendarEvent } from "./index";

export interface TodayOverviewResponse {
  date: string;
  greeting: string;
  focusMessage: string;
  nextEvent: CalendarEvent | null;
  events: CalendarEvent[];
  stats: {
    classesCount: number;
    tasksCount: number;
    freeHours: number;
  };
}

export interface CalendarMonthResponse {
  year: number;
  month: number;
  events: CalendarEvent[];
  daysWithEvents: number[];
}

export interface CalendarDayResponse {
  date: string;
  events: CalendarEvent[];
}
