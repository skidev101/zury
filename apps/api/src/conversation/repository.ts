import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { DatabaseClient } from "../db/index.js";
import {
  calendarAction,
  calendarPendingIntent,
  conversation,
  conversationMessage,
  conversationRequest,
} from "../db/schema.js";
import type { CalendarCommand } from "../calendar/service.js";
import type {
  CalendarEvent,
  UpdateCalendarEventInput,
} from "../calendar/provider.js";

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: Date;
}

export interface ClaimedAction {
  id: string;
  conversationId: string;
  action: CalendarActionPayload;
}

export type CalendarActionPayload =
  | { type: "create_event"; command: CalendarCommand }
  | {
      type: "update_event";
      event: CalendarEvent;
      changes: Omit<UpdateCalendarEventInput, "externalEventId">;
    }
  | { type: "delete_event"; event: CalendarEvent };

export interface PendingCalendarIntent {
  id: string;
  type: "create_event";
  title: string | null;
  startAt: string | null;
  endAt: string | null;
  durationMinutes: number | null;
  location: string | null;
  description: string | null;
  allDay: boolean;
  timezone: string;
}

export interface PendingAction {
  id: string;
  type: "create_event" | "update_event" | "delete_event";
  payload: string;
  expiresAt: Date;
}

export interface ConversationStore {
  getOrCreate(userId: string, conversationId?: string): Promise<string>;
  create(userId: string): Promise<string>;
  list(userId: string): Promise<ConversationSummary[]>;
  get(
    userId: string,
    conversationId: string,
  ): Promise<{
    id: string;
    title: string;
    messages: StoredMessage[];
    pendingAction: PendingAction | null;
  } | null>;
  getLatest(
    userId: string,
  ): Promise<{
    id: string;
    messages: StoredMessage[];
    pendingAction: PendingAction | null;
  } | null>;
  listMessages(
    userId: string,
    conversationId: string,
  ): Promise<StoredMessage[]>;
  addMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string,
  ): Promise<StoredMessage>;
  createAction(
    userId: string,
    conversationId: string,
    action: CalendarActionPayload,
  ): Promise<string>;
  claimAction(userId: string, actionId: string): Promise<ClaimedAction | null>;
  completeAction(actionId: string, externalEventId: string): Promise<void>;
  failAction(actionId: string, errorCode: string): Promise<void>;
  getPendingIntent(
    userId: string,
    conversationId: string,
  ): Promise<PendingCalendarIntent | null>;
  savePendingIntent(
    userId: string,
    conversationId: string,
    intent: PendingCalendarIntent,
  ): Promise<void>;
  clearPendingIntent(userId: string, conversationId: string): Promise<void>;
  cancelAction(
    userId: string,
    actionId: string,
  ): Promise<{ cancelled: boolean; conversationId: string | null }>;
  deleteConversation(
    userId: string,
    conversationId: string,
  ): Promise<"deleted" | "not_found" | "processing">;
  beginRequest(
    userId: string,
    conversationId: string,
    clientMessageId: string,
  ): Promise<
    | { state: "new" }
    | { state: "processing" }
    | { state: "completed"; response: unknown }
  >;
  completeRequest(
    userId: string,
    clientMessageId: string,
    response: unknown,
  ): Promise<void>;
  failRequest(userId: string, clientMessageId: string): Promise<void>;
}

export class ConversationRepository implements ConversationStore {
  constructor(private readonly db: DatabaseClient) {}

  async getOrCreate(userId: string, conversationId?: string): Promise<string> {
    if (conversationId) {
      const owned = this.db
        .select({ id: conversation.id })
        .from(conversation)
        .where(
          and(
            eq(conversation.id, conversationId),
            eq(conversation.userId, userId),
          ),
        )
        .get();
      if (owned) return owned.id;
    }
    const existing = this.db
      .select({ id: conversation.id })
      .from(conversation)
      .where(eq(conversation.userId, userId))
      .orderBy(desc(conversation.updatedAt))
      .limit(1)
      .get();
    if (existing) return existing.id;
    return this.create(userId);
  }

  async create(userId: string): Promise<string> {
    const id = randomUUID();
    const now = new Date();
    this.db
      .insert(conversation)
      .values({
        id,
        userId,
        title: "Conversation",
        createdAt: now,
        updatedAt: now,
      })
      .run();
    return id;
  }

  async list(userId: string): Promise<ConversationSummary[]> {
    return this.db
      .select({
        id: conversation.id,
        title: conversation.title,
        updatedAt: conversation.updatedAt,
      })
      .from(conversation)
      .where(eq(conversation.userId, userId))
      .orderBy(desc(conversation.updatedAt))
      .limit(50)
      .all();
  }

