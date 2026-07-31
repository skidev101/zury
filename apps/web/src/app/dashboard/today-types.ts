export type CalendarState =
  | "disconnected"
  | "current"
  | "saved"
  | "device_saved"
  | "unavailable"
  | "reconnect_required";

export interface TodayEvent {
  id: string;
  title: string;
  location: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
}

export interface TodayData {
  calendar: {
    state: CalendarState;
    updatedAt: string | null;
  };
  events: TodayEvent[];
  github: {
    state: "disconnected" | "current" | "saved" | "unavailable";
    activity: {
      commits: Array<{ id: string; message: string; author: string | null; committedAt: string }>;
      pullRequests: Array<{ id: string; title: string; repository: string; url: string; updatedAt: string }>;
    };
  };
}

export interface DeviceTodaySnapshot {
  key: string;
  savedAt: string;
  data: TodayData;
}
