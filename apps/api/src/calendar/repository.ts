import { and, eq, gt, lt } from "drizzle-orm";
import { createHash, randomUUID } from "node:crypto";
import type { DatabaseClient } from "../db/index.js";
import { calendarAuthorizationState, calendarConnection, calendarEventSnapshot, calendarSnapshot } from "../db/schema.js";
import type { CalendarCredentials, CalendarEvent } from "./provider.js";
import { TokenCipher } from "./crypto.js";

export interface StoredConnection {
  status: "connected" | "reconnect_required";
  credentials: CalendarCredentials;
  connectedAt: Date;
}

export class CalendarRepository {
  constructor(private readonly db: DatabaseClient, private readonly cipher: TokenCipher) {}

  async getConnection(userId: string): Promise<StoredConnection | null> {
    const row = await this.db.query.calendarConnection.findFirst({
      where: and(eq(calendarConnection.userId, userId), eq(calendarConnection.provider, "google")),
    });
    if (!row) return null;
    return {
      status: row.status,
      connectedAt: row.connectedAt,
      credentials: {
        accessToken: this.cipher.decrypt(row.accessToken),
        refreshToken: row.refreshToken ? this.cipher.decrypt(row.refreshToken) : null,
        accessTokenExpiresAt: row.accessTokenExpiresAt,
        scope: row.scope,
      },
    };
  }

  async saveConnection(userId: string, credentials: CalendarCredentials): Promise<void> {
    const now = new Date();
    await this.db.insert(calendarConnection).values({
      id: randomUUID(), userId, provider: "google", status: "connected",
      accessToken: this.cipher.encrypt(credentials.accessToken),
      refreshToken: credentials.refreshToken ? this.cipher.encrypt(credentials.refreshToken) : null,
      accessTokenExpiresAt: credentials.accessTokenExpiresAt, scope: credentials.scope,
      connectedAt: now, updatedAt: now,
    }).onConflictDoUpdate({
      target: [calendarConnection.userId, calendarConnection.provider],
      set: {
        status: "connected", accessToken: this.cipher.encrypt(credentials.accessToken),
        refreshToken: credentials.refreshToken ? this.cipher.encrypt(credentials.refreshToken) : null,
        accessTokenExpiresAt: credentials.accessTokenExpiresAt, scope: credentials.scope,
        connectedAt: now, updatedAt: now,
      },
    });
  }

  async updateCredentials(userId: string, credentials: CalendarCredentials): Promise<void> {
    await this.db.update(calendarConnection).set({
      accessToken: this.cipher.encrypt(credentials.accessToken),
      refreshToken: credentials.refreshToken ? this.cipher.encrypt(credentials.refreshToken) : null,
      accessTokenExpiresAt: credentials.accessTokenExpiresAt,
      scope: credentials.scope,
      updatedAt: new Date(),
    }).where(and(eq(calendarConnection.userId, userId), eq(calendarConnection.provider, "google")));
  }

  async markReconnectRequired(userId: string): Promise<void> {
    await this.db.update(calendarConnection).set({ status: "reconnect_required", updatedAt: new Date() })
      .where(and(eq(calendarConnection.userId, userId), eq(calendarConnection.provider, "google")));
  }

  async disconnect(userId: string): Promise<void> {
    await this.db.delete(calendarConnection)
      .where(and(eq(calendarConnection.userId, userId), eq(calendarConnection.provider, "google")));
  }

  async replaceEvents(userId: string, rangeStart: string, rangeEnd: string, events: CalendarEvent[], fetchedAt: Date): Promise<void> {
    this.db.transaction((tx) => {
      tx.delete(calendarEventSnapshot).where(and(
        eq(calendarEventSnapshot.userId, userId),
        lt(calendarEventSnapshot.startAt, rangeEnd),
        gt(calendarEventSnapshot.endAt, rangeStart),
      )).run();
      if (events.length > 0) {
        tx.insert(calendarEventSnapshot).values(events.map((event) => ({
          id: randomUUID(), userId, externalEventId: event.id, calendarId: event.calendarId,
          title: event.title, description: event.description, location: event.location,
          startAt: event.startAt, endAt: event.endAt, allDay: event.allDay,
          status: event.status, fetchedAt, updatedAt: fetchedAt,
        }))).run();
      }
      tx.insert(calendarSnapshot).values({
        id: randomUUID(), userId, rangeStart, rangeEnd, fetchedAt,
      }).onConflictDoUpdate({
        target: [calendarSnapshot.userId, calendarSnapshot.rangeStart, calendarSnapshot.rangeEnd],
        set: { fetchedAt },
      }).run();
    });
  }

  async getEvents(userId: string, rangeStart: string, rangeEnd: string): Promise<{ events: CalendarEvent[]; fetchedAt: Date | null }> {
    const rows = await this.db.select().from(calendarEventSnapshot).where(and(
      eq(calendarEventSnapshot.userId, userId),
      lt(calendarEventSnapshot.startAt, rangeEnd),
      gt(calendarEventSnapshot.endAt, rangeStart),
    )).orderBy(calendarEventSnapshot.startAt);
    const snapshot = await this.db.query.calendarSnapshot.findFirst({
      where: and(
        eq(calendarSnapshot.userId, userId),
        eq(calendarSnapshot.rangeStart, rangeStart),
        eq(calendarSnapshot.rangeEnd, rangeEnd),
      ),
    });
    return {
      events: rows.map((row) => ({
        id: row.externalEventId, calendarId: row.calendarId, title: row.title,
        description: row.description, location: row.location, startAt: row.startAt,
        endAt: row.endAt, allDay: row.allDay, status: row.status,
      })),
      fetchedAt: snapshot?.fetchedAt ?? rows.reduce<Date | null>((latest, row) => !latest || row.fetchedAt > latest ? row.fetchedAt : latest, null),
    };
  }

  async createAuthorizationState(userId: string, state: string, expiresAt: Date): Promise<void> {
    const now = new Date();
    await this.db.delete(calendarAuthorizationState).where(lt(calendarAuthorizationState.expiresAt, now));
    await this.db.insert(calendarAuthorizationState).values({
      id: randomUUID(), stateHash: hashState(state), userId, expiresAt, createdAt: now,
    });
  }

  async consumeAuthorizationState(state: string): Promise<string | null> {
    const hash = hashState(state);
    return this.db.transaction((tx) => {
      const row = tx.select().from(calendarAuthorizationState)
        .where(eq(calendarAuthorizationState.stateHash, hash)).get();
      if (!row) return null;
      tx.delete(calendarAuthorizationState)
        .where(eq(calendarAuthorizationState.id, row.id)).run();
      return row.expiresAt > new Date() ? row.userId : null;
    });
  }
}

function hashState(state: string): string {
  return createHash("sha256").update(state).digest("hex");
}
