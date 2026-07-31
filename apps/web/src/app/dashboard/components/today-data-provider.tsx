"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getTodaySnapshot, saveTodaySnapshot } from "../today-storage";
import type { TodayData } from "../today-types";
import { apiFetch, calendarUpdatedEvent } from "@/lib/api";

interface TodayDataContextValue {
  data: TodayData | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

const TodayDataContext = createContext<TodayDataContextValue | null>(null);

export function TodayDataProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh(): Promise<void> {
    const date = localIsoDate(new Date());
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const snapshotKey = `${userId}:${date}:${timezone}`;
    setRefreshing(true);

    try {
      const response = await apiFetch(`/api/today?date=${date}&timezone=${encodeURIComponent(timezone)}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Today is unavailable");
      const current = await response.json() as TodayData;
      setData(current);
      if (current.calendar.state === "current" || current.calendar.state === "saved") {
        await saveTodaySnapshot(snapshotKey, current).catch(() => undefined);
      }
    } catch {
      const snapshot = await getTodaySnapshot(snapshotKey).catch(() => null);
      setData(snapshot ? {
        ...snapshot.data,
        calendar: { state: "device_saved", updatedAt: snapshot.savedAt },
      } : { calendar: { state: "unavailable", updatedAt: null }, events: [], github: { state: "unavailable", activity: { commits: [], pullRequests: [] } } });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { void refresh(); }, [userId]);
  useEffect(() => { const listener = () => void refresh(); window.addEventListener(calendarUpdatedEvent, listener); return () => window.removeEventListener(calendarUpdatedEvent, listener); }, [userId]);

  return <TodayDataContext value={{ data, loading, refreshing, refresh }}>{children}</TodayDataContext>;
}

export function useTodayData(): TodayDataContextValue {
  const context = useContext(TodayDataContext);
  if (!context) throw new Error("useTodayData must be used within TodayDataProvider");
  return context;
}

function localIsoDate(date: Date): string {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en", { year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}
