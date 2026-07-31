import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { DatabaseClient } from "../db/index.js";
import { githubActivitySnapshot, githubAuthorizationState, githubConnection, githubRepository } from "../db/schema.js";
import { TokenCipher } from "../calendar/crypto.js";
import { GitHubProviderError, type GitHubActivity, type GitHubProvider } from "./provider.js";

const MAX_RANGE_DAYS = 31;
type State = "disconnected" | "connected" | "reconnect_required" | "unavailable";

export class GitHubService {
  constructor(private readonly provider: GitHubProvider, private readonly db: DatabaseClient, private readonly cipher: TokenCipher) {}

  connection(userId: string) {
    const row = this.db.select({ status: githubConnection.status, connectedAt: githubConnection.connectedAt }).from(githubConnection).where(eq(githubConnection.userId, userId)).get();
    return { status: (row?.status ?? "disconnected") as State, connectedAt: row?.connectedAt?.toISOString() ?? null };
  }

  async begin(userId: string) {
    const state = randomBytes(32).toString("base64url"); const now = new Date();
    this.db.insert(githubAuthorizationState).values({ id: randomBytes(16).toString("hex"), stateHash: hash(state), userId, expiresAt: new Date(now.getTime() + 10 * 60_000), createdAt: now }).run();
    return this.provider.getAuthorizationUrl({ state });
  }

  async callback(code: string, state: string) {
    const row = this.db.select().from(githubAuthorizationState).where(eq(githubAuthorizationState.stateHash, hash(state))).get();
    if (!row || row.expiresAt <= new Date()) throw new Error("GitHub authorization expired");
    this.db.delete(githubAuthorizationState).where(eq(githubAuthorizationState.id, row.id)).run();
    const credentials = await this.provider.completeAuthorization({ code }); const now = new Date();
    this.db.insert(githubConnection).values({ id: randomBytes(16).toString("hex"), userId: row.userId, status: "connected", accessToken: this.cipher.encrypt(credentials.accessToken), connectedAt: now, updatedAt: now }).onConflictDoUpdate({ target: githubConnection.userId, set: { status: "connected", accessToken: this.cipher.encrypt(credentials.accessToken), connectedAt: now, updatedAt: now } }).run();
    return row.userId;
  }

  disconnect(userId: string) { this.db.delete(githubConnection).where(eq(githubConnection.userId, userId)).run(); this.db.delete(githubRepository).where(eq(githubRepository.userId, userId)).run(); this.db.delete(githubActivitySnapshot).where(eq(githubActivitySnapshot.userId, userId)).run(); }

  async repositories(userId: string) {
    const credentials = this.getCredentials(userId); if (!credentials) return { state: "disconnected" as const, repositories: [] };
    try {
      const repositories = await this.provider.listRepositories({ credentials }); const now = new Date();
      for (const repository of repositories) this.db.insert(githubRepository).values({ id: `${userId}:${repository.id}`, userId, externalId: repository.id, name: repository.name, fullName: repository.fullName, description: repository.description, selected: false, updatedAt: now }).onConflictDoUpdate({ target: [githubRepository.userId, githubRepository.externalId], set: { name: repository.name, fullName: repository.fullName, description: repository.description, updatedAt: now } }).run();
      const ids = new Set(repositories.map((item) => item.id));
      return { state: "current" as const, repositories: this.db.select({ id: githubRepository.externalId, name: githubRepository.name, fullName: githubRepository.fullName, selected: githubRepository.selected }).from(githubRepository).where(eq(githubRepository.userId, userId)).all().filter((item) => ids.has(item.id)) };
    } catch (error) {
      if (error instanceof GitHubProviderError && error.code === "RECONNECT_REQUIRED") this.markReconnectRequired(userId);
      return { state: error instanceof GitHubProviderError && error.code === "RECONNECT_REQUIRED" ? "reconnect_required" as const : "unavailable" as const, repositories: this.savedRepositories(userId) };
    }
  }

  async select(userId: string, ids: string[]) {
    this.db.update(githubRepository).set({ selected: false }).where(eq(githubRepository.userId, userId)).run();
    if (ids.length) this.db.update(githubRepository).set({ selected: true }).where(and(eq(githubRepository.userId, userId), inArray(githubRepository.externalId, ids))).run();
    return { state: "saved" as const, repositories: this.savedRepositories(userId) };
  }

  async activity(userId: string, rangeStart = new Date(Date.now() - 7 * 86_400_000).toISOString(), rangeEnd = new Date().toISOString()) {
    const range = validateRange(rangeStart, rangeEnd); const credentials = this.getCredentials(userId);
    if (!credentials) return { state: "disconnected" as const, fetchedAt: null, activity: emptyActivity() };
    const selected = this.db.select({ id: githubRepository.externalId, name: githubRepository.name, fullName: githubRepository.fullName }).from(githubRepository).where(and(eq(githubRepository.userId, userId), eq(githubRepository.selected, true))).all();
    if (!selected.length) return { state: "current" as const, fetchedAt: null, activity: emptyActivity() };
    try {
      const activity = await this.provider.getActivity({ credentials, repositories: selected.map((item) => ({ ...item, description: null })), rangeStart: range.start, rangeEnd: range.end }); const fetchedAt = new Date();
      this.db.insert(githubActivitySnapshot).values({ id: `${userId}:${range.start}:${range.end}`, userId, repositoryId: "selected", payload: JSON.stringify(activity), fetchedAt }).onConflictDoUpdate({ target: [githubActivitySnapshot.userId, githubActivitySnapshot.repositoryId], set: { payload: JSON.stringify(activity), fetchedAt } }).run();
      return { state: "current" as const, fetchedAt: fetchedAt.toISOString(), activity };
    } catch (error) {
      if (error instanceof GitHubProviderError && error.code === "RECONNECT_REQUIRED") this.markReconnectRequired(userId);
      const saved = this.db.select({ payload: githubActivitySnapshot.payload, fetchedAt: githubActivitySnapshot.fetchedAt }).from(githubActivitySnapshot).where(and(eq(githubActivitySnapshot.userId, userId), eq(githubActivitySnapshot.repositoryId, "selected"))).orderBy(desc(githubActivitySnapshot.fetchedAt)).limit(1).get();
      return saved ? { state: "saved" as const, fetchedAt: saved.fetchedAt.toISOString(), activity: JSON.parse(saved.payload) as GitHubActivity } : { state: "unavailable" as const, fetchedAt: null, activity: emptyActivity() };
    }
  }

  private getCredentials(userId: string) { const row = this.db.select({ token: githubConnection.accessToken, status: githubConnection.status }).from(githubConnection).where(eq(githubConnection.userId, userId)).get(); return row?.status === "connected" ? { accessToken: this.cipher.decrypt(row.token) } : null; }
  private markReconnectRequired(userId: string) { this.db.update(githubConnection).set({ status: "reconnect_required", updatedAt: new Date() }).where(eq(githubConnection.userId, userId)).run(); }
  private savedRepositories(userId: string) { return this.db.select({ id: githubRepository.externalId, name: githubRepository.name, fullName: githubRepository.fullName, selected: githubRepository.selected }).from(githubRepository).where(eq(githubRepository.userId, userId)).all(); }
}

function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
function emptyActivity(): GitHubActivity { return { commits: [], pullRequests: [] }; }
function validateRange(start: string, end: string) { const startDate = new Date(start); const endDate = new Date(end); if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate <= startDate || endDate.getTime() - startDate.getTime() > MAX_RANGE_DAYS * 86_400_000) throw new Error("Invalid GitHub date range"); return { start: startDate.toISOString(), end: endDate.toISOString() }; }
