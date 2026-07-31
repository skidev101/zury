import { z } from "zod";
import { CalendarError } from "../calendar/errors.js";
import {
  CalendarService,
  type CalendarCommand,
  type CalendarRangeResponse,
} from "../calendar/service.js";
import type { AgentRuntime } from "../agent/runtime.js";
import type { ConversationStore, PendingCalendarIntent, StoredMessage } from "./repository.js";
import { logger } from "../config/logger.js";
import { randomUUID } from "node:crypto";
import type { GitHubActivity } from "../github/provider.js";
import { zonedDateTimeToUtc } from "../calendar/date-range.js";

interface GitHubContextReader {
  activity(userId: string): Promise<{ state: "disconnected" | "current" | "saved" | "unavailable"; activity: GitHubActivity }>;
}

export const intentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("answer"), message: z.string().min(1).max(4000) }),
  z.object({
    type: z.literal("calendar_query"),
    startAt: z.string().datetime({ offset: true }),
    endAt: z.string().datetime({ offset: true }),
  }),
  z.object({
    type: z.literal("calendar_create"),
    title: z.string().nullable(),
    startAt: z.string().datetime({ offset: true }).nullable(),
    endAt: z.string().datetime({ offset: true }).nullable(),
    location: z.string().nullable(),
    description: z.string().nullable(),
    allDay: z.boolean(),
    missingFields: z.array(z.enum(["title", "startAt", "endAt"])).max(3),
  }),
  z.object({
    type: z.literal("calendar_update"),
    targetTitle: z.string().min(1).max(200),
    rangeStart: z.string().datetime({ offset: true }),
    rangeEnd: z.string().datetime({ offset: true }),
    title: z.string().nullable().optional(),
    startAt: z.string().datetime({ offset: true }).nullable().optional(),
    endAt: z.string().datetime({ offset: true }).nullable().optional(),
    location: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    allDay: z.boolean().nullable().optional(),
  }),
  z.object({
    type: z.literal("calendar_delete"),
    targetTitle: z.string().min(1).max(200),
    rangeStart: z.string().datetime({ offset: true }),
    rangeEnd: z.string().datetime({ offset: true }),
  }),
  z.object({
    type: z.literal("clarification"),
    message: z.string().min(1).max(1000),
  }),
]);
type Intent = z.infer<typeof intentSchema>;

export type ConversationResponse =
  | {
      type: "answer";
      message: string;
      conversationId: string;
      resolvedActionId?: string;
      calendarState?: CalendarRangeResponse["calendar"];
    }
  | {
      type: "confirmation";
      message: string;
      conversationId: string;
      actionId: string;
      action: {
        type: "create_event" | "update_event" | "delete_event";
        title: string;
        startAt: string;
        endAt: string;
        location: string | null;
        conflicts: Array<{ title: string; startAt: string; endAt: string; allDay: boolean }>;
        availability: CalendarRangeResponse["calendar"]["state"];
        originalTitle?: string;
      };
      command: Pick<
        CalendarCommand,
        "title" | "startAt" | "endAt" | "timezone"
      >;
      conflicts?: Array<{ id: string; title: string; startAt: string; endAt: string; allDay: boolean }>;
      availability: CalendarRangeResponse["calendar"]["state"];
    }
  | { type: "clarification"; message: string; conversationId: string }
  | { type: "error"; message: string; code: string; conversationId?: string };

const intentJsonSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["answer", "calendar_query", "calendar_create", "calendar_update", "calendar_delete", "clarification"],
    },
    message: { type: "string" },
    startAt: { type: ["string", "null"], format: "date-time" },
    endAt: { type: ["string", "null"], format: "date-time" },
    title: { type: ["string", "null"] },
    location: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    allDay: { type: "boolean" },
    missingFields: {
      type: "array",
      items: { type: "string", enum: ["title", "startAt", "endAt"] },
    },
    targetTitle: { type: "string" },
    rangeStart: { type: ["string", "null"], format: "date-time" },
    rangeEnd: { type: ["string", "null"], format: "date-time" },
  },
  required: ["type"],
  additionalProperties: false,
};

