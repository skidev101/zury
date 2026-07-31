import { Router, type Router as ExpressRouter } from "express";
import { requireAuth } from "../auth/middleware.js";
import type { ConversationService } from "../conversation/service.js";
import { z } from "zod";

const messageSchema = z.object({
  message: z.string().min(1).max(4000),
  timezone: z.string().min(1).max(100).refine((value) => {
    try { new Intl.DateTimeFormat("en", { timeZone: value }).format(); return true; } catch { return false; }
  }, "Timezone must be a valid IANA timezone"),
  conversationId: z.string().uuid().optional(),
  clientMessageId: z.string().uuid().optional(),
});
const confirmationSchema = z.object({ actionId: z.string().uuid() });

export function createConversationRouter(service: ConversationService): ExpressRouter {
  const router = Router();
  router.get("/api/conversations", requireAuth, async (request, response, next) => {
    try { response.json({ conversations: await service.list(request.auth!.user.id) }); } catch (error) { next(error); }
  });
  router.post("/api/conversations", requireAuth, async (request, response, next) => {
    try { response.status(201).json(await service.create(request.auth!.user.id)); } catch (error) { next(error); }
  });
  router.delete("/api/conversations/:id", requireAuth, async (request, response, next) => {
    const id = request.params.id;
    if (typeof id !== "string") { response.status(400).json({ error: { code: "INVALID_CONVERSATION", message: "Conversation not found." } }); return; }
    try {
      const result = await service.delete(request.auth!.user.id, id);
      if (result === "not_found") { response.status(404).json({ error: { code: "CONVERSATION_NOT_FOUND", message: "Conversation not found." } }); return; }
      if (result === "processing") { response.status(409).json({ error: { code: "CONVERSATION_ACTION_IN_PROGRESS", message: "This conversation is processing a calendar change. Try again in a moment." } }); return; }
      response.status(204).send();
    } catch (error) { next(error); }
  });
  router.get("/api/conversations/:id", requireAuth, async (request, response, next) => {
    const id = request.params.id;
    if (typeof id !== "string") { response.status(400).json({ error: { code: "INVALID_CONVERSATION", message: "Conversation not found." } }); return; }
    try { const thread = await service.get(request.auth!.user.id, id); if (!thread) { response.status(404).json({ error: { code: "CONVERSATION_NOT_FOUND", message: "Conversation not found." } }); return; } response.json(thread); } catch (error) { next(error); }
  });
  router.get("/api/conversation", requireAuth, async (request, response, next) => {
    try { response.json(await service.latest(request.auth!.user.id)); } catch (error) { next(error); }
  });
  router.post("/api/conversation", requireAuth, async (request, response, next) => {
    const parsed = messageSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ error: { code: "INVALID_MESSAGE", message: "Write a message to continue." } }); return; }
    try { response.json(await service.respond(request.auth!.user.id, parsed.data.message, parsed.data.timezone, parsed.data.conversationId, parsed.data.clientMessageId)); } catch (error) { next(error); }
  });
  router.post("/api/conversation/confirm", requireAuth, async (request, response, next) => {
    const parsed = confirmationSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ error: { code: "INVALID_CONFIRMATION", message: "That confirmation is no longer available." } }); return; }
    try { response.json(await service.confirm(request.auth!.user.id, parsed.data.actionId)); } catch (error) { next(error); }
  });
  router.post("/api/conversation/cancel", requireAuth, async (request, response, next) => {
    const parsed = confirmationSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ error: { code: "INVALID_CANCELLATION", message: "That calendar action is no longer available." } }); return; }
    try {
      response.json(await service.cancel(request.auth!.user.id, parsed.data.actionId));
    } catch (error) { next(error); }
  });
  return router;
}
