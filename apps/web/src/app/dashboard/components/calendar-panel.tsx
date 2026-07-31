"use client";

import { useState } from "react";
import { Icon } from "./dashboard-icon";
import { DashboardCard, SectionHeader } from "./dashboard-card";
import { useTodayData } from "./today-data-provider";
import type { TodayEvent } from "../today-types";
const apiUrl = process.env.NODE_ENV === "production" ? "" : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function CalendarPanel() {
  const { data, loading, refreshing, refresh } = useTodayData();
  const [busy, setBusy] = useState(false);

  async function connect() {
    setBusy(true);
    try {
      const response = await fetch(`${apiUrl}/api/calendar/connect`, { method: "POST", credentials: "include" });
      const result = await response.json() as { authorizationUrl?: string };
      if (response.ok && result.authorizationUrl) window.location.assign(result.authorizationUrl);
    } finally { setBusy(false); }
  }

  const state = data?.calendar.state;
  const linkClass = "inline-flex min-h-8 items-center gap-2 rounded-lg px-2 text-xs font-medium text-text-tertiary transition hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent";
  const buttonClass = "inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-text-primary px-3.5 text-[13px] font-semibold text-background shadow-[inset_0_1px_0_rgba(255,255,255,.45)] transition duration-200 hover:-translate-y-px hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50";
  return <DashboardCard className="min-h-[304px]"><SectionHeader eyebrow="Schedule" title="Upcoming" action={<button className={linkClass} onClick={() => void refresh()} disabled={refreshing} aria-label="Refresh calendar"><Icon name="arrow" size={15} className={refreshing ? "animate-pulse" : ""} /></button>} />{loading ? <CalendarSkeleton /> : state === "disconnected" || state === "reconnect_required" ? <div className="flex min-h-52 flex-col justify-center"><p className="max-w-xs text-[13px] leading-5 text-text-secondary">{state === "reconnect_required" ? "Calendar access needs your attention." : "Connect your calendar to see classes and commitments here."}</p><button className={`${buttonClass} mt-5 w-fit`} onClick={() => void connect()} disabled={busy}>{busy ? "Opening..." : state === "reconnect_required" ? "Reconnect" : "Connect calendar"}</button></div> : state === "unavailable" ? <div className="flex min-h-52 flex-col justify-center"><p className="text-[13px] text-text-secondary">Calendar couldn&apos;t be updated just now.</p><button className={`${linkClass} mt-3 w-fit`} onClick={() => void refresh()}>Try again</button></div> : data?.events.length ? <div><div className="mb-3 flex items-center gap-2 text-xs text-text-tertiary"><span className="size-1.5 rounded-full bg-accent" />{state === "device_saved" ? "Saved on this device" : state === "saved" ? "Saved for offline use" : "Up to date"}</div><CalendarTimeline events={data.events.slice(0, 5)} /></div> : <div className="flex min-h-52 items-center text-[13px] text-text-secondary">Nothing is scheduled today.</div>}</DashboardCard>;
}

function CalendarTimeline({ events }: { events: TodayEvent[] }) { return <div className="space-y-1">{events.map((event) => <div className="flex min-h-12 items-center gap-3 rounded-xl px-2 transition duration-200 hover:bg-surface-hover" key={event.id}><span className="w-16 shrink-0 font-mono text-xs tabular-nums text-text-tertiary">{event.allDay ? "All day" : formatTime(event.startAt)}</span><span className="size-1.5 shrink-0 rounded-full bg-accent" /><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium text-text-primary">{event.title}</p><p className="mt-0.5 truncate text-xs text-text-tertiary">{event.location ?? "Calendar event"}</p></div></div>)}</div>; }
function CalendarSkeleton() { return <div className="space-y-4 pt-5"><div className="h-3 w-24 animate-pulse rounded-md bg-surface-hover" /><div className="h-10 w-full animate-pulse rounded-md bg-surface-hover" /><div className="h-10 w-full animate-pulse rounded-md bg-surface-hover" /><div className="h-10 w-full animate-pulse rounded-md bg-surface-hover" /></div>; }
function formatTime(value: string) { return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
