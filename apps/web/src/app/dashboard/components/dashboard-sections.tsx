"use client";

import { DashboardCard, SectionHeader } from "./dashboard-card";
import { Icon } from "./dashboard-icon";
import { useTodayData } from "./today-data-provider";
import Link from "next/link";
import type { TodayData } from "../today-types";

export function TodayFocus() {
  const { data, loading } = useTodayData();
  const events = data?.events ?? [];
  const next = events.find((event) => event.allDay || new Date(event.endAt).getTime() > Date.now());
  const minutes = next && !next.allDay ? Math.max(0, Math.round((new Date(next.startAt).getTime() - Date.now()) / 60_000)) : null;
  return <DashboardCard className="relative min-h-[324px] overflow-hidden bg-[linear-gradient(145deg,rgba(23,23,26,.98)_0%,rgba(15,15,17,.98)_62%,rgba(12,18,16,.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,.04)]"><div className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,.12),transparent_68%)] blur-[10px]" /><div className="relative flex h-full flex-col"><div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-text-tertiary">Today&apos;s focus</p><span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent"><span className="size-1.5 rounded-full bg-accent" />{loading ? "Updating" : next ? next.allDay ? "All day" : `Next at ${formatTime(next.startAt)}` : "Nothing scheduled"}</span></div><div className="mt-8 grid flex-1 items-center gap-8 md:grid-cols-[1fr_220px]"><div><p className="mb-2 text-xs font-medium text-text-tertiary">{next ? "NEXT COMMITMENT" : "TODAY"}</p><h2 className="font-heading text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-none tracking-[-.05em]">{loading ? "Loading your day" : next?.title ?? "Your day is clear"}</h2><p className="mt-4 max-w-lg text-[13px] leading-6 text-text-secondary">{next ? next.location ?? "From your calendar" : "There are no more calendar events today."}</p></div><div className="flex min-h-36 flex-col justify-center rounded-2xl border border-white/[.055] bg-black/20 px-5"><span className="font-mono text-[11px] uppercase tracking-[.15em] text-text-tertiary">{minutes === null ? "Schedule" : minutes > 0 ? "Starts in" : "Happening now"}</span><strong className="mt-2 font-heading text-4xl font-semibold tracking-[-.06em]">{minutes === null ? `${events.length} ${events.length === 1 ? "event" : "events"}` : minutes > 0 ? formatDuration(minutes) : "Now"}</strong><span className="mt-2 text-xs text-text-secondary">{calendarLabel(data?.calendar.state)}</span></div></div></div></DashboardCard>;
}

export function CalendarSummary() {
  const { data, loading } = useTodayData();
  return <DashboardCard><SectionHeader eyebrow="Today" title="Schedule" action={<Link href="/dashboard/planner" className="text-xs text-text-tertiary hover:text-text-primary">Open Planner</Link>} />{loading ? <div className="h-40 animate-pulse rounded-xl bg-surface-hover" /> : data?.events.length ? <div className="divide-y divide-border">{data.events.slice(0, 5).map((event) => <div className="flex items-center gap-4 py-3" key={event.id}><span className="w-16 font-mono text-xs text-text-tertiary">{event.allDay ? "All day" : formatTime(event.startAt)}</span><span className="size-1.5 rounded-full bg-accent" /><span className="min-w-0 flex-1 truncate text-[13px]">{event.title}</span></div>)}</div> : <div className="flex min-h-40 items-center text-[13px] text-text-secondary">Nothing is scheduled today.</div>}</DashboardCard>;
}

export function ConnectedSources() {
  const { data } = useTodayData();
  const github = data?.github;
  const commits = github?.activity.commits ?? [];
  const pulls = github?.activity.pullRequests ?? [];
  return <DashboardCard><SectionHeader eyebrow="Context" title="Connected sources" /><div className="space-y-3"><Link href="/dashboard/connections" className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:bg-surface-hover"><span className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent"><Icon name="calendar" /></span><div><p className="text-[13px] font-medium">Google Calendar</p><p className="text-xs text-text-tertiary">Manage access and event creation</p></div><Icon name="arrow" size={14} className="ml-auto text-text-tertiary" /></Link><Link href="/dashboard/connections" className="block rounded-xl border border-border p-3 transition hover:bg-surface-hover"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-surface-hover text-text-tertiary"><Icon name="branch" /></span><div><p className="text-[13px] font-medium">Project activity</p><p className="text-xs text-text-tertiary">{githubLabel(github?.state, commits.length, pulls.length)}</p></div><Icon name="arrow" size={14} className="ml-auto text-text-tertiary" /></div>{(commits[0] || pulls[0]) && <div className="mt-3 border-t border-border pt-3"><p className="truncate text-xs text-text-secondary">{commits[0]?.message ?? pulls[0]?.title}</p>{github?.state === "saved" && <p className="mt-1 text-[10px] text-text-tertiary">Saved project context</p>}</div>}</Link></div></DashboardCard>;
}

export function ChatEntry() { return <Link href="/dashboard/conversation" className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface/80 p-4 text-left transition hover:border-border-strong hover:bg-surface-hover"><span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent"><Icon name="spark" /></span><div className="min-w-0 flex-1"><p className="text-[13px] font-medium">Ask Zury...</p><p className="truncate text-xs text-text-tertiary">Ask about your schedule or prepare a calendar event</p></div><Icon name="arrow" className="text-text-tertiary" /></Link>; }

function formatTime(value: string) { return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
function formatDuration(minutes: number) { if (minutes < 60) return `${minutes} min`; const hours = Math.floor(minutes / 60); const rest = minutes % 60; return rest ? `${hours}h ${rest}m` : `${hours}h`; }
function calendarLabel(state?: string) { if (state === "current") return "Up to date"; if (state === "saved" || state === "device_saved") return "Saved schedule"; if (state === "disconnected") return "Calendar not connected"; return "Couldn’t update"; }
function githubLabel(state: TodayData["github"]["state"] | undefined, commits: number, pulls: number) { if (state === "current") return `${commits} recent ${commits === 1 ? "change" : "changes"} · ${pulls} open ${pulls === 1 ? "review" : "reviews"}`; if (state === "saved") return "Showing saved project context"; if (state === "unavailable") return "Project context couldn't update"; return "Connect GitHub and choose projects"; }
