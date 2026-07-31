import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AIProvider } from "../ai/provider.js";
import { AgentRuntime } from "../agent/runtime.js";
import type { CalendarCredentials, CalendarEvent, CalendarProvider } from "../calendar/provider.js";
import { CalendarService } from "../calendar/service.js";
import { ConversationService } from "./service.js";

const credentials: CalendarCredentials = { accessToken: "access", refreshToken: "refresh", accessTokenExpiresAt: null, scope: "calendar.events" };
const event: CalendarEvent = { id: "1", calendarId: "primary", title: "Algorithms", description: null, location: null, startAt: "2026-08-03T10:00:00.000Z", endAt: "2026-08-03T11:00:00.000Z", allDay: false, status: "confirmed" };

function createService(events: CalendarEvent[] = [], github?: { activity(userId: string): Promise<{ state: "disconnected" | "current" | "saved" | "unavailable"; activity: { commits: Array<{ id: string; message: string; author: string | null; repository: string; committedAt: string }>; pullRequests: Array<{ id: string; title: string; repository: string; url: string; updatedAt: string; state: "open" | "closed" | "merged" }> } }> }, onPrompt?: (prompt: string) => void) {
  let updated = false;
  let deleted = false;
  let pendingAction: import("./repository.js").CalendarActionPayload = { type: "create_event", command: { title: "Algorithms", description: null, location: null, startAt: event.startAt, endAt: event.endAt, allDay: false, timezone: "Africa/Lagos" } };
  const provider: CalendarProvider = {
    async getAuthorizationUrl() { return "url"; }, async completeAuthorization() { return credentials; },
    async listEvents() { return { events }; }, async createEvent(input) { return { event: { ...event, title: input.event.title, startAt: input.event.startAt, endAt: input.event.endAt } }; },
    async updateEvent(input) { updated = true; return { event: { ...event, title: input.event.title ?? event.title, startAt: input.event.startAt ?? event.startAt, endAt: input.event.endAt ?? event.endAt } }; },
    async deleteEvent() { deleted = true; return {}; },
    async health() { return { available: true }; },
  };
  const store = {
    async getConnection() { return { status: "connected" as const, credentials, connectedAt: new Date() }; },
    async saveConnection() {}, async updateCredentials() {}, async markReconnectRequired() {}, async disconnect() {},
    async replaceEvents() {}, async getEvents() { return { events: [], fetchedAt: null }; },
    async createAuthorizationState() {}, async consumeAuthorizationState() { return "user-1"; },
  };
  const messages: Array<{ id: string; role: "user" | "assistant"; content: string; createdAt: Date }> = [];
  const repository = {
    async getOrCreate() { return "conversation-1"; },
    async create() { return "conversation-2"; },
    async list() { return [{ id: "conversation-1", title: "Conversation", updatedAt: new Date() }]; },
    async get() { return { id: "conversation-1", title: "Conversation", messages, pendingAction: null }; },
    async getLatest() { return { id: "conversation-1", messages, pendingAction: null }; },
    async listMessages() { return messages; },
    async addMessage(_id: string, role: "user" | "assistant", content: string) { const item = { id: String(messages.length), role, content, createdAt: new Date() }; messages.push(item); return item; },
    async createAction(_userId: string, _conversationId: string, action: import("./repository.js").CalendarActionPayload) { pendingAction = action; return "action-1"; },
    async claimAction() { return { id: "action-1", conversationId: "conversation-1", action: pendingAction }; },
    async completeAction() {}, async failAction() {},
    async deleteConversation() { return "deleted" as const; },
    async beginRequest() { return { state: "new" as const }; },
    async completeRequest() {},
    async failRequest() {},
    async getPendingIntent() { return null; }, async savePendingIntent() {}, async clearPendingIntent() {},
    async cancelAction() { return { cancelled: true, conversationId: "conversation-1" }; },
  };
  const ai: AIProvider = {
    async generate() { return { text: "Grounded reply", model: "fake" }; },
    async generateWithDocument(request) { return { text: request.prompt, model: "fake" }; },
    async generateJson(request) { onPrompt?.(request.prompt); const input = JSON.parse(request.prompt) as { message: string }; if (input.message.startsWith("What changed")) return { value: { type: "answer", message: "The project changed." }, model: "fake" }; if (input.message.startsWith("Delete")) return { value: { type: "calendar_delete", targetTitle: "Algorithms", rangeStart: "2026-08-03T09:00:00.000Z", rangeEnd: "2026-08-03T12:00:00.000Z" }, model: "fake" }; if (input.message.startsWith("Move")) return { value: { type: "calendar_update", targetTitle: "Algorithms", rangeStart: "2026-08-03T09:00:00.000Z", rangeEnd: "2026-08-03T12:00:00.000Z", title: null, startAt: "2026-08-03T13:00:00.000Z", endAt: "2026-08-03T14:00:00.000Z", location: null, description: null, allDay: null }, model: "fake" }; return { value: input.message.startsWith("What") ? { type: "calendar_query", startAt: "2026-08-02T23:00:00.000Z", endAt: "2026-08-03T23:00:00.000Z", message: "", title: null, location: null, description: null, allDay: false, missingFields: [] } : { type: "calendar_create", message: "", title: "Algorithms", startAt: event.startAt, endAt: event.endAt, location: null, description: null, allDay: false, missingFields: [] }, model: "fake" }; },
    async health() { return { available: true }; },
  };
  return new ConversationService(new AgentRuntime(ai), new CalendarService(provider, store), repository, github);
}

