"use client";

import { DashboardHeader } from "./dashboard-header";
import { CalendarSummary, ChatEntry, ConnectedSources, TodayFocus } from "./dashboard-sections";
import { MobileNavigation } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { TodayDataProvider } from "./today-data-provider";
import { useDashboardUser } from "../dashboard-session";

export function Dashboard() {
  const user = useDashboardUser();
  const firstName = user.name.trim().split(/\s+/)[0] || "there";
  return <TodayDataProvider userId={user.id}><div className="dashboard-theme min-h-dvh bg-background text-text-primary"><Sidebar user={user} /><div className="min-h-dvh pb-24 lg:ml-20 lg:pb-0 xl:ml-[260px]"><DashboardHeader firstName={firstName} /><main className="mx-auto max-w-[1200px] px-5 pb-14 pt-8 sm:px-8 lg:px-10 xl:px-12 xl:pt-12"><div className="space-y-6"><TodayFocus /><div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]"><CalendarSummary /><ConnectedSources /></div><ChatEntry /></div></main></div><MobileNavigation /></div></TodayDataProvider>;
}