export class ConversationService {
  constructor(
    private readonly runtime: AgentRuntime,
    private readonly calendar: CalendarService,
    private readonly repository: ConversationStore,
    private readonly github?: GitHubContextReader,
  ) {}

  async latest(userId: string) {
    return this.repository.getLatest(userId);
  }

  async list(userId: string) { return this.repository.list(userId); }
  async get(userId: string, conversationId: string) { return this.repository.get(userId, conversationId); }
  async create(userId: string) { return { id: await this.repository.create(userId) }; }
  async delete(userId: string, conversationId: string) { return this.repository.deleteConversation(userId, conversationId); }

  async respond(
    userId: string,
    message: string,
    timezone: string,
    conversationId?: string,
    clientMessageId?: string,
  ): Promise<ConversationResponse> {
    const id = await this.repository.getOrCreate(userId, conversationId);
    if (clientMessageId) {
      const request = await this.repository.beginRequest(userId, id, clientMessageId);
      if (request.state === "completed") return request.response as ConversationResponse;
      if (request.state === "processing") return { type: "error", code: "MESSAGE_PROCESSING", message: "Zury is still working on that message.", conversationId: id };
    }
    try {
    await this.repository.addMessage(id, "user", message.trim());
    const thread = await this.repository.get(userId, id);
    if (thread?.pendingAction && isAffirmative(message)) {
      const result = await this.confirm(userId, thread.pendingAction.id);
      const response = result.type === "answer" ? { ...result, resolvedActionId: thread.pendingAction.id } : result;
      if (clientMessageId) await this.repository.completeRequest(userId, clientMessageId, response);
      return response;
    }
    if (thread?.pendingAction && isNegative(message)) {
      const result = await this.cancel(userId, thread.pendingAction.id);
      const response = result.type === "answer" ? { ...result, resolvedActionId: thread.pendingAction.id } : result;
      if (clientMessageId) await this.repository.completeRequest(userId, clientMessageId, response);
      return response;
    }
    const history = await this.repository.listMessages(userId, id);
    const github = this.github
      ? await this.github.activity(userId)
      : { state: "disconnected" as const, activity: { commits: [], pullRequests: [] } };
    const structured = await this.runtime.runStructured({
      prompt: JSON.stringify({
        timezone,
        now: new Date().toISOString(),
        message: message.trim(),
        history: history.slice(-12).map(publicMessage),
        pendingIntent: await this.repository.getPendingIntent(userId, id),
        pendingAction: thread?.pendingAction ? publicPendingAction(thread.pendingAction) : null,
        github: { state: github.state, activity: { commits: github.activity.commits.slice(0, 15), pullRequests: github.activity.pullRequests.slice(0, 15) } },
      }),
      systemInstruction:
        "You are Zury's intent classifier. Return one valid JSON object only. Resolve relative dates using the supplied timezone and current time. If pendingIntent is present, treat the new message as a follow-up to that calendar request and return calendar_create. If pendingAction is present and the user corrects or changes its details, return the same calendar intent with a complete revised proposal based on pendingAction. A question about the user's schedule must be calendar_query. A request to add or schedule something must be calendar_create. A request to move or change an existing event must be calendar_update. A request to delete or cancel an existing event must be calendar_delete. For update and delete, return the exact event title or identifying phrase and an explicit rangeStart and rangeEnd covering the requested time. Never choose an event or perform an action. For GitHub project questions, use only the supplied github activity. Never invent commits, pull requests, authors, dates, or project activity. If GitHub is disconnected, unavailable, or the activity is insufficient, say so. If its state is saved, clearly say the information is saved rather than current. For ordinary academic questions return answer.",
      jsonSchema: intentJsonSchema,
    });
    if (!structured.ok) {
      logger.warn("Conversation intent generation failed", {
        userId,
        conversationId: id,
        code: structured.error.code,
      });
      const errorMessage = structured.error.code === "PROVIDER_UNAVAILABLE" ? "Zury isn't available just now. Please try again." : "Zury couldn't understand that just now.";
      await this.repository.addMessage(id, "assistant", errorMessage);
      const response: ConversationResponse = {
        type: "error",
        code: structured.error.code,
        message: errorMessage,
        conversationId: id,
      };
      if (clientMessageId) await this.repository.completeRequest(userId, clientMessageId, response);
      return response;
    }
    const pending = await this.repository.getPendingIntent(userId, id);
    const parsed = intentSchema.safeParse(normalizeIntent(structured.value.value, timezone, pending));
    if (!parsed.success) {
      logger.warn("Conversation intent validation failed", {
        userId,
        conversationId: id,
        receivedType: getIntentType(structured.value.value),
        receivedKeys: getIntentKeys(structured.value.value),
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), code: issue.code })),
      });
      const errorMessage = "Zury couldn't understand that just now.";
      await this.repository.addMessage(id, "assistant", errorMessage);
      const response: ConversationResponse = {
        type: "error",
        code: "INVALID_AI_INTENT",
        message: errorMessage,
        conversationId: id,
      };
      if (clientMessageId) await this.repository.completeRequest(userId, clientMessageId, response);
      return response;
    }
    const response = await this.handleIntent(userId, id, timezone, pending ? mergePendingIntent(pending, parsed.data) : parsed.data, thread?.pendingAction?.id);
    if (clientMessageId) await this.repository.completeRequest(userId, clientMessageId, response);
    return response;
    } catch (error) {
      if (clientMessageId) await this.repository.failRequest(userId, clientMessageId);
      throw error;
    }
  }

  async confirm(
    userId: string,
    actionId: string,
  ): Promise<ConversationResponse> {
    const action = await this.repository.claimAction(userId, actionId);
    if (!action)
      return {
        type: "error",
        code: "ACTION_EXPIRED",
        message: "That calendar action is no longer available.",
      };
    try {
      let message: string;
      let externalEventId: string;
      if (action.action.type === "create_event") {
        const event = await this.calendar.createEvent(userId, action.action.command);
        message = `${event.title} was added to your calendar.`;
        externalEventId = event.id;
      } else if (action.action.type === "update_event") {
        const event = await this.calendar.updateEvent(userId, { ...action.action.changes, externalEventId: action.action.event.id });
        message = `${event.title} was updated in your calendar.`;
        externalEventId = event.id;
      } else {
        await this.calendar.deleteEvent(userId, { externalEventId: action.action.event.id });
        message = `${action.action.event.title} was removed from your calendar.`;
        externalEventId = action.action.event.id;
      }
      await this.repository.completeAction(action.id, externalEventId);
      await this.repository.addMessage(
        action.conversationId,
        "assistant",
        message,
      );
      return { type: "answer", message, conversationId: action.conversationId };
    } catch (error) {
      const code =
        error instanceof CalendarError ? error.code : "CALENDAR_UNAVAILABLE";
      await this.repository.failAction(action.id, code);
      return {
        type: "error",
        code,
        message:
          error instanceof CalendarError
            ? error.message
            : "The event could not be saved just now.",
        conversationId: action.conversationId,
      };
    }
  }

  async cancel(userId: string, actionId: string): Promise<ConversationResponse> {
    const result = await this.repository.cancelAction(userId, actionId);
    return result.cancelled
      ? { type: "answer", message: "I cancelled that calendar change.", conversationId: result.conversationId! }
      : { type: "error", code: "ACTION_EXPIRED", message: "That calendar action is no longer available." };
  }

  private async handleIntent(
    userId: string,
    conversationId: string,
    timezone: string,
    intent: Intent,
    pendingActionId?: string,
  ): Promise<ConversationResponse> {
    if (intent.type === "answer")
      return this.saveAnswer(conversationId, intent.message);
    if (intent.type === "clarification") {
      await this.repository.addMessage(
        conversationId,
        "assistant",
        intent.message,
      );
      return { type: "clarification", conversationId, message: intent.message };
    }
    if (intent.type === "calendar_query") {
      const result = await this.calendar.getRange(
        userId,
        intent.startAt,
        intent.endAt,
        timezone,
      );
      const message = formatCalendarAnswer(result, timezone);
      await this.repository.addMessage(conversationId, "assistant", message);
      return {
        type: "answer",
        message,
        conversationId,
        calendarState: result.calendar,
      };
    }
    if (intent.type === "calendar_update" || intent.type === "calendar_delete") {
      const range = await this.calendar.getRange(userId, intent.rangeStart, intent.rangeEnd, timezone);
      const matches = range.events.filter((event) => event.title.toLowerCase().includes(intent.targetTitle.toLowerCase()));
      if (matches.length !== 1) {
        const message = matches.length === 0
          ? `I couldn't find a calendar event called “${intent.targetTitle}” in that time range.`
          : `I found more than one event called “${intent.targetTitle}”. Please tell me which time you mean.`;
        await this.repository.addMessage(conversationId, "assistant", message);
        return { type: "clarification", conversationId, message };
      }
      const event = matches[0];
      if (!event) {
        const message = "I couldn't identify that calendar event safely.";
        await this.repository.addMessage(conversationId, "assistant", message);
        return { type: "clarification", conversationId, message };
      }
      if (intent.type === "calendar_delete") {
        if (pendingActionId) await this.repository.cancelAction(userId, pendingActionId);
        const actionId = await this.repository.createAction(userId, conversationId, { type: "delete_event", event });
        const message = `Delete ${event.title} on ${formatDate(event.startAt, timezone)} from your calendar? This cannot be undone.`;
        await this.repository.addMessage(conversationId, "assistant", message);
        return {
          type: "confirmation", conversationId, actionId, message,
          action: { type: "delete_event", title: event.title, originalTitle: event.title, startAt: event.startAt, endAt: event.endAt, location: event.location, conflicts: [], availability: range.calendar.state },
          command: { title: event.title, startAt: event.startAt, endAt: event.endAt, timezone }, conflicts: [], availability: range.calendar.state,
        };
      }
      if (!intent.title && !intent.startAt && !intent.endAt && intent.location == null && intent.description == null && intent.allDay == null) {
        const message = "What would you like to change about that event?";
        await this.repository.addMessage(conversationId, "assistant", message);
        return { type: "clarification", conversationId, message };
      }
      const changes = {
        timezone,
        ...(intent.title ? { title: intent.title } : {}),
        ...(intent.startAt ? { startAt: intent.startAt } : {}),
        ...(intent.endAt ? { endAt: intent.endAt } : {}),
        ...(intent.location !== null && intent.location !== undefined ? { location: intent.location } : {}),
        ...(intent.description !== null && intent.description !== undefined ? { description: intent.description } : {}),
        ...(intent.allDay !== null && intent.allDay !== undefined ? { allDay: intent.allDay } : {}),
      };
      const nextStart = intent.startAt ?? event.startAt;
      const existingDuration = Date.parse(event.endAt) - Date.parse(event.startAt);
      const nextEnd = intent.endAt ?? (intent.startAt ? new Date(Date.parse(intent.startAt) + existingDuration).toISOString() : event.endAt);
      if (Date.parse(nextEnd) <= Date.parse(nextStart)) {
        const message = "The new event time must end after it starts.";
        await this.repository.addMessage(conversationId, "assistant", message);
        return { type: "clarification", conversationId, message };
      }
      const conflicts = intent.startAt || intent.endAt ? await this.calendar.checkConflicts(userId, nextStart, nextEnd, timezone) : { calendar: range.calendar, conflicts: [] };
      if (pendingActionId) await this.repository.cancelAction(userId, pendingActionId);
      const actionId = await this.repository.createAction(userId, conversationId, { type: "update_event", event, changes });
      const message = `Update ${event.title} on ${formatDate(event.startAt, timezone)} with the proposed changes?`;
      await this.repository.addMessage(conversationId, "assistant", message);
      return {
        type: "confirmation", conversationId, actionId, message,
        action: { type: "update_event", title: intent.title ?? event.title, originalTitle: event.title, startAt: nextStart, endAt: nextEnd, location: intent.location !== null && intent.location !== undefined ? intent.location : event.location, conflicts: conflicts.conflicts.map(({ event: conflict }) => ({ title: conflict.title, startAt: conflict.startAt, endAt: conflict.endAt, allDay: conflict.allDay })), availability: conflicts.calendar.state },
        command: { title: intent.title ?? event.title, startAt: nextStart, endAt: nextEnd, timezone }, conflicts: conflicts.conflicts.map(({ event: conflict }) => ({ id: conflict.id, title: conflict.title, startAt: conflict.startAt, endAt: conflict.endAt, allDay: conflict.allDay })), availability: conflicts.calendar.state,
      };
    }
    if (
      intent.missingFields.length ||
      !intent.title ||
      !intent.startAt ||
      !intent.endAt
    ) {
      const message = missingMessage(intent.missingFields);
      await this.repository.savePendingIntent(userId, conversationId, {
        id: randomUUID(), type: "create_event", title: intent.title, startAt: intent.startAt, endAt: intent.endAt,
        durationMinutes: null, location: intent.location, description: intent.description, allDay: intent.allDay, timezone,
      });
      await this.repository.addMessage(conversationId, "assistant", message);
      return { type: "clarification", conversationId, message };
    }
    const command: CalendarCommand = {
      title: intent.title,
      startAt: intent.startAt,
      endAt: intent.endAt,
      location: intent.location,
      description: intent.description,
      allDay: intent.allDay,
      timezone,
    };
    await this.repository.clearPendingIntent(userId, conversationId);
    const availability = await this.calendar.checkConflicts(userId, command.startAt, command.endAt, timezone);
    if (pendingActionId) await this.repository.cancelAction(userId, pendingActionId);
    const actionId = await this.repository.createAction(
      userId,
      conversationId,
      { type: "create_event", command },
    );
     const message = availability.conflicts.length
       ? `I can add ${command.title} for ${formatDate(command.startAt, timezone)}, but it overlaps another calendar event. Would you like to continue anyway?`
       : availability.calendar.state === "unavailable"
         ? `I can add ${command.title} for ${formatDate(command.startAt, timezone)}. I couldn't verify availability before confirmation. Would you like me to save it to your calendar?`
         : `I can add ${command.title} for ${formatDate(command.startAt, timezone)}. Would you like me to save it to your calendar?`;
    await this.repository.addMessage(conversationId, "assistant", message);
    return {
      type: "confirmation",
      conversationId,
      actionId,
      action: {
        type: "create_event",
        title: command.title,
        startAt: command.startAt,
        endAt: command.endAt,
        location: command.location,
        conflicts: availability.conflicts.map(({ event }) => ({ title: event.title, startAt: event.startAt, endAt: event.endAt, allDay: event.allDay })),
        availability: availability.calendar.state,
      },
      message,
      command: {
        title: command.title,
        startAt: command.startAt,
        endAt: command.endAt,
        timezone,
      },
      conflicts: availability.conflicts.map(({ event }) => ({ id: event.id, title: event.title, startAt: event.startAt, endAt: event.endAt, allDay: event.allDay })),
      availability: availability.calendar.state,
    };
  }

  private async saveAnswer(
    conversationId: string,
    message: string,
  ): Promise<ConversationResponse> {
    await this.repository.addMessage(conversationId, "assistant", message);
    return { type: "answer", message, conversationId };
  }
}

