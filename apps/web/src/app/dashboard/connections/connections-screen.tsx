"use client";

import { useEffect, useState } from "react";
import { DashboardCard } from "../components/dashboard-card";
import { Icon } from "../components/dashboard-icon";
import { MobileNavigation } from "../components/mobile-nav";
import { Sidebar } from "../components/sidebar";
import { useDashboardUser } from "../dashboard-session";

type Connection = {
  status: "disconnected" | "connected" | "reconnect_required";
  connectedAt: string | null;
  canCreateEvents?: boolean;
};
type GitHubConnection = { status: "disconnected" | "connected" | "reconnect_required"; connectedAt: string | null };
type GitHubRepository = { id?: string; externalId?: string; name: string; fullName: string; description?: string | null; selected: boolean };
type GitHubActivity = { state: "disconnected" | "current" | "saved" | "unavailable"; fetchedAt: string | null; activity: { commits: Array<{ id: string; message: string; repository: string; committedAt: string }>; pullRequests: Array<{ id: string; title: string; repository: string; url: string; updatedAt: string; state: string }> } };

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function ConnectionsScreen() {
  const user = useDashboardUser();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [github, setGitHub] = useState<GitHubConnection | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activity, setActivity] = useState<GitHubActivity | null>(null);

  async function loadConnection() {
    try {
      const response = await fetch(`${apiUrl}/api/calendar/connection`, { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("Connection unavailable");
      setConnection(await response.json() as Connection);
    } catch {
      setMessage("Connection details couldn't be loaded just now.");
    }
  }

  async function loadGitHub() {
    try {
      const response = await fetch(`${apiUrl}/api/github/connection`, { credentials: "include", cache: "no-store" });
      if (!response.ok) return;
      const result = await response.json() as GitHubConnection;
      setGitHub(result);
      if (result.status === "connected") {
        const repos = await fetch(`${apiUrl}/api/github/repositories`, { credentials: "include", cache: "no-store" });
        if (repos.ok) setRepositories(((await repos.json()) as { repositories: GitHubRepository[] }).repositories);
      }
    } catch { setGitHub({ status: "disconnected", connectedAt: null }); }
  }

  useEffect(() => { void loadConnection(); void loadGitHub(); }, []);

  useEffect(() => {
    if (github?.status !== "connected") return;
    const end = new Date(); const start = new Date(end.getTime() - 7 * 86_400_000); const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    void fetch(`${apiUrl}/api/github/activity?rangeStart=${encodeURIComponent(start.toISOString())}&rangeEnd=${encodeURIComponent(end.toISOString())}&timezone=${encodeURIComponent(timezone)}`, { credentials: "include", cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((result) => { if (result) setActivity(result as GitHubActivity); }).catch(() => undefined);
  }, [github?.status]);

  async function connectGitHub() {
    setBusy(true);
    try { const response = await fetch(`${apiUrl}/api/github/connect`, { method: "POST", credentials: "include" }); const result = await response.json() as { authorizationUrl?: string }; if (!result.authorizationUrl) throw new Error(); window.location.assign(result.authorizationUrl); }
    catch { setMessage("GitHub isn't ready to connect just now."); setBusy(false); }
  }

  async function disconnectGitHub() {
    setBusy(true);
    try { const response = await fetch(`${apiUrl}/api/github/connection`, { method: "DELETE", credentials: "include" }); if (!response.ok) throw new Error(); setGitHub({ status: "disconnected", connectedAt: null }); setRepositories([]); }
    catch { setMessage("GitHub couldn't be disconnected just now."); }
    finally { setBusy(false); }
  }

  async function toggleRepository(repository: GitHubRepository) {
    const repositoryId = repository.externalId ?? repository.id ?? "";
    const next = repositories.map((item) => (item.externalId ?? item.id) === repositoryId ? { ...item, selected: !item.selected } : item);
    setRepositories(next);
    const response = await fetch(`${apiUrl}/api/github/repositories/selection`, { method: "PUT", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ repositoryIds: next.filter((item) => item.selected).map((item) => item.externalId ?? item.id).filter(Boolean) }) });
    if (!response.ok) { setRepositories(repositories); setMessage("That project selection couldn't be saved."); }
  }

  async function connect() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`${apiUrl}/api/calendar/connect`, { method: "POST", credentials: "include" });
      const result = await response.json() as { authorizationUrl?: string };
      if (!response.ok || !result.authorizationUrl) throw new Error("Connection unavailable");
      window.location.assign(result.authorizationUrl);
    } catch {
      setMessage("Calendar isn't ready to connect just now.");
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      const response = await fetch(`${apiUrl}/api/calendar/connection`, { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error("Disconnect unavailable");
      setConnection({ status: "disconnected", connectedAt: null });
      setConfirming(false);
      setMessage("Calendar disconnected. Your Zury account is still signed in.");
    } catch {
      setMessage("Calendar couldn't be disconnected just now.");
    } finally {
      setBusy(false);
    }
  }

  const status = connection?.status;
  return (
    <div className="dashboard-theme min-h-dvh bg-background text-text-primary">
      <Sidebar user={user} />
      <div className="min-h-dvh pb-24 lg:ml-20 lg:pb-0 xl:ml-[260px]">
        <header className="sticky top-0 z-20 flex min-h-20 items-center border-b border-border bg-background/85 px-5 backdrop-blur-2xl sm:px-8 lg:px-10 xl:px-12">
          <div><p className="text-[11px] font-medium uppercase tracking-[.12em] text-text-tertiary">Zury</p><h1 className="mt-0.5 font-heading text-2xl font-semibold tracking-[-.04em]">Connections</h1></div>
        </header>
        <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:px-10 xl:px-12 xl:py-12">
          <div className="max-w-2xl"><h2 className="font-heading text-[28px] font-semibold tracking-[-.045em]">Bring your schedule into focus.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary">Connected apps add useful context to your day. They remain optional and can be disconnected without affecting your Zury account.</p></div>
          {message && <div className="mt-7 rounded-xl border border-border bg-surface px-4 py-3 text-[13px] text-text-secondary" role="status">{message}</div>}
          <div className="mt-8 grid gap-6">
            <DashboardCard className="relative overflow-hidden">
              <div className="pointer-events-none absolute -right-24 -top-24 size-56 rounded-full bg-accent-soft blur-3xl" />
              <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface-hover text-accent"><Icon name="calendar" size={20} /></span><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-heading text-lg font-semibold tracking-[-.025em]">Google Calendar</h3><Status status={status} /></div><p className="mt-2 max-w-lg text-[13px] leading-5 text-text-secondary">Zury can read your commitments and prepare calendar changes. Adding, changing, or removing an event always requires confirmation.</p>{connection?.connectedAt && <p className="mt-3 text-xs text-text-tertiary">Connected {new Date(connection.connectedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>}</div></div>
                <div className="flex shrink-0 gap-2 sm:flex-col sm:items-stretch">{status === "connected" && connection?.canCreateEvents ? <button className="min-h-10 rounded-xl border border-border px-4 text-[13px] font-medium text-text-secondary transition hover:bg-surface-hover hover:text-text-primary" onClick={() => setConfirming(true)}>Disconnect</button> : <button className="min-h-10 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-background transition hover:opacity-90 disabled:opacity-50" onClick={() => void connect()} disabled={busy}>{busy ? "Opening..." : status === "connected" ? "Enable event creation" : status === "reconnect_required" ? "Reconnect" : "Connect calendar"}</button>}</div>
              </div>
            </DashboardCard>
             <DashboardCard><div className="flex flex-col gap-5"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface-hover text-text-tertiary"><Icon name="branch" size={20} /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="font-heading text-lg font-semibold tracking-[-.025em]">GitHub</h3><Status status={github?.status} /></div><p className="mt-2 text-[13px] leading-5 text-text-secondary">Bring recent coursework and group-project changes into Zury. Access is read-only.</p></div>{github?.status === "connected" ? <button className="min-h-10 rounded-xl border border-border px-4 text-[13px] text-text-secondary" onClick={() => void disconnectGitHub()} disabled={busy}>Disconnect</button> : <button className="min-h-10 rounded-xl bg-text-primary px-4 text-[13px] font-semibold text-background disabled:opacity-50" onClick={() => void connectGitHub()} disabled={busy}>Connect GitHub</button>}</div>{github?.status === "connected" && <div className="border-t border-border pt-4"><p className="text-xs font-medium text-text-secondary">Projects Zury should follow</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{repositories.map((repository) => <label key={repository.id ?? repository.externalId} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 text-xs text-text-secondary hover:bg-surface-hover"><input type="checkbox" checked={repository.selected} onChange={() => void toggleRepository(repository)} className="accent-emerald" /><span className="min-w-0 truncate">{repository.fullName}</span></label>)}</div>{!repositories.length && <p className="mt-3 text-xs text-text-tertiary">No accessible projects were found.</p>}<div className="mt-5 border-t border-border pt-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-text-secondary">Recent project context</p>{activity && <span className="text-[10px] text-text-tertiary">{activity.state === "saved" ? "Saved" : activity.state === "current" ? "Current" : "Unavailable"}</span>}</div>{activity?.activity.commits[0] || activity?.activity.pullRequests[0] ? <div className="mt-3 space-y-2">{activity.activity.commits.slice(0, 3).map((commit) => <p key={commit.id} className="truncate text-xs text-text-secondary">{commit.repository}: {commit.message}</p>)}{activity.activity.pullRequests.slice(0, 2).map((pull) => <p key={pull.id} className="truncate text-xs text-text-secondary">{pull.repository}: {pull.title}</p>)}</div> : <p className="mt-3 text-xs text-text-tertiary">{repositories.some((repository) => repository.selected) ? "No activity in this range." : "Choose a project to see relevant activity here."}</p>}</div></div>}</div></DashboardCard>
          </div>
        </main>
      </div>
      <MobileNavigation />
      {confirming && <ConfirmDisconnect busy={busy} onCancel={() => setConfirming(false)} onConfirm={() => void disconnect()} />}
    </div>
  );
}