  async get(userId: string, conversationId: string) {
    const thread = this.db
      .select({ id: conversation.id, title: conversation.title })
      .from(conversation)
      .where(
        and(
          eq(conversation.id, conversationId),
          eq(conversation.userId, userId),
        ),
      )
      .get();
    if (!thread) return null;
    const pending = this.db
      .select({
        id: calendarAction.id,
        type: calendarAction.type,
        payload: calendarAction.payload,
        expiresAt: calendarAction.expiresAt,
      })
      .from(calendarAction)
      .where(
        and(
          eq(calendarAction.conversationId, thread.id),
          eq(calendarAction.status, "pending"),
        ),
      )
      .orderBy(desc(calendarAction.createdAt))
      .limit(1)
      .get();
    return {
      ...thread,
      messages: await this.listMessages(userId, thread.id),
      pendingAction: pending ?? null,
    };
  }

  async getLatest(
    userId: string,
  ): Promise<{
    id: string;
    messages: StoredMessage[];
    pendingAction: PendingAction | null;
  } | null> {
    const thread = this.db
      .select({ id: conversation.id })
      .from(conversation)
      .where(eq(conversation.userId, userId))
      .orderBy(desc(conversation.updatedAt))
      .limit(1)
      .get();
    if (!thread) return null;
    return this.get(userId, thread.id);
  }

  async listMessages(
    userId: string,
    conversationId: string,
  ): Promise<StoredMessage[]> {
    const owned = this.db
      .select({ id: conversation.id })
      .from(conversation)
      .where(
        and(
          eq(conversation.id, conversationId),
          eq(conversation.userId, userId),
        ),
      )
      .get();
    if (!owned) return [];
    return this.db
      .select()
      .from(conversationMessage)
      .where(eq(conversationMessage.conversationId, conversationId))
      .orderBy(conversationMessage.createdAt)
      .all();
  }

