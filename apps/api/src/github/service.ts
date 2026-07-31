import { createHash, randomBytes } from "node:crypto";
import type { DatabaseClient } from "../db/index.js";
import {
  githubActivitySnapshot,
  githubAuthorizationState,
  githubConnection,
  githubRepository,
} from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import { TokenCipher } from "../calendar/crypto.js";
import type { GitHubProvider } from "./provider.js";

export class GitHubService {
  constructor(
    private readonly provider: GitHubProvider,
    private readonly db: DatabaseClient,
    private readonly cipher: TokenCipher,
  ) {}

  async connection(userId: string) {
    const row = this.db
      .select({
        status: githubConnection.status,
        connectedAt: githubConnection.connectedAt,
      })
      .from(githubConnection)
      .where(eq(githubConnection.userId, userId))
      .get();
    return row
      ? { ...row, connectedAt: row.connectedAt.toISOString() }
      : { status: "disconnected" as const, connectedAt: null };
  }

  async begin(userId: string) {
    const state = randomBytes(32).toString("base64url");
    const now = new Date();
    this.db
      .insert(githubAuthorizationState)
      .values({
        id: randomBytes(16).toString("hex"),
        stateHash: hash(state),
        userId,
        expiresAt: new Date(now.getTime() + 10 * 60_000),
        createdAt: now,
      })
      .run();
    return this.provider.getAuthorizationUrl({ state });
  }

  async callback(code: string, state: string) {
    const row = this.db
      .select()
      .from(githubAuthorizationState)
      .where(eq(githubAuthorizationState.stateHash, hash(state)))
      .get();
    if (!row || row.expiresAt <= new Date())
      throw new Error("GitHub authorization expired");
    this.db
      .delete(githubAuthorizationState)
      .where(eq(githubAuthorizationState.id, row.id))
      .run();
    const credentials = await this.provider.exchangeCode(code);
    const now = new Date();
    this.db
      .insert(githubConnection)
      .values({
        id: randomBytes(16).toString("hex"),
        userId: row.userId,
        status: "connected",
        accessToken: this.cipher.encrypt(credentials.accessToken),
        connectedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: githubConnection.userId,
        set: {
          status: "connected",
          accessToken: this.cipher.encrypt(credentials.accessToken),
          connectedAt: now,
          updatedAt: now,
        },
      })
      .run();
    return row.userId;
  }

  async disconnect(userId: string) {
    this.db
      .delete(githubConnection)
      .where(eq(githubConnection.userId, userId))
      .run();
    this.db
      .delete(githubRepository)
      .where(eq(githubRepository.userId, userId))
      .run();
    this.db
      .delete(githubActivitySnapshot)
      .where(eq(githubActivitySnapshot.userId, userId))
      .run();
  }

  async repositories(userId: string) {
    const connection = this.getToken(userId);
    if (!connection)
      return { state: "disconnected" as const, repositories: [] };
    const repos = await this.provider.listRepositories(connection);
    const now = new Date();
    for (const repo of repos)
      this.db
        .insert(githubRepository)
        .values({
          id: `${userId}:${repo.id}`,
          userId,
          externalId: repo.id,
          name: repo.name,
          fullName: repo.fullName,
          selected: false,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [githubRepository.userId, githubRepository.externalId],
          set: { name: repo.name, fullName: repo.fullName, updatedAt: now },
        })
        .run();
    return {
      state: "current" as const,
      repositories: this.db
        .select()
        .from(githubRepository)
        .where(eq(githubRepository.userId, userId))
        .all(),
    };
  }

  async select(userId: string, ids: string[]) {
    this.db
      .update(githubRepository)
      .set({ selected: false })
      .where(eq(githubRepository.userId, userId))
      .run();
    for (const id of ids)
      this.db
        .update(githubRepository)
        .set({ selected: true })
        .where(
          and(
            eq(githubRepository.userId, userId),
            eq(githubRepository.externalId, id),
          ),
        )
        .run();
    return this.repositories(userId);
  }

  async activity(userId: string) {
    const token = this.getToken(userId);
    if (!token)
      return {
        state: "disconnected" as const,
        activity: { commits: [], pullRequests: [] },
      };
    const selected = this.db
      .select()
      .from(githubRepository)
      .where(
        and(
          eq(githubRepository.userId, userId),
          eq(githubRepository.selected, true),
        ),
      )
      .all();
    try {
      const activity = await this.provider.getActivity(
        token,
        selected.map((repo) => ({
          id: repo.externalId,
          name: repo.name,
          fullName: repo.fullName,
        })),
      );
      const now = new Date();
      for (const repo of selected)
        this.db
          .insert(githubActivitySnapshot)
          .values({
            id: `${userId}:${repo.externalId}`,
            userId,
            repositoryId: repo.externalId,
            payload: JSON.stringify(activity),
            fetchedAt: now,
          })
          .onConflictDoUpdate({
            target: [
              githubActivitySnapshot.userId,
              githubActivitySnapshot.repositoryId,
            ],
            set: { payload: JSON.stringify(activity), fetchedAt: now },
          })
          .run();
      return { state: "current" as const, activity };
    } catch {
      const saved = this.db
        .select()
        .from(githubActivitySnapshot)
        .where(eq(githubActivitySnapshot.userId, userId))
        .all();
      const latest = saved[0];
      return latest
        ? { state: "saved" as const, activity: JSON.parse(latest.payload) }
        : {
            state: "unavailable" as const,
            activity: { commits: [], pullRequests: [] },
          };
    }
  }

  private getToken(userId: string) {
    const row = this.db
      .select({ token: githubConnection.accessToken })
      .from(githubConnection)
      .where(eq(githubConnection.userId, userId))
      .get();
    return row ? this.cipher.decrypt(row.token) : null;
  }
}
function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
