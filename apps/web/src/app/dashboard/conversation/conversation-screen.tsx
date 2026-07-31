"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { MobileNavigation } from "../components/mobile-nav";
import { Sidebar } from "../components/sidebar";
import { Icon } from "../components/dashboard-icon";
import { useDashboardUser } from "../dashboard-session";
import { calendarUpdatedEvent } from "@/lib/api";
import { AssistantMessage } from "./assistant-message";
import { deleteCachedThread, deletePendingMessage, getConversationDraft, listCachedThreads, listPendingMessages, saveCachedThread, saveConversationDraft, savePendingMessage, updatePendingMessage, type PendingMessage } from "./conversation-storage";

type Action = { type: "create_event" | "update_event" | "delete_event"; title: string; startAt: string; endAt: string; location: string | null; conflicts: Array<{ title: string; startAt: string; endAt: string; allDay: boolean }>; availability: "current" | "saved" | "unavailable" | "disconnected" | "reconnect_required"; originalTitle?: string };
type LocalMessageStatus = "sent" | "pending" | "sending" | "failed";
type Message = { role: "user" | "zury"; text: string; clientMessageId?: string; actionId?: string; action?: Action; actionResolved?: boolean; delivery?: LocalMessageStatus };
type Thread = { id: string; title: string; updatedAt: string };
type ThreadResponse = { id: string; title?: string; messages?: Array<{ role: "user" | "assistant"; content: string }>; pendingAction?: { id: string; type: Action["type"]; payload: string; expiresAt: string } | null };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function ConversationScreen() {
  const user = useDashboardUser();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Thread | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const retryingRef = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    void loadThreads();
    void getConversationDraft(user.id).then(setInput).catch(() => undefined).finally(() => setDraftLoaded(true));
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", retryPending);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", retryPending); window.removeEventListener("offline", update); };
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    const timeout = window.setTimeout(() => void saveConversationDraft(user.id, input).catch(() => undefined), 200);
    return () => window.clearTimeout(timeout);
  }, [draftLoaded, input, user.id]);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length]);

  // Auto-resize textarea logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  async function loadThreads() {
    try {
      const response = await fetch(`${apiUrl}/api/conversations`, { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("Unavailable");
      const result = (await response.json()) as { conversations: Thread[] };
      setThreads(result.conversations);
      if (result.conversations[0]) await openThread(result.conversations[0].id);
    } catch (e) {
      setOffline(true);
      const cached = await listCachedThreads(user.id).catch(() => []);
      setThreads(cached.map(({ id, title, updatedAt }) => ({ id, title, updatedAt })));
      if (cached[0]) { setConversationId(cached[0].id); setMessages(await withPending(toMessages(cached[0].messages), cached[0].id)); }
      else setMessages(await withPending([], null));
    }
    setPendingCount((await listPendingMessages(user.id).catch(() => [])).length);
  }

  async function openThread(id: string) {
    try {
      const response = await fetch(`${apiUrl}/api/conversations/${id}`, { credentials: "include", cache: "no-store" });
      if (!response.ok) return;
      const result = (await response.json()) as ThreadResponse;
      setConversationId(result.id);
      setMessages(await withPending(toMessages(result.messages ?? [], result.pendingAction), result.id));
      await saveCachedThread({ userId: user.id, id: result.id, title: result.title ?? "Conversation", updatedAt: new Date().toISOString(), messages: result.messages ?? [] }).catch(() => undefined);
    } catch (e) {
      console.error(e);
    }
  }

  async function newConversation() {
    try {
      const response = await fetch(`${apiUrl}/api/conversations`, { method: "POST", credentials: "include" });
      if (!response.ok) return;
      const result = (await response.json()) as { id: string };
      setConversationId(result.id);
      setMessages([]);
      setThreads((current) => [{ id: result.id, title: "New conversation", updatedAt: new Date().toISOString() }, ...current]);
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteConversation(thread: Thread) {
    setDeleteBusy(true);
    try {
      const response = await fetch(`${apiUrl}/api/conversations/${thread.id}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        throw new Error(result?.error?.message ?? "Conversation could not be deleted.");
      }
      const remaining = threads.filter((item) => item.id !== thread.id);
      setThreads(remaining);
      await deleteCachedThread(user.id, thread.id).catch(() => undefined);
      setConversationToDelete(null);
      if (conversationId === thread.id) {
        if (remaining[0]) await openThread(remaining[0].id);
        else { setConversationId(null); setMessages([]); }
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Conversation could not be deleted.");
    } finally { setDeleteBusy(false); }
  }

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const message = input.trim();
    if (!message || busy) return;

    setInput("");
    void saveConversationDraft(user.id, "").catch(() => undefined);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const clientMessageId = crypto.randomUUID();
    const pending: PendingMessage = { id: clientMessageId, userId: user.id, conversationId, content: message, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", createdAt: new Date().toISOString(), status: navigator.onLine ? "sending" : "pending" };
    await savePendingMessage(pending);
    setPendingCount((count) => count + 1);
    setMessages((current) => [...current, { role: "user", text: message, clientMessageId, delivery: pending.status }]);
    if (!navigator.onLine) return;
    setBusy(true);
    await deliverMessage(pending);
    setBusy(false);
  }

  async function retryPending() {
    if (!navigator.onLine || retryingRef.current) return;
    retryingRef.current = true;
    setOffline(false);
    const pending = await listPendingMessages(user.id).catch(() => []);
    for (const message of pending) {
      const delivered = await deliverMessage(message);
      if (!delivered) break;
    }
    const remaining = await listPendingMessages(user.id).catch(() => []);
    setPendingCount(remaining.length);
    retryingRef.current = false;
  }

  async function deliverMessage(message: PendingMessage): Promise<boolean> {
    if (!navigator.onLine) return false;
    await updatePendingMessage(message.id, { status: "sending" }).catch(() => undefined);
    setMessages((current) => current.map((item) => item.clientMessageId === message.id ? { ...item, delivery: "sending" } : item));
    try {
      const response = await fetch(`${apiUrl}/api/conversation`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: message.content, timezone: message.timezone, ...(message.conversationId ? { conversationId: message.conversationId } : {}), clientMessageId: message.id }) });
      const result = await response.json().catch(() => null) as { message?: string; actionId?: string; resolvedActionId?: string; action?: Action; conversationId?: string; error?: { message?: string } } | null;
      if (!response.ok || !result || result.error) throw new Error(result?.error?.message ?? "Couldn't send");
      await deletePendingMessage(message.id);
      setPendingCount((count) => Math.max(0, count - 1));
      if (result.conversationId) setConversationId(result.conversationId);
      const reply: Message = { role: "zury", text: result.message ?? "Zury responded." };
      if (result.actionId) reply.actionId = result.actionId;
      if (result.action) reply.action = result.action;
      setMessages((current) => [...current.map((item) => item.clientMessageId === message.id ? { ...item, delivery: "sent" as const } : item.actionId === result.resolvedActionId ? { ...item, actionResolved: true } : item), reply]);
      await refreshThreadList();
      if (result.conversationId) await refreshCachedThread(result.conversationId);
      return true;
    } catch (error) {
      await updatePendingMessage(message.id, { status: "failed", error: error instanceof Error ? error.message : "Couldn't send" }).catch(() => undefined);
      setMessages((current) => current.map((item) => item.clientMessageId === message.id ? { ...item, delivery: "failed" } : item));
      return false;
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  async function refreshThreadList() {
    try {
      const response = await fetch(`${apiUrl}/api/conversations`, { credentials: "include", cache: "no-store" });
      if (!response.ok) return;
      const result = (await response.json()) as { conversations: Thread[] };
      setThreads(result.conversations);
    } catch (e) {
      console.error(e);
    }
  }

  async function refreshCachedThread(id: string) {
    const response = await fetch(`${apiUrl}/api/conversations/${id}`, { credentials: "include", cache: "no-store" });
    if (!response.ok) return;
    const thread = await response.json() as ThreadResponse;
    await saveCachedThread({ userId: user.id, id: thread.id, title: thread.title ?? "Conversation", updatedAt: new Date().toISOString(), messages: thread.messages ?? [] });
  }

  async function withPending(base: Message[], id: string | null): Promise<Message[]> {
    const pending = await listPendingMessages(user.id).catch(() => []);
    return base.concat(pending.filter((item) => item.conversationId === id || (!item.conversationId && !id)).map((item) => ({ role: "user" as const, text: item.content, clientMessageId: item.id, delivery: item.status })));
  }

  async function retryMessage(clientMessageId: string) {
    if (!navigator.onLine) return;
    const pending = (await listPendingMessages(user.id)).find((item) => item.id === clientMessageId);
    if (!pending) return;
    setBusy(true);
    await deliverMessage(pending);
    setBusy(false);
  }

  async function confirm(actionId: string) {
    if (!navigator.onLine) {
      setOffline(true);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`${apiUrl}/api/conversation/confirm`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actionId }),
      });
      const result = (await response.json()) as { message?: string; error?: { message?: string } };
      if (response.ok && result.message && !result.error) window.dispatchEvent(new Event(calendarUpdatedEvent));
      setMessages((current) => current.map((message) => message.actionId === actionId ? { ...message, actionResolved: true } : message).concat({ role: "zury", text: result.message ?? result.error?.message ?? "The event could not be saved." }));
    } catch {
      setMessages((current) => [...current, { role: "zury", text: "The event could not be saved just now." }]);
    } finally {
      setBusy(false);
    }
  }

  async function cancel(actionId: string) {
    setBusy(true);
    try {
      const response = await fetch(`${apiUrl}/api/conversation/cancel`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ actionId }) });
      const result = (await response.json()) as { message?: string; error?: { message?: string } };
      setMessages((current) => current.map((message) => message.actionId === actionId ? { ...message, actionResolved: true } : message).concat({ role: "zury", text: result.message ?? result.error?.message ?? "That action is no longer available." }));
    } finally { setBusy(false); }
  }

  return (
    <div className="dashboard-theme h-dvh overflow-hidden bg-[#080A09] text-text-primary">
      <Sidebar user={user} />
      <div className="flex h-dvh flex-col pb-16 lg:ml-20 lg:pb-0 xl:ml-[260px]">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#080A09]/80 px-4 backdrop-blur-2xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">Academic Chief of Staff</p>
              <h1 className="font-heading text-lg font-semibold tracking-[-0.03em] text-text-primary">Conversation</h1>
            </div>
          </div>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.1] bg-surface/80 px-3.5 text-xs font-medium text-text-secondary transition hover:border-white/[0.2] hover:bg-surface-hover hover:text-text-primary active:scale-[0.98]"
            onClick={() => void newConversation()}
          >
            <Icon name="plus" size={14} />
            <span className="hidden sm:inline">New conversation</span>
            <span className="sm:hidden">New</span>
          </button>
        </header>

        {/* Main Workspace Area */}
        <main className="grid flex-1 min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Active Chat Column */}
          <section className="flex flex-col h-full min-h-0 min-w-0 border-r border-white/[0.08]">
            {/* Mobile threads pill scroll */}
            <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-white/[0.06] p-3 lg:hidden">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs transition ${
                    thread.id === conversationId
                      ? "border-emerald/40 bg-emerald-soft text-emerald font-medium"
                      : "border-white/[0.08] bg-surface text-text-tertiary hover:text-text-secondary"
                  }`}
                  onClick={() => void openThread(thread.id)}
                >
                  {thread.title}
                </button>
              ))}
            </div>

            {/* Subheader Context */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.04] px-6 py-2.5 text-xs text-text-tertiary">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald" />
                <span className="font-medium text-text-secondary">Zury AI Assistant</span>
              </div>
              <span className="text-[11px] tracking-wide text-text-tertiary">{offline ? "Offline" : pendingCount ? `${pendingCount} waiting to send` : messages.length ? `${messages.length} messages` : "New thread"}</span>
            </div>

            {/* Scrollable Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 lg:px-12">
              {messages.length === 0 ? (
                <EmptyConversation setInput={setInput} />
              ) : (
                <div className="mx-auto max-w-3xl space-y-6">
                  {messages.map((message, index) => (
                    <MessageBubble key={message.clientMessageId ?? `${message.role}-${index}`} message={message} busy={busy} offline={offline} onRetry={() => message.clientMessageId && void retryMessage(message.clientMessageId)} onConfirm={confirm} onCancel={cancel} />
                  ))}
                  {offline && <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs leading-5 text-amber-200">You&apos;re offline. New messages will be sent when you&apos;re connected.</div>}
                  {busy && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#121614] px-4 py-3 text-xs text-text-secondary">
                        <span className="size-2 rounded-full bg-emerald animate-pulse" />
                        <span>Zury is thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Fixed Bottom Input Area (Claude-inspired minimal container) */}
            <div className="shrink-0 bg-[#080A09] p-4 sm:px-8 lg:px-12">
              <form
                className="mx-auto flex w-full max-w-3xl flex-col rounded-2xl border border-white/[0.12] bg-[#121614] p-3 transition focus-within:border-white/[0.24]"
                onSubmit={(event) => void send(event)}
              >
                <textarea
                  ref={textareaRef}
                  className="w-full resize-none bg-transparent px-2 text-sm leading-relaxed text-text-primary outline-none placeholder:text-text-tertiary min-h-[48px] max-h-[180px]"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Zury..."
                  rows={1}
                  aria-label="Message Zury"
                />
                <div className="mt-1 flex items-center justify-between px-1 pt-1">
                  <span className="text-[11px] text-text-tertiary hidden sm:inline">
                    Press <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-text-secondary font-mono">Enter</kbd> to send
                  </span>
                  <button
                    className="ml-auto grid size-8 place-items-center rounded-xl bg-text-primary text-[#080A09] transition hover:opacity-90 active:scale-95 disabled:opacity-20"
                    type="submit"
                    disabled={!input.trim() || busy}
                    aria-label="Send message"
                  >
                    <Icon name="arrow" size={14} />
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Sidebar History Rail */}
              <HistoryRail threads={threads} activeId={conversationId} onSelect={(id) => void openThread(id)} onNew={() => void newConversation()} onDelete={setConversationToDelete} />
        </main>
      </div>
      <MobileNavigation />
      {conversationToDelete && <DeleteConversationDialog conversation={conversationToDelete} busy={deleteBusy} onCancel={() => setConversationToDelete(null)} onConfirm={() => void deleteConversation(conversationToDelete)} />}
    </div>
  );
}