function publicMessage(message: StoredMessage) {
  return { role: message.role, content: message.content };
}
function publicPendingAction(action: { id: string; type: string; payload: string }) {
  try { return { id: action.id, type: action.type, proposal: JSON.parse(action.payload) as unknown }; }
  catch { return { id: action.id, type: action.type }; }
}
function getIntentType(value: unknown): unknown { return value && typeof value === "object" ? (value as Record<string, unknown>).type : typeof value; }
function getIntentKeys(value: unknown): string[] { return value && typeof value === "object" ? Object.keys(value as Record<string, unknown>) : []; }
function normalizeIntent(value: unknown, timezone: string, pending: PendingCalendarIntent | null): unknown {
  if (!value || typeof value !== "object") return value;
  const intent = { ...(value as Record<string, unknown>) };
  if (intent.type === "calendar_create") {
    intent.title ??= null;
    intent.location ??= null;
    intent.description ??= null;
    intent.allDay ??= false;
    intent.missingFields ??= [];
  }
  if (intent.type === "calendar_update") {
    intent.title ??= null;
    intent.location ??= null;
    intent.description ??= null;
    intent.allDay ??= null;
  }
  for (const key of ["startAt", "endAt", "rangeStart", "rangeEnd"] as const) {
    if (typeof intent[key] === "string") intent[key] = normalizeDateTime(intent[key] as string, timezone, pending?.startAt ?? null);
  }
  return intent;
}
function normalizeDateTime(value: string, timezone: string, pendingStart: string | null): string {
  if (z.string().datetime({ offset: true }).safeParse(value).success) return value;
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{1,2}:\d{2}(?::\d{2})?$/.test(value)) {
    try { return zonedDateTimeToUtc(value, timezone); } catch { return value; }
  }
  const time = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (time && pendingStart) {
    let hour = Number(time[1]);
    const meridiem = time[4]?.toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date(pendingStart));
    try { return zonedDateTimeToUtc(`${date}T${String(hour).padStart(2, "0")}:${time[2]}:${time[3] ?? "00"}`, timezone); } catch { return value; }
  }
  return value;
}
function isAffirmative(value: string): boolean { return /^(yes|yes please|yeah|yep|confirm|confirmed|do it|go ahead|save it|add it|update it|delete it|proceed|okay|ok)[.!\s]*$/i.test(value.trim()); }
function isNegative(value: string): boolean { return /^(no|nope|cancel|never mind|nevermind|don't|do not|not now)[.!\s]*$/i.test(value.trim()); }
function missingMessage(fields: string[]) {
  if (fields.includes("title")) return "What should I call this event?";
  if (fields.includes("endAt")) return "How long should it run?";
  if (fields.includes("startAt")) return "When should it start?";
  return "I need a little more detail before I can prepare that event.";
}

function mergePendingIntent(pending: PendingCalendarIntent, intent: Intent): Intent {
  if (intent.type !== "calendar_create") return intent;
  return {
    ...intent,
    title: intent.title ?? pending.title,
    startAt: intent.startAt ?? pending.startAt,
    endAt: intent.endAt ?? pending.endAt,
    location: intent.location ?? pending.location,
    description: intent.description ?? pending.description,
    allDay: intent.allDay || pending.allDay,
    missingFields: [
      ...(intent.title ?? pending.title) ? [] : ["title" as const],
      ...(intent.startAt ?? pending.startAt) ? [] : ["startAt" as const],
      ...(intent.endAt ?? pending.endAt) ? [] : ["endAt" as const],
    ],
  };
}
function formatDate(value: string, timezone: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  });
}
function formatCalendarAnswer(result: CalendarRangeResponse, timezone: string) {
  if (!result.events.length) return "You have nothing scheduled in that range.";
  return `You have ${result.events.map((event) => `${event.title} at ${event.allDay ? "all day" : new Date(event.startAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: timezone })}`).join(", ")}.`;
}
