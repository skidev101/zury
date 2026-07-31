// Core domain types for Zury

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  googleEventId: string | null;
  syncStatus: SyncStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncQueueItem {
  id: string;
  userId: string;
  entityType: "event";
  entityId: string;
  operation: "create" | "update" | "delete";
  payload: unknown;
  attempts: number;
  lastAttemptAt: Date | null;
  createdAt: Date;
}

export interface GitHubRepo {
  id: string;
  userId: string;
  repoFullName: string;
  description: string | null;
  cachedAt: Date;
}

export interface Connection {
  id: string;
  userId: string;
  provider: "google_calendar" | "github";
  status: ConnectionStatus;
  connectedAt: Date | null;
  errorMessage: string | null;
}

export interface StudyNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type SyncStatus = "local" | "synced" | "pending" | "error";
export type ConnectionStatus = "not_connected" | "connecting" | "connected" | "reconnect_required" | "error";

export * from "./api.js";
