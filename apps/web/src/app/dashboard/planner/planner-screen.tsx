"use client";

import { useEffect, useMemo, useState } from "react";
import { getPlannerSnapshot, savePlannerSnapshot } from "../today-storage";
import type { CalendarState, TodayEvent } from "../today-types";
import { DashboardCard, SectionHeader } from "../components/dashboard-card";
import { Icon } from "../components/dashboard-icon";
import { MobileNavigation } from "../components/mobile-nav";
import { Sidebar } from "../components/sidebar";
import { useDashboardUser } from "../dashboard-session";
import Link from "next/link";
import { apiFetch, calendarUpdatedEvent } from "@/lib/api";

type PlannerData = { calendar: { state: CalendarState; updatedAt: string | null }; events: TodayEvent[] };

export function PlannerScreen() {
  const user = useDashboardUser();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => localDateKey(new Date()));
  const [data, setData] = useState<PlannerData | null>(null);
  const [loading, setLoading] = useState(true);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const rangeStart = weekStart.toISOString();
  const rangeEnd = addDays(weekStart, 7).toISOString();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const snapshotKey = `${user.id}:planner:${rangeStart}:${rangeEnd}:${timezone}`;

  async function load() {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/calendar/events?start=${encodeURIComponent(rangeStart)}&end=${encodeURIComponent(rangeEnd)}&timezone=${encodeURIComponent(timezone)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Planner unavailable");
      const current = await response.json() as PlannerData;
      setData(current);
      if (current.calendar.state === "current" || current.calendar.state === "saved") await savePlannerSnapshot(snapshotKey, current).catch(() => undefined);
    } catch {
      const snapshot = await getPlannerSnapshot(snapshotKey).catch(() => null);
      setData(snapshot ? { ...snapshot.data, calendar: { state: "device_saved", updatedAt: snapshot.savedAt } } : { calendar: { state: "unavailable", updatedAt: null }, events: [] });
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [snapshotKey]);
  useEffect(() => { const listener = () => void load(); window.addEventListener(calendarUpdatedEvent, listener); return () => window.removeEventListener(calendarUpdatedEvent, listener); }, [snapshotKey]);

  const selectedEvents = (data?.events ?? []).filter((event) => eventDateKey(event) === selectedDay);
  return (
    <div className="dashboard-theme min-h-dvh bg-background text-text-primary">
      <Sidebar user={user} />
      <div className="min-h-dvh pb-24 lg:ml-20 lg:pb-0 xl:ml-[260px]">
        <PlannerHeader weekStart={weekStart} setWeekStart={setWeekStart} setSelectedDay={setSelectedDay} />
        <main className="mx-auto max-w-[1440px] px-5 pb-14 pt-8 sm:px-8 lg:px-10 lg:pt-10 xl:px-12 xl:pt-12">
          <div className="mb-6 flex items-center justify-between"><div><h2 className="font-heading text-xl font-semibold tracking-[-.035em]">{formatRange(weekStart)}</h2><p className="mt-1 text-xs text-text-tertiary">{statusLabel(data?.calendar.state)}</p></div><button className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border px-3 text-xs font-medium text-text-secondary hover:bg-surface-hover" onClick={() => void load()}><Icon name="arrow" size={14} className="-rotate-90" />Refresh</button></div>
          <DaySelector days={weekDays} selected={selectedDay} onSelect={setSelectedDay} />
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <DashboardCard className="min-h-[420px]"><SectionHeader eyebrow="Agenda" title={formatDay(selectedDay)} /><Agenda data={data} events={selectedEvents} loading={loading} retry={() => void load()} /></DashboardCard>
            <DashboardCard className="hidden lg:block"><SectionHeader eyebrow="Week at a glance" title="Commitments" /><div className="space-y-2">{weekDays.map((day) => <div className="flex items-center justify-between rounded-lg px-2 py-2 text-xs" key={localDateKey(day)}><span className="text-text-secondary">{day.toLocaleDateString(undefined, { weekday: "long" })}</span><span className="font-mono text-text-tertiary">{(data?.events ?? []).filter((event) => eventDateKey(event) === localDateKey(day)).length}</span></div>)}</div></DashboardCard>
          </div>
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}

function PlannerHeader({ weekStart, setWeekStart, setSelectedDay }: { weekStart: Date; setWeekStart: (date: Date) => void; setSelectedDay: (value: string) => void }) {
  return <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between gap-4 border-b border-border bg-background/85 px-5 backdrop-blur-2xl sm:px-8 lg:px-10 xl:px-12"><div><p className="text-[11px] font-medium uppercase tracking-[.12em] text-text-tertiary">Your week</p><h1 className="mt-0.5 font-heading text-2xl font-semibold tracking-[-.04em]">Planner</h1></div><div className="flex items-center gap-2"><button className="grid size-9 place-items-center rounded-xl border border-border bg-surface text-text-secondary hover:bg-surface-hover" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week"><Icon name="chevron" className="rotate-90" /></button><button className="hidden h-9 rounded-xl border border-border px-3 text-xs font-medium text-text-secondary hover:bg-surface-hover sm:block" onClick={() => { const today = new Date(); setWeekStart(startOfWeek(today)); setSelectedDay(localDateKey(today)); }}>Today</button><button className="grid size-9 place-items-center rounded-xl border border-border bg-surface text-text-secondary hover:bg-surface-hover" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week"><Icon name="chevron" className="-rotate-90" /></button></div></header>;
}

function DaySelector({ days, selected, onSelect }: { days: Date[]; selected: string; onSelect: (value: string) => void }) {
  return <div className="mb-6 grid grid-cols-7 gap-2 overflow-x-auto pb-1">{days.map((day) => { const key = localDateKey(day); const active = key === selected; return <button key={key} onClick={() => onSelect(key)} className={`min-w-[72px] rounded-xl border px-2 py-3 text-center transition sm:min-w-0 ${active ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-text-secondary hover:bg-surface-hover"}`}><span className="block text-[10px] font-semibold uppercase tracking-[.1em]">{day.toLocaleDateString(undefined, { weekday: "short" })}</span><span className="mt-1 block font-heading text-lg font-semibold">{day.getDate()}</span></button>; })}</div>;
}

function Agenda({ data, events, loading, retry }: { data: PlannerData | null; events: TodayEvent[]; loading: boolean; retry: () => void }) {
  if (loading) return <AgendaSkeleton />;
  if (data?.calendar.state === "disconnected") return <Recovery title="Connect your calendar" message="Bring classes and commitments into your weekly plan." action="Open connections" />;
  if (data?.calendar.state === "reconnect_required") return <Recovery title="Calendar needs attention" message="Reconnect to bring your latest schedule back into Planner." action="Reconnect" />;
  if (data?.calendar.state === "unavailable" && !data.events.length) return <Recovery title="Planner couldn't update" message="Try again when your connection is available." action="Try again" retry={retry} />;
  if (!events.length) return <div className="flex min-h-72 items-center text-sm text-text-secondary">Nothing is scheduled for this day.</div>;
  return <div className="space-y-1">{events.map((event) => <EventRow event={event} key={event.id} />)}</div>;
}

function EventRow({ event }: { event: TodayEvent }) { return <article className="flex gap-4 rounded-xl px-3 py-4 transition hover:bg-surface-hover"><div className="w-16 shrink-0 font-mono text-xs tabular-nums text-text-tertiary">{event.allDay ? "All day" : new Date(event.startAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div><div className="min-w-0 border-l border-accent pl-4"><h3 className="truncate text-sm font-medium">{event.title}</h3><p className="mt-1 truncate text-xs text-text-tertiary">{event.location ?? "Calendar event"}</p></div></article>; }
function Recovery({ title, message, action, retry }: { title: string; message: string; action: string; retry?: () => void }) { return <div className="flex min-h-72 flex-col items-start justify-center"><h3 className="font-heading text-lg font-semibold">{title}</h3><p className="mt-2 max-w-sm text-[13px] leading-5 text-text-secondary">{message}</p>{retry ? <button className="mt-5 min-h-10 rounded-xl bg-text-primary px-4 text-xs font-semibold text-background" onClick={retry}>{action}</button> : <Link className="mt-5 inline-flex min-h-10 items-center rounded-xl bg-text-primary px-4 text-xs font-semibold text-background" href="/dashboard/connections">{action}</Link>}</div>; }
function AgendaSkeleton() { return <div className="space-y-4"><div className="h-14 animate-pulse rounded-xl bg-surface-hover" /><div className="h-14 animate-pulse rounded-xl bg-surface-hover" /><div className="h-14 animate-pulse rounded-xl bg-surface-hover" /></div>; }
function startOfWeek(date: Date) { const result = new Date(date); result.setHours(0, 0, 0, 0); const day = result.getDay(); result.setDate(result.getDate() - (day === 0 ? 6 : day - 1)); return result; }
function addDays(date: Date, amount: number) { const result = new Date(date); result.setDate(result.getDate() + amount); return result; }
function localDateKey(date: Date) { return new Intl.DateTimeFormat("en-CA").format(date); }
function eventDateKey(event: TodayEvent) { return event.allDay ? event.startAt.slice(0, 10) : localDateKey(new Date(event.startAt)); }
function formatRange(date: Date) { const end = addDays(date, 6); return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`; }
function formatDay(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }); }
function statusLabel(state?: CalendarState) { return state === "current" ? "Up to date" : state === "saved" ? "Saved for offline use" : state === "device_saved" ? "Saved on this device" : state === "disconnected" ? "Calendar not connected" : state === "reconnect_required" ? "Calendar needs attention" : state === "unavailable" ? "Couldn’t update just now" : "Loading schedule"; }