describe("ConversationService", () => {
  it("includes normalized GitHub activity as grounded context", async () => {
    let prompt = "";
    const service = createService([], { activity: async () => ({ state: "current" as const, activity: { commits: [{ id: "commit-1", message: "Fix exam schedule", author: "Student", repository: "student/coursework", committedAt: "2026-07-31T12:00:00Z" }], pullRequests: [{ id: "pull-1", title: "Improve schedule", repository: "student/coursework", url: "https://github.com/student/coursework/pull/1", updatedAt: "2026-07-31T12:00:00Z", state: "open" }] } }) }, (value) => { prompt = value; });
    const result = await service.respond("user-1", "What changed in my group project?", "UTC");
    assert.equal(result.type, "answer");
    assert.match(prompt, /Fix exam schedule/);
  });

  it("answers schedule questions from calendar data", async () => {
    const result = await createService([event]).respond("user-1", "What do I have tomorrow?", "Africa/Lagos");
    assert.equal(result.type, "answer");
    assert.match(result.message, /Algorithms/);
  });

  it("requires confirmation before creating an event", async () => {
    const service = createService();
    const proposal = await service.respond("user-1", "Add Algorithms next Monday at 11am", "Africa/Lagos");
    assert.equal(proposal.type, "confirmation");
    if (proposal.type !== "confirmation") return;
    const result = await service.confirm("user-1", proposal.actionId);
    assert.equal(result.type, "answer");
    assert.match(result.message, /added to your calendar/);
  });

  it("collects a missing title across turns", async () => {
    const service = createService();
    const first = await service.respond("user-1", "Add a class next Monday at 11am", "Africa/Lagos");
    assert.equal(first.type, "confirmation");
  });

  it("requires confirmation before updating a uniquely matched event", async () => {
    const service = createService([event]);
    const proposal = await service.respond("user-1", "Move Algorithms tomorrow to 1pm", "Africa/Lagos");
    assert.equal(proposal.type, "confirmation");
    if (proposal.type !== "confirmation") return;
    assert.equal(proposal.action.type, "update_event");
    const result = await service.confirm("user-1", proposal.actionId);
    assert.equal(result.type, "answer");
    assert.match(result.message, /updated/);
  });

  it("requires explicit confirmation before deleting an event", async () => {
    const service = createService([event]);
    const proposal = await service.respond("user-1", "Delete Algorithms tomorrow", "Africa/Lagos");
    assert.equal(proposal.type, "confirmation");
    if (proposal.type !== "confirmation") return;
    assert.equal(proposal.action.type, "delete_event");
    assert.match(proposal.message, /cannot be undone/);
  });

  it("asks for clarification when an event title is ambiguous", async () => {
    const second = { ...event, id: "2", startAt: "2026-08-03T15:00:00.000Z", endAt: "2026-08-03T16:00:00.000Z" };
    const result = await createService([event, second]).respond("user-1", "Delete Algorithms tomorrow", "Africa/Lagos");
    assert.equal(result.type, "clarification");
    assert.match(result.message, /more than one/);
  });

  it("cancels a pending action without calling the provider", async () => {
    const service = createService([event]);
    const result = await service.cancel("user-1", "action-1");
    assert.equal(result.type, "answer");
    assert.match(result.message, /cancelled/);
  });
});
