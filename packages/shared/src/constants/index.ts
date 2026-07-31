// Design system tokens
export const COLORS = {
  background: "#09090B",
  surface: "#111113",
  accent: "#10B981",
  primaryText: "#FAFAFA",
  muted: "#A1A1AA",
} as const;

// API base paths
export const API_ROUTES = {
  auth: "/api/auth",
  events: "/api/events",
  agent: "/api/agent",
  connections: "/api/connections",
  github: "/api/github",
  notes: "/api/notes",
  sync: "/api/sync",
} as const;

// Sync constants
export const SYNC_CONSTANTS = {
  maxRetries: 3,
  retryDelayMs: 5_000,
  syncIntervalMs: 60_000,
} as const;

// Connection providers
export const CONNECTION_PROVIDERS = ["google_calendar", "github"] as const;
export type ConnectionProvider = (typeof CONNECTION_PROVIDERS)[number];

// Pagination defaults
export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
} as const;

// AI model
export const AI_MODEL = "gemma4:e2b-cloud" as const;
