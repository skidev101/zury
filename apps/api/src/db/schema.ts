import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// Better Auth owns these tables. Regenerate the schema and migration whenever
// authentication configuration changes.
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const calendarConnection = sqliteTable(
  "calendar_connection",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    status: text("status", { enum: ["connected", "reconnect_required"] })
      .notNull()
      .default("connected"),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
    scope: text("scope").notNull(),
    connectedAt: integer("connected_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("calendar_connection_user_provider_idx").on(table.userId, table.provider),
    index("calendar_connection_user_id_idx").on(table.userId),
  ],
);

export const calendarEventSnapshot = sqliteTable(
  "calendar_event_snapshot",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    externalEventId: text("external_event_id").notNull(),
    calendarId: text("calendar_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    startAt: text("start_at").notNull(),
    endAt: text("end_at").notNull(),
    allDay: integer("all_day", { mode: "boolean" }).notNull(),
    status: text("status").notNull(),
    fetchedAt: integer("fetched_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("calendar_event_user_external_idx").on(
      table.userId,
      table.calendarId,
      table.externalEventId,
    ),
    index("calendar_event_user_range_idx").on(table.userId, table.startAt, table.endAt),
  ],
);

export const calendarSnapshot = sqliteTable(
  "calendar_snapshot",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rangeStart: text("range_start").notNull(),
    rangeEnd: text("range_end").notNull(),
    fetchedAt: integer("fetched_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("calendar_snapshot_user_range_idx").on(table.userId, table.rangeStart, table.rangeEnd),
  ],
);

export const calendarAuthorizationState = sqliteTable(
  "calendar_authorization_state",
  {
    id: text("id").primaryKey(),
    stateHash: text("state_hash").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("calendar_authorization_state_user_idx").on(table.userId),
    index("calendar_authorization_state_expiry_idx").on(table.expiresAt),
  ],
);

export const conversation = sqliteTable(
  "conversation",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("conversation_user_updated_idx").on(table.userId, table.updatedAt)],
);

export const conversationMessage = sqliteTable(
  "conversation_message",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id").notNull().references(() => conversation.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("conversation_message_conversation_idx").on(table.conversationId, table.createdAt)],
);

export const conversationRequest = sqliteTable(
  "conversation_request",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    conversationId: text("conversation_id").notNull().references(() => conversation.id, { onDelete: "cascade" }),
    clientMessageId: text("client_message_id").notNull(),
    status: text("status", { enum: ["processing", "completed", "failed"] }).notNull(),
    response: text("response"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [uniqueIndex("conversation_request_user_client_idx").on(table.userId, table.clientMessageId)],
);

export const calendarAction = sqliteTable(
  "calendar_action",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    conversationId: text("conversation_id").notNull().references(() => conversation.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["create_event", "update_event", "delete_event"] }).notNull(),
    status: text("status", { enum: ["pending", "processing", "completed", "failed", "expired", "cancelled"] }).notNull(),
    payload: text("payload").notNull(),
    externalEventId: text("external_event_id"),
    errorCode: text("error_code"),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("calendar_action_user_status_idx").on(table.userId, table.status),
    index("calendar_action_conversation_idx").on(table.conversationId),
  ],
);

export const calendarPendingIntent = sqliteTable(
  "calendar_pending_intent",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    conversationId: text("conversation_id").notNull().references(() => conversation.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["create_event", "update_event", "delete_event"] }).notNull(),
    payload: text("payload").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("calendar_pending_intent_conversation_idx").on(table.conversationId),
    index("calendar_pending_intent_user_expiry_idx").on(table.userId, table.expiresAt),
  ],
);

export const githubConnection = sqliteTable(
  "github_connection",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["connected", "reconnect_required"] }).notNull().default("connected"),
    accessToken: text("access_token").notNull(),
    connectedAt: integer("connected_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [uniqueIndex("github_connection_user_idx").on(table.userId)],
);

export const githubAuthorizationState = sqliteTable(
  "github_authorization_state",
  {
    id: text("id").primaryKey(),
    stateHash: text("state_hash").notNull().unique(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("github_authorization_state_expiry_idx").on(table.expiresAt)],
);

export const githubRepository = sqliteTable(
  "github_repository",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    name: text("name").notNull(),
    fullName: text("full_name").notNull(),
    description: text("description"),
    selected: integer("selected", { mode: "boolean" }).notNull().default(false),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [uniqueIndex("github_repository_user_external_idx").on(table.userId, table.externalId)],
);

export const githubActivitySnapshot = sqliteTable(
  "github_activity_snapshot",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    repositoryId: text("repository_id").notNull(),
    payload: text("payload").notNull(),
    fetchedAt: integer("fetched_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [uniqueIndex("github_activity_user_repo_idx").on(table.userId, table.repositoryId)],
);
