export type EventType = "Class" | "Exam" | "Meeting" | "Assignment";

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  type: EventType;
}

export interface NavItem {
  label: string;
  icon: "home" | "calendar" | "study" | "chat" | "connections" | "settings";
  active?: boolean;
}
