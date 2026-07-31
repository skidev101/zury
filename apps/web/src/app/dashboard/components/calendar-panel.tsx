"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icon";
import { DashboardCard, SectionHeader } from "./dashboard-card";

type CalendarState = "disconnected" | "current" | "saved" | "unavailable" | "reconnect_required";
type CalendarEvent = { id: string; title: string; location: string | null; startAt: string; endAt: string; allDay: boolean };
type TodayData = { calendar: { state: CalendarState; updatedAt: string | null }; events: CalendarEvent[] };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function CalendarPanel() {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const date = localIsoDate(new Date());
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    try {
      const response = await fetch(`${apiUrl}/api/today?date=${date}&timezone=${encodeURIComponent(timezone)}`, { credentials: "include" });
      if (!response.ok) throw new Error("Calendar unavailable");
      setData(await response.json() as TodayData);
    } catch { setData({ calendar: { state: "unavailable", updatedAt: null }, events: [] }); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function connect() {
    setBusy(true);
    try {
      const response = await fetch(`${apiUrl}/api/calendar/connect`, { method: "POST", credentials: "include" });
      const result = await response.json() as { authorizationUrl?: string };
      if (response.ok && result.authorizationUrl) window.location.assign(result.authorizationUrl);
    } finally { setBusy(false); }
  }

  const state = data?.calendar.state;
  return <DashboardCard className="min-h-[304px]"><SectionHeader eyebrow="Schedule" title="Upcoming" action={<button className="dashboard-link" onClick={() => void load()} aria-label="Refresh calendar"><Icon name="arrow" size={15} /></button>} />{loading ? <CalendarSkeleton /> : state === "disconnected" || state === "reconnect_required" ? <div className="flex min-h-52 flex-col justify-center"><p className="max-w-xs text-[13px] leading-5 text-text-secondary">{state === "reconnect_required" ? "Calendar access needs your attention." : "Connect your calendar to see classes and commitments here."}</p><button className="dashboard-button mt-5 w-fit" onClick={() => void connect()} disabled={busy}>{busy ? "Opening..." : state === "reconnect_required" ? "Reconnect" : "Connect calendar"}</button></div> : state === "unavailable" ? <div className="flex min-h-52 flex-col justify-center"><p className="text-[13px] text-text-secondary">Calendar couldn&apos;t be updated just now.</p><button className="dashboard-link mt-3 w-fit" onClick={() => void load()}>Try again</button></div> : data?.events.length ? <div><div className="mb-3 flex items-center gap-2 text-xs text-text-tertiary"><span className="size-1.5 rounded-full bg-accent" />{state === "saved" ? "Saved for offline use" : "Up to date"}</div><CalendarTimeline events={data.events.slice(0, 5)} /></div> : <div className="flex min-h-52 items-center text-[13px] text-text-secondary">Nothing is scheduled today.</div>}</DashboardCard>;
}

function CalendarTimeline({ events }: { events: CalendarEvent[] }) { return <div className="space-y-1">{events.map((event) => <div className="timeline-row" key={event.id}><span className="w-16 shrink-0 font-mono text-xs tabular-nums text-text-tertiary">{event.allDay ? "All day" : formatTime(event.startAt)}</span><span className="timeline-dot timeline-dot-class" /><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium text-text-primary">{event.title}</p><p className="mt-0.5 truncate text-xs text-text-tertiary">{event.location ?? "Calendar event"}</p></div></div>)}</div>; }
function CalendarSkeleton() { return <div className="space-y-4 pt-5"><div className="skeleton h-3 w-24" /><div className="skeleton h-10 w-full" /><div className="skeleton h-10 w-full" /><div className="skeleton h-10 w-full" /></div>; }
function formatTime(value: string) { return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
function localIsoDate(date: Date) { const value = Object.fromEntries(new Intl.DateTimeFormat("en", { year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date).map((part) => [part.type, part.value])); return `${value.year}-${value.month}-${value.day}`; }