function HistoryRail({ threads, activeId, onSelect, onNew, onDelete }: { threads: Thread[]; activeId: string | null; onSelect: (id: string) => void; onNew: () => void; onDelete: (thread: Thread) => void }) {
  return (
    <aside className="hidden h-full flex-col overflow-y-auto border-l border-white/[0.08] bg-[#0D100F]/60 p-5 lg:flex">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">History</p>
          <p className="mt-0.5 text-xs text-text-secondary">Past Conversations</p>
        </div>
        <button
          className="grid size-8 place-items-center rounded-lg border border-white/[0.08] bg-surface text-text-tertiary transition hover:border-white/[0.18] hover:bg-surface-hover hover:text-text-primary"
          onClick={onNew}
          aria-label="New conversation"
        >
          <Icon name="plus" size={14} />
        </button>
      </div>

      <div className="mt-4 space-y-1.5 flex-1 overflow-y-auto pr-1">
        {threads.length ? (
          threads.map((thread) => {
            const isActive = thread.id === activeId;
            return (
              <div
                key={thread.id}
                className={`group flex w-full items-start gap-2 rounded-xl px-3.5 py-3 text-left transition ${
                  isActive
                    ? "border border-emerald/30 bg-emerald-soft text-text-primary"
                    : "border border-transparent text-text-secondary hover:border-white/[0.06] hover:bg-surface-hover hover:text-text-primary"
                }`}
              >
                <button className="min-w-0 flex-1 text-left" onClick={() => onSelect(thread.id)} aria-current={isActive ? "page" : undefined}><p className="truncate text-[13px] font-medium leading-snug">{thread.title}</p><p className="mt-1 text-[11px] text-text-tertiary">{formatRelative(thread.updatedAt)}</p></button>
                <button className="grid size-7 shrink-0 place-items-center rounded-lg text-text-tertiary opacity-0 transition hover:bg-red-400/10 hover:text-red-300 group-hover:opacity-100 focus-visible:opacity-100" aria-label={`Delete ${thread.title}`} onClick={() => onDelete(thread)}><Icon name="trash" size={14} /></button>
              </div>
            );
          })
        ) : (
          <p className="px-3 py-6 text-center text-xs leading-relaxed text-text-tertiary">Your saved conversations will appear here.</p>
        )}
      </div>
    </aside>
  );
}

