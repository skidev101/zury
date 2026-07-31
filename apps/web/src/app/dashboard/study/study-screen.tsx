"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import { AssistantMessage } from "../conversation/assistant-message";
import { DashboardCard } from "../components/dashboard-card";
import { Icon } from "../components/dashboard-icon";
import { MobileNavigation } from "../components/mobile-nav";
import { Sidebar } from "../components/sidebar";
import { useDashboardUser } from "../dashboard-session";

const MAX_PDF_BYTES = 15 * 1024 * 1024;
type Message = { role: "user" | "assistant"; content: string };

export function StudyScreen() {
  const user = useDashboardUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [document, setDocument] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function chooseDocument(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Choose a PDF document.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError("Choose a PDF smaller than 15 MB.");
      return;
    }
    setDocument(file);
    setMessages([]);
  }

  async function ask(event: FormEvent) {
    event.preventDefault();
    const nextQuestion = question.trim();
    if (!document || !nextQuestion || busy) return;
    const priorMessages = messages;
    setMessages([...priorMessages, { role: "user", content: nextQuestion }]);
    setQuestion("");
    setBusy(true);
    setError(null);
    try {
      const history = btoa(unescape(encodeURIComponent(JSON.stringify(priorMessages.slice(-8)))));
      const response = await apiFetch("/api/study/ask", {
        method: "POST",
        headers: {
          "content-type": "application/pdf",
          "x-zury-question": encodeURIComponent(nextQuestion),
          "x-zury-history": history,
        },
        body: document,
      });
      const result = await response.json() as { answer?: string; error?: { message?: string } };
      if (!response.ok || !result.answer) throw new Error(result.error?.message ?? "The document couldn't be read just now.");
      setMessages((current) => [...current, { role: "assistant", content: result.answer! }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The document couldn't be read just now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dashboard-theme min-h-dvh bg-background text-text-primary">
      <Sidebar user={user} />
      <div className="min-h-dvh pb-24 lg:ml-20 lg:pb-0 xl:ml-[260px]">
        <header className="sticky top-0 z-20 flex min-h-20 items-center border-b border-border bg-background/85 px-5 backdrop-blur-2xl sm:px-8 lg:px-10 xl:px-12">
          <div><p className="text-[11px] font-medium uppercase tracking-[.12em] text-text-tertiary">Document workspace</p><h1 className="mt-0.5 font-heading text-2xl font-semibold tracking-[-.04em]">Study</h1></div>
        </header>
        <main className="mx-auto grid max-w-[1320px] gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[340px_1fr] lg:px-10 xl:px-12 xl:py-12">
          <aside>
            <DashboardCard className="lg:sticky lg:top-28">
              <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent"><Icon name="study" size={21} /></span>
              <h2 className="mt-5 font-heading text-xl font-semibold tracking-[-.035em]">Bring one reading into focus.</h2>
              <p className="mt-2 text-[13px] leading-5 text-text-secondary">Upload lecture notes, a paper, or a chapter. Zury answers from that document and says when the answer is not there.</p>
              <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event: ChangeEvent<HTMLInputElement>) => chooseDocument(event.target.files?.[0])} />
              <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseDocument(event.dataTransfer.files[0]); }} className={`mt-6 flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center transition ${dragging ? "border-accent bg-accent-soft" : "border-border-strong bg-surface-hover/40 hover:border-accent/60"}`}>
                <Icon name={document ? "note" : "plus"} size={22} className={document ? "text-accent" : "text-text-tertiary"} />
                <span className="mt-3 max-w-full truncate text-sm font-medium">{document?.name ?? "Choose or drop a PDF"}</span>
                <span className="mt-1 text-[11px] text-text-tertiary">{document ? formatBytes(document.size) : "Up to 15 MB"}</span>
              </button>
              {document && <button type="button" className="mt-3 w-full min-h-9 rounded-xl text-xs text-text-tertiary hover:bg-surface-hover hover:text-text-primary" onClick={() => { setDocument(null); setMessages([]); if (inputRef.current) inputRef.current.value = ""; }}>Remove document</button>}
              <p className="mt-5 border-t border-border pt-4 text-[11px] leading-5 text-text-tertiary">The PDF is sent securely with each question and is not saved by Zury.</p>
            </DashboardCard>
          </aside>
          <DashboardCard className="flex min-h-[620px] flex-col p-0 sm:p-0">
            <div className="border-b border-border px-5 py-4 sm:px-7"><p className="text-xs font-medium text-text-secondary">{document ? `Studying ${document.name}` : "Select a PDF to begin"}</p></div>
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-7 sm:px-7">
              {!messages.length && <EmptyStudy documentReady={Boolean(document)} onPrompt={setQuestion} />}
              {messages.map((message, index) => message.role === "user" ? <div key={index} className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-text-primary px-4 py-3 text-sm leading-6 text-background">{message.content}</div> : <div key={index} className="max-w-[90%] text-sm leading-6 text-text-secondary"><AssistantMessage>{message.content}</AssistantMessage></div>)}
              {busy && <div className="flex items-center gap-2 text-xs text-text-tertiary"><span className="size-1.5 animate-pulse rounded-full bg-accent" />Reading your document...</div>}
            </div>
            {error && <p className="mx-5 mb-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger" role="alert">{error}</p>}
            <form onSubmit={ask} className="border-t border-border p-4 sm:p-5"><div className="flex items-end gap-3 rounded-2xl border border-border bg-surface-hover/50 p-2 focus-within:border-accent/50"><textarea rows={2} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} disabled={!document || busy} placeholder={document ? "Ask about an idea, definition, argument, or example..." : "Upload a PDF before asking a question"} className="max-h-36 min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-text-tertiary disabled:cursor-not-allowed" /><button type="submit" disabled={!document || !question.trim() || busy} className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground disabled:cursor-not-allowed disabled:opacity-35" aria-label="Ask question"><Icon name="arrow" /></button></div></form>
          </DashboardCard>
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}

function EmptyStudy({ documentReady, onPrompt }: { documentReady: boolean; onPrompt: (value: string) => void }) {
  if (!documentReady) return <div className="flex min-h-[390px] flex-col items-center justify-center text-center"><span className="grid size-14 place-items-center rounded-2xl bg-surface-hover text-text-tertiary"><Icon name="note" size={24} /></span><h3 className="mt-5 font-heading text-lg font-semibold">Your document stays in your hands.</h3><p className="mt-2 max-w-sm text-[13px] leading-5 text-text-secondary">Choose a PDF on the left. Nothing is uploaded until you ask a question.</p></div>;
  const prompts = ["Summarize the main argument", "Explain the hardest concept simply", "Create five revision questions"];
  return <div className="py-6"><p className="text-[11px] font-medium uppercase tracking-[.12em] text-text-tertiary">A good place to start</p><h3 className="mt-2 font-heading text-2xl font-semibold tracking-[-.04em]">What do you want to understand?</h3><div className="mt-6 grid gap-3 sm:grid-cols-3">{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => onPrompt(prompt)} className="min-h-24 rounded-xl border border-border bg-surface-hover/30 p-4 text-left text-xs leading-5 text-text-secondary transition hover:border-accent/40 hover:text-text-primary">{prompt}</button>)}</div></div>;
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
