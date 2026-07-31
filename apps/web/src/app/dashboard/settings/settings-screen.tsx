"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { clearConversationData } from "../conversation/conversation-storage";
import { DashboardCard } from "../components/dashboard-card";
import { Icon } from "../components/dashboard-icon";
import { MobileNavigation } from "../components/mobile-nav";
import { Sidebar } from "../components/sidebar";
import { useDashboardUser } from "../dashboard-session";
import { LogoutButton } from "../logout-button";
import { clearUserSnapshots } from "../today-storage";

export function SettingsScreen() {
  const user = useDashboardUser();
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function clearDeviceData() {
    setClearing(true);
    setMessage(null);
    try {
      await Promise.all([clearUserSnapshots(user.id), clearConversationData(user.id)]);
      setMessage("Saved dashboard and conversation data was removed from this device.");
      setConfirming(false);
    } catch {
      setMessage("Device data couldn't be cleared just now.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="dashboard-theme min-h-dvh bg-background text-text-primary">
      <Sidebar user={user} />
      <div className="min-h-dvh pb-24 lg:ml-20 lg:pb-0 xl:ml-[260px]">
        <header className="sticky top-0 z-20 flex min-h-20 items-center border-b border-border bg-background/85 px-5 backdrop-blur-2xl sm:px-8 lg:px-10 xl:px-12">
          <div><p className="text-[11px] font-medium uppercase tracking-[.12em] text-text-tertiary">Your space</p><h1 className="mt-0.5 font-heading text-2xl font-semibold tracking-[-.04em]">Settings</h1></div>
        </header>
        <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:px-10 xl:px-12 xl:py-12">
          <div className="max-w-2xl"><h2 className="font-heading text-[28px] font-semibold tracking-[-.045em]">Keep Zury personal and predictable.</h2><p className="mt-3 text-sm leading-6 text-text-secondary">Review your account, connected sources, appearance, and information saved on this device.</p></div>
          {message && <div className="mt-7 rounded-xl border border-border bg-surface px-4 py-3 text-[13px] text-text-secondary" role="status">{message}</div>}
          <div className="mt-8 space-y-6">
            <DashboardCard>
              <SettingHeading icon="settings" title="Account" description="The identity currently signed in to Zury." />
              <div className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-surface-hover/35 p-4">
                <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-accent-soft text-sm font-semibold text-accent">{user.image ? <img src={user.image} alt="" className="size-full object-cover" /> : user.name.slice(0, 1).toUpperCase()}</span>
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{user.name}</p><p className="mt-0.5 truncate text-xs text-text-tertiary">{user.email}</p></div>
              </div>
            </DashboardCard>
            <DashboardCard>
              <div className="flex items-center justify-between gap-5"><SettingHeading icon="spark" title="Appearance" description="Switch between the light and dark experience outside the focused dashboard." /><ThemeToggle /></div>
            </DashboardCard>
            <DashboardCard>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><SettingHeading icon="connections" title="Connected sources" description="Manage Calendar and GitHub access in one place." /><Link href="/dashboard/connections" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border px-4 text-xs font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary">Manage connections<Icon name="arrow" size={14} /></Link></div>
            </DashboardCard>
            <DashboardCard>
              <SettingHeading icon="note" title="Data on this device" description="Zury saves recent schedules, conversation copies, drafts, and pending messages in this browser for unreliable connections." />
              <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-lg text-xs leading-5 text-text-tertiary">Clearing device data does not delete server conversations, calendar events, connected accounts, or your Zury account.</p><button type="button" onClick={() => setConfirming(true)} className="min-h-10 shrink-0 rounded-xl border border-danger/35 px-4 text-xs font-medium text-danger hover:bg-danger/10">Clear device data</button></div>
            </DashboardCard>
            <DashboardCard>
              <SettingHeading icon="arrow" title="Session" description="Sign out and remove this account's saved offline information from this browser." />
              <div className="mt-5 max-w-48"><LogoutButton userId={user.id} /></div>
            </DashboardCard>
          </div>
        </main>
      </div>
      <MobileNavigation />
      {confirming && <div className="fixed inset-0 z-50 grid place-items-end bg-black/65 p-3 backdrop-blur-sm sm:place-items-center"><section role="dialog" aria-modal="true" aria-labelledby="clear-data-title" className="w-full max-w-md rounded-2xl border border-border bg-[#111113] p-6 shadow-2xl"><h2 id="clear-data-title" className="font-heading text-xl font-semibold tracking-[-.035em]">Clear data on this device?</h2><p className="mt-3 text-[13px] leading-5 text-text-secondary">Offline schedules, cached conversations, drafts, and waiting messages for this account will be removed from this browser.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setConfirming(false)} disabled={clearing} className="min-h-10 rounded-xl px-4 text-[13px] text-text-secondary hover:bg-surface-hover">Keep data</button><button type="button" onClick={() => void clearDeviceData()} disabled={clearing} className="min-h-10 rounded-xl bg-danger px-4 text-[13px] font-semibold text-white disabled:opacity-50">{clearing ? "Clearing..." : "Clear device data"}</button></div></section></div>}
    </div>
  );
}

function SettingHeading({ icon, title, description }: { icon: Parameters<typeof Icon>[0]["name"]; title: string; description: string }) {
  return <div className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface-hover text-accent"><Icon name={icon} size={18} /></span><div><h3 className="font-heading text-lg font-semibold tracking-[-.025em]">{title}</h3><p className="mt-1 max-w-xl text-[13px] leading-5 text-text-secondary">{description}</p></div></div>;
}