  async addMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string,
  ): Promise<StoredMessage> {
    const message = {
      id: randomUUID(),
      conversationId,
      role,
      content,
      createdAt: new Date(),
    };
    this.db.transaction((tx) => {
      tx.insert(conversationMessage).values(message).run();
      const current = tx
        .select({ title: conversation.title })
        .from(conversation)
        .where(eq(conversation.id, conversationId))
        .get();
      const title =
        role === "user" && current?.title === "Conversation"
          ? content.slice(0, 64)
          : current?.title;
      tx.update(conversation)
        .set({ updatedAt: message.createdAt, ...(title ? { title } : {}) })
        .where(eq(conversation.id, conversationId))
        .run();
    });
    return { id: message.id, role, content, createdAt: message.createdAt };
  }

  async createAction(
    userId: string,
    conversationId: string,
    action: CalendarActionPayload,
  ): Promise<string> {
    const id = randomUUID();
    const now = new Date();
    this.db
      .insert(calendarAction)
      .values({
        id,
        userId,
        conversationId,
        type: action.type,
        status: "pending",
        payload: JSON.stringify(action),
        expiresAt: new Date(now.getTime() + 10 * 60_000),
        createdAt: now,
        updatedAt: now,
      })
      .run();
    return id;
  }

  async claimAction(
    userId: string,
    actionId: string,
  ): Promise<ClaimedAction | null> {
    return this.db.transaction((tx) => {
      const action = tx
        .select()
        .from(calendarAction)
        .where(
          and(
            eq(calendarAction.id, actionId),
            eq(calendarAction.userId, userId),
          ),
        )
        .get();
      if (!action || action.status !== "pending") return null;
      if (action.expiresAt <= new Date()) {
        tx.update(calendarAction)
          .set({ status: "expired", updatedAt: new Date() })
          .where(eq(calendarAction.id, action.id))
          .run();
        return null;
      }
      tx.update(calendarAction)
        .set({ status: "processing", updatedAt: new Date() })
        .where(
          and(
            eq(calendarAction.id, action.id),
            eq(calendarAction.status, "pending"),
          ),
        )
        .run();
      return {
        id: action.id,
        conversationId: action.conversationId,
        action: JSON.parse(action.payload) as CalendarActionPayload,
      };
    });
  }

  async completeAction(
    actionId: string,
    externalEventId: string,
  ): Promise<void> {
    this.db
      .update(calendarAction)
      .set({ status: "completed", externalEventId, updatedAt: new Date() })
      .where(eq(calendarAction.id, actionId))
      .run();
  }

  async failAction(actionId: string, errorCode: string): Promise<void> {
    this.db
      .update(calendarAction)
      .set({ status: "failed", errorCode, updatedAt: new Date() })
      .where(eq(calendarAction.id, actionId))
      .run();
  }

  async getPendingIntent(
    userId: string,
    conversationId: string,
  ): Promise<PendingCalendarIntent | null> {
    const row = this.db
      .select()
      .from(calendarPendingIntent)
      .where(
        and(
          eq(calendarPendingIntent.userId, userId),
          eq(calendarPendingIntent.conversationId, conversationId),
        ),
      )
      .get();
    if (!row) return null;
    if (row.expiresAt <= new Date()) {
      this.db
        .delete(calendarPendingIntent)
        .where(eq(calendarPendingIntent.id, row.id))
        .run();
      return null;
    }
    return JSON.parse(row.payload) as PendingCalendarIntent;
  }

  async savePendingIntent(
    userId: string,
    conversationId: string,
    intent: PendingCalendarIntent,
  ): Promise<void> {
    const now = new Date();
    this.db
      .insert(calendarPendingIntent)
      .values({
        id: intent.id,
        userId,
        conversationId,
        type: intent.type,
        payload: JSON.stringify(intent),
        expiresAt: new Date(now.getTime() + 30 * 60_000),
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: calendarPendingIntent.conversationId,
        set: {
          payload: JSON.stringify(intent),
          expiresAt: new Date(now.getTime() + 30 * 60_000),
          updatedAt: now,
        },
      })
      .run();
  }

  async clearPendingIntent(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    this.db
      .delete(calendarPendingIntent)
      .where(
        and(
          eq(calendarPendingIntent.userId, userId),
          eq(calendarPendingIntent.conversationId, conversationId),
        ),
      )
      .run();
  }

  async cancelAction(
    userId: string,
    actionId: string,
  ): Promise<{ cancelled: boolean; conversationId: string | null }> {
    const action = this.db
      .select({ conversationId: calendarAction.conversationId })
      .from(calendarAction)
      .where(
        and(
          eq(calendarAction.id, actionId),
          eq(calendarAction.userId, userId),
          eq(calendarAction.status, "pending"),
        ),
      )
      .get();
    if (!action) return { cancelled: false, conversationId: null };
    this.db
      .update(calendarAction)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(calendarAction.id, actionId))
      .run();
    return { cancelled: true, conversationId: action.conversationId };
  }

  async deleteConversation(
    userId: string,
    conversationId: string,
  ): Promise<"deleted" | "not_found" | "processing"> {
    return this.db.transaction((tx) => {
      const owned = tx
        .select({ id: conversation.id })
        .from(conversation)
        .where(
          and(
            eq(conversation.id, conversationId),
            eq(conversation.userId, userId),
          ),
        )
        .get();
      if (!owned) return "not_found";

      const processing = tx
        .select({ id: calendarAction.id })
        .from(calendarAction)
        .where(
          and(
            eq(calendarAction.conversationId, conversationId),
            eq(calendarAction.status, "processing"),
          ),
        )
        .get();
      if (processing) return "processing";

      tx.update(calendarAction)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(
          and(
            eq(calendarAction.conversationId, conversationId),
            eq(calendarAction.status, "pending"),
          ),
        )
        .run();
      tx.delete(calendarPendingIntent)
        .where(eq(calendarPendingIntent.conversationId, conversationId))
        .run();
      tx.delete(conversation).where(eq(conversation.id, conversationId)).run();
      return "deleted";
    });
  }

  async beginRequest(
    userId: string,
    conversationId: string,
    clientMessageId: string,
  ) {
    return this.db.transaction((tx) => {
      const existing = tx
        .select()
        .from(conversationRequest)
        .where(and(eq(conversationRequest.userId, userId), eq(conversationRequest.clientMessageId, clientMessageId)))
        .get();
      if (existing) {
        if (existing.conversationId !== conversationId) return { state: "processing" as const };
        if (existing.status === "completed" && existing.response) {
          return { state: "completed" as const, response: JSON.parse(existing.response) as unknown };
        }
        return { state: "processing" as const };
      }
      const now = new Date();
      tx.insert(conversationRequest).values({ id: randomUUID(), userId, conversationId, clientMessageId, status: "processing", createdAt: now, updatedAt: now }).run();
      return { state: "new" as const };
    });
  }

  async completeRequest(
    userId: string,
    clientMessageId: string,
    response: unknown,
  ): Promise<void> {
    this.db
      .update(conversationRequest)
      .set({
        status: "completed",
        response: JSON.stringify(response),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(conversationRequest.userId, userId),
          eq(conversationRequest.clientMessageId, clientMessageId),
        ),
      )
      .run();
  }

  async failRequest(userId: string, clientMessageId: string): Promise<void> {
    this.db
      .update(conversationRequest)
      .set({ status: "failed", updatedAt: new Date() })
      .where(
        and(
          eq(conversationRequest.userId, userId),
          eq(conversationRequest.clientMessageId, clientMessageId),
        ),
      )
      .run();
  }
}
