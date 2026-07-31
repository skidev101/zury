"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./dashboard-icon";

export function DashboardHeader({ firstName }: { firstName: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between gap-4 border-b border-border bg-background/80 px-5 backdrop-blur-2xl sm:px-8 lg:px-10 xl:px-12">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-tertiary">
          {now ? formatDate(now) : "Your day"}
        </p>
        <h1 className="mt-0.5 font-heading text-[22px] font-semibold leading-tight tracking-[-0.035em] sm:text-2xl">
          {now ? greeting(now) : "Welcome"}, {firstName}.
        </h1>
      </div>
      <Link href="/dashboard/conversation" className="hidden min-h-9 items-center justify-center gap-2 rounded-xl bg-text-primary px-3.5 text-[13px] font-semibold text-background shadow-[inset_0_1px_0_rgba(255,255,255,.45)] transition duration-200 hover:-translate-y-px hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:inline-flex">
          <Icon name="plus" size={15} /> New chat
      </Link>
    </header>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

function greeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