function Status({ status }: { status: Connection["status"] | undefined }) {
  if (!status) return <span className="text-xs text-text-tertiary">Checking...</span>;
  const label = status === "connected" ? "Connected" : status === "reconnect_required" ? "Needs attention" : "Not connected";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${status === "connected" ? "bg-accent-soft text-accent" : "bg-surface-hover text-text-tertiary"}`}><span className={`size-1 rounded-full ${status === "connected" ? "bg-accent" : "bg-text-tertiary"}`} />{label}</span>;
}

function ConfirmDisconnect({ busy, onCancel, onConfirm }: { busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-end bg-black/65 p-3 backdrop-blur-sm sm:place-items-center" role="presentation"><section className="w-full max-w-md rounded-2xl border border-border bg-[#111113] p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="disconnect-title"><h2 id="disconnect-title" className="font-heading text-xl font-semibold tracking-[-.035em]">Disconnect Calendar?</h2><p className="mt-3 text-[13px] leading-5 text-text-secondary">Zury will stop refreshing your Calendar. This will not sign you out or change events in Google Calendar.</p><div className="mt-6 flex justify-end gap-2"><button className="min-h-10 rounded-xl px-4 text-[13px] font-medium text-text-secondary hover:bg-surface-hover" onClick={onCancel} disabled={busy}>Keep connected</button><button className="min-h-10 rounded-xl bg-red-400 px-4 text-[13px] font-semibold text-[#160506] disabled:opacity-50" onClick={onConfirm} disabled={busy}>{busy ? "Disconnecting..." : "Disconnect"}</button></div></section></div>;
}