function DeleteConversationDialog({ conversation, busy, onCancel, onConfirm }: { conversation: Thread; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 p-3 backdrop-blur-sm sm:place-items-center" role="presentation"><section className="w-full max-w-md rounded-2xl border border-white/[.1] bg-[#111113] p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-conversation-title"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-400/10 text-red-300"><Icon name="trash" size={17} /></span><div><h2 id="delete-conversation-title" className="font-heading text-lg font-semibold tracking-[-.03em]">Delete conversation?</h2><p className="mt-2 text-[13px] leading-5 text-text-secondary">This removes <span className="font-medium text-text-primary">{conversation.title}</span> and any unsaved Calendar request. Events already added to Google Calendar stay there.</p></div></div><div className="mt-6 flex justify-end gap-2"><button className="min-h-10 rounded-xl px-4 text-[13px] font-medium text-text-secondary hover:bg-surface-hover" onClick={onCancel} disabled={busy}>Keep it</button><button className="min-h-10 rounded-xl bg-red-300 px-4 text-[13px] font-semibold text-[#160506] disabled:opacity-50" onClick={onConfirm} disabled={busy}>{busy ? "Deleting..." : "Delete conversation"}</button></div></section></div>;
}

function EmptyConversation({ setInput }: { setInput: (value: string) => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="grid size-14 place-items-center rounded-2xl border border-emerald/20 bg-emerald-soft text-emerald">
        <Icon name="spark" size={24} />
      </span>
      <h2 className="mt-6 font-heading text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.04em] text-text-primary">
        What should we make room for today?
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
        Ask about your schedule, prepare for upcoming exams, or let Zury help structure your day.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2.5 max-w-lg">
        <button
          className="rounded-xl border border-white/[0.08] bg-[#121614] px-4 py-2.5 text-xs text-text-secondary transition hover:border-emerald/40 hover:bg-surface-hover hover:text-text-primary active:scale-[0.98]"
          onClick={() => setInput("What do I have tomorrow?")}
        >
          "What do I have tomorrow?"
        </button>
        <button
          className="rounded-xl border border-white/[0.08] bg-[#121614] px-4 py-2.5 text-xs text-text-secondary transition hover:border-emerald/40 hover:bg-surface-hover hover:text-text-primary active:scale-[0.98]"
          onClick={() => setInput("Add a class next Monday at 11am")}
        >
          "Add a class next Monday at 11am"
        </button>
        <button
          className="rounded-xl border border-white/[0.08] bg-[#121614] px-4 py-2.5 text-xs text-text-secondary transition hover:border-emerald/40 hover:bg-surface-hover hover:text-text-primary active:scale-[0.98]"
          onClick={() => setInput("Help me plan my study schedule for exams")}
        >
          "Help me plan my study schedule for exams"
        </button>
      </div>
    </div>
  );
}

  function MessageBubble({ message, busy, offline, onRetry, onConfirm, onCancel }: { message: Message; busy: boolean; offline: boolean; onRetry: () => void; onConfirm: (id: string) => Promise<void>; onCancel: (id: string) => Promise<void> }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(680px,88%)] rounded-2xl px-4 py-3 text-sm leading-relaxed transition ${
          isUser
            ? "bg-[#21D18B] text-[#080A09] font-medium rounded-br-xs"
            : "border border-white/[0.08] bg-[#121614] text-text-primary rounded-bl-xs"
        }`}
      >
        {isUser ? <><p className="whitespace-pre-wrap">{message.text}</p>{message.delivery && message.delivery !== "sent" && <div className="mt-1 flex items-center justify-between gap-3 text-[10px] font-normal text-[#080A09]/65"><span>{message.delivery === "pending" ? "Waiting for connection" : message.delivery === "sending" ? "Sending" : "Couldn’t send"}</span>{message.delivery === "failed" && !offline && <button type="button" className="font-semibold underline" onClick={onRetry}>Try again</button>}</div>}</> : <div className="min-w-0 overflow-x-auto"><AssistantMessage>{message.text}</AssistantMessage></div>}
        {message.actionId && message.action && !message.actionResolved && (
          <div className="mt-4 rounded-xl border border-emerald/20 bg-emerald-soft/40 p-3 text-left">
            <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${message.action.type === "delete_event" ? "text-red-300" : "text-emerald"}`}>{actionLabel(message.action.type)}</p>
            <p className="mt-2 font-medium text-text-primary">{message.action.title}</p>
            {message.action.originalTitle && message.action.originalTitle !== message.action.title && <p className="mt-1 text-xs text-text-tertiary">Previously {message.action.originalTitle}</p>}
            <p className="mt-1 text-xs text-text-secondary">{formatActionDate(message.action.startAt)} to {formatActionTime(message.action.endAt)}</p>
            {message.action.location && <p className="mt-1 text-xs text-text-tertiary">{message.action.location}</p>}
            {message.action.conflicts[0] && <p className="mt-3 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-200">This overlaps {message.action.conflicts[0].title}. You can still continue.</p>}
            {message.action.availability !== "current" && message.action.conflicts.length === 0 && <p className="mt-3 text-xs text-text-tertiary">Availability could not be fully verified.</p>}
            <div className="mt-3 flex flex-wrap gap-2">
               <button className={`inline-flex min-h-9 items-center gap-2 rounded-xl px-3.5 text-xs font-semibold text-[#080A09] disabled:opacity-50 ${message.action.type === "delete_event" ? "bg-red-300" : "bg-emerald"}`} onClick={() => void onConfirm(message.actionId!)} disabled={busy || offline}>{message.action.type === "delete_event" ? "Delete event" : "Confirm"}</button>
               {offline && <p className="basis-full text-xs text-amber-200">You’ll need to be online before Zury can update Calendar.</p>}
              <button className="inline-flex min-h-9 items-center rounded-xl border border-white/[0.1] px-3.5 text-xs text-text-secondary disabled:opacity-50" onClick={() => void onCancel(message.actionId!)} disabled={busy}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function toMessages(messages: Array<{ role: "user" | "assistant"; content: string }>, pendingAction?: ThreadResponse["pendingAction"]) {
  return messages.map((message, index) => ({
    role: message.role === "assistant" ? ("zury" as const) : ("user" as const),
    text: message.content,
    ...(pendingAction && message.role === "assistant" && index === messages.length - 1 ? { actionId: pendingAction.id, action: storedAction(pendingAction) } : {}),
  }));
}

function formatActionDate(value: string) { return new Date(value).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
function formatActionTime(value: string) { return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); }
function storedAction(pending: NonNullable<ThreadResponse["pendingAction"]>): Action {
  const stored = JSON.parse(pending.payload) as { type: Action["type"]; command?: { title: string; startAt: string; endAt: string; location: string | null }; event?: { title: string; startAt: string; endAt: string; location: string | null }; changes?: { title?: string; startAt?: string; endAt?: string; location?: string | null } };
  const event = stored.event ?? stored.command;
  const changes = stored.changes ?? {};
  const action: Action = { type: stored.type, title: changes.title ?? event?.title ?? "Calendar event", startAt: changes.startAt ?? event?.startAt ?? new Date().toISOString(), endAt: changes.endAt ?? event?.endAt ?? new Date().toISOString(), location: changes.location !== undefined ? changes.location : event?.location ?? null, conflicts: [], availability: "unavailable" };
  if (event?.title) action.originalTitle = event.title;
  return action;
}

function actionLabel(type: Action["type"]) { return type === "create_event" ? "Add to calendar" : type === "update_event" ? "Change calendar event" : "Remove from calendar"; }

function formatRelative(value: string) {
  const age = Date.now() - new Date(value).getTime();
  if (age < 86_400_000) return "Today";
  if (age < 172_800_000) return "Yesterday";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
