import type { NavItem, TimelineEvent } from "./types";

export const navigation: NavItem[] = [
  { label: "Home", icon: "home", active: true },
  { label: "Planner", icon: "calendar" },
  { label: "Study", icon: "study" },
  { label: "Conversation", icon: "chat" },
  { label: "Connections", icon: "connections" },
  { label: "Settings", icon: "settings" },
];

export const upcomingEvents: TimelineEvent[] = [
  { id: "event-1", time: "10:00", title: "Data Structures", type: "Class" },
  { id: "event-2", time: "13:30", title: "Research group check-in", type: "Meeting" },
  { id: "event-3", time: "Tomorrow", title: "Calculus problem set", type: "Assignment" },
  { id: "event-4", time: "Thu", title: "Operating Systems", type: "Class" },
  { id: "event-5", time: "Fri", title: "Networks midterm", type: "Exam" },
];

export const insights = [
  "You have two deadlines this week.",
  "Tomorrow afternoon is clear.",
  "Algorithms has not been opened in 4 days.",
];

export const githubActivity = {
  repository: "campus-project/mobile-client",
  openPullRequests: 2,
  recentCommits: ["Refine offline state handling", "Add course detail navigation"],
};

export const recentStudy = [
  { subject: "Algorithms", detail: "Greedy methods", time: "2h ago" },
  { subject: "Calculus II", detail: "Integration notes", time: "Yesterday" },
  { subject: "Operating Systems", detail: "Process scheduling", time: "Mon" },
];

export const quickActions = [
  { label: "New event", icon: "plus" },
  { label: "Study notes", icon: "note" },
  { label: "Ask Zury", icon: "spark" },
  { label: "Connect GitHub", icon: "branch" },
] as const;
