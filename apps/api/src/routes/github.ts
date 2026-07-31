import { Router, type Router as ExpressRouter } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/middleware.js";
import { env } from "../config/env.js";
import type { GitHubService } from "../github/service.js";

const selectionSchema = z.object({ repositoryIds: z.array(z.string().min(1)).max(20) });

export function createGitHubRouter(service: GitHubService | null): ExpressRouter {
  const router = Router();
  router.get("/api/github/connection", requireAuth, async (request, response, next) => { try { response.json(service ? await service.connection(request.auth!.user.id) : { status: "disconnected", connectedAt: null }); } catch (error) { next(error); } });
  router.post("/api/github/connect", requireAuth, async (request, response, next) => { try { if (!service) { response.status(503).json({ error: { code: "GITHUB_UNAVAILABLE", message: "GitHub is not available just now." } }); return; } response.json({ authorizationUrl: await service.begin(request.auth!.user.id) }); } catch (error) { next(error); } });
  router.get("/api/github/callback", async (request, response) => { const code = typeof request.query.code === "string" ? request.query.code : null; const state = typeof request.query.state === "string" ? request.query.state : null; if (!service || !code || !state || request.query.error) { response.redirect(`${env.WEB_URL}/dashboard/connections?github=failed`); return; } try { await service.callback(code, state); response.redirect(`${env.WEB_URL}/dashboard/connections?github=connected`); } catch { response.redirect(`${env.WEB_URL}/dashboard/connections?github=failed`); } });
  router.delete("/api/github/connection", requireAuth, async (request, response, next) => { try { if (service) await service.disconnect(request.auth!.user.id); response.status(204).send(); } catch (error) { next(error); } });
  router.get("/api/github/repositories", requireAuth, async (request, response, next) => { try { response.json(service ? await service.repositories(request.auth!.user.id) : { state: "disconnected", repositories: [] }); } catch (error) { next(error); } });
  router.put("/api/github/repositories/selection", requireAuth, async (request, response, next) => { const parsed = selectionSchema.safeParse(request.body); if (!parsed.success) { response.status(400).json({ error: { code: "INVALID_REPOSITORY_SELECTION", message: "Choose valid projects." } }); return; } try { if (!service) { response.status(503).json({ error: { code: "GITHUB_UNAVAILABLE", message: "GitHub is not available just now." } }); return; } response.json(await service.select(request.auth!.user.id, parsed.data.repositoryIds)); } catch (error) { next(error); } });
  router.get("/api/github/activity", requireAuth, async (request, response, next) => { try { response.json(service ? await service.activity(request.auth!.user.id) : { state: "disconnected", activity: { commits: [], pullRequests: [] } }); } catch (error) { next(error); } });
  return router;
}
