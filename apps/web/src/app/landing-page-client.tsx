"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function LandingPageClient({ hasSession }: { hasSession: boolean }) {
  const [activeTab, setActiveTab] = useState<"today" | "planner" | "offline" | "ask">("today");

  return (
    <div className="min-h-dvh bg-background text-text-primary selection:bg-accent-soft selection:text-accent transition-colors duration-300">
      {/* Background Subtle Grid Texture */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(120,120,120,0.06)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-12">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="grid size-8 place-items-center rounded-[10px] bg-gradient-to-br from-accent to-[#087a50] text-sm font-bold text-accent-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.2)_inset,0_4px_20px_rgba(33,209,139,0.3)] transition group-hover:scale-105">
              Z
            </span>
            <span className="font-serif text-xl font-semibold tracking-tight text-text-primary">
              Zury
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-xs font-medium text-text-secondary md:flex">
            <a href="#features" className="transition hover:text-text-primary">
              Pillars
            </a>
            <a href="#preview" className="transition hover:text-text-primary">
              Interface
            </a>
            <a href="#architecture" className="transition hover:text-text-primary">
              Architecture
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {hasSession ? (
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-semibold text-accent-foreground shadow-[0_0_24px_rgba(33,209,139,0.25)] transition hover:opacity-90 active:scale-[0.98]"
              >
                <span>Go to App</span>
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden h-9 items-center px-3.5 text-xs font-medium text-text-secondary transition hover:text-text-primary sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-xs font-semibold text-text-primary backdrop-blur-md transition hover:border-border-strong hover:bg-surface-hover active:scale-[0.98]"
                >
                  <span>Get Started</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-28 md:pb-28">
        <div className="mx-auto max-w-5xl px-6 text-center lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3.5 py-1 text-xs font-medium text-accent backdrop-blur-md shadow-[0_0_20px_rgba(33,209,139,0.1)]">
            <span className="size-1.5 rounded-full bg-accent animate-pulse" />
            <span>AI Academic Chief of Staff for African Students</span>
          </div>

          <h1 className="mt-8 font-serif text-4xl font-medium tracking-tight text-text-primary sm:text-6xl lg:text-7xl leading-[1.1]">
            Your day, your studies and your next move, <br className="hidden sm:inline" />
            <span className="italic bg-gradient-to-r from-text-primary via-text-secondary to-accent bg-clip-text text-transparent">
              together in one calm place.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-text-secondary sm:text-lg leading-relaxed font-normal">
            Zury turns scattered lectures, exam deadlines, and study plans into an actionable daily rhythm. Built to work seamlessly across desktop & mobile, even on slow or unreliable networks.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={hasSession ? "/dashboard" : "/sign-in"}
              className="inline-flex h-12 items-center gap-2.5 rounded-2xl bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-[0_0_32px_rgba(33,209,139,0.3)] transition hover:opacity-90 active:scale-[0.98]"
            >
              <span>Launch Zury Workspace</span>
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a
              href="#preview"
              className="inline-flex h-12 items-center rounded-2xl border border-border bg-surface px-6 text-sm font-medium text-text-secondary transition hover:border-border-strong hover:bg-surface-hover hover:text-text-primary"
            >
              View Interface
            </a>
          </div>

          {/* Interactive Live Workspace Mockup */}
          <div id="preview" className="mt-16 sm:mt-24 relative mx-auto max-w-5xl rounded-3xl border border-border bg-canvas-raised/95 p-3 sm:p-4 shadow-[0_32px_96px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_96px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition-colors duration-300">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 pb-3 pt-1">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-red-500/40" />
                <div className="size-3 rounded-full bg-yellow-500/40" />
                <div className="size-3 rounded-full bg-green-500/40" />
                <span className="ml-2 font-mono text-[11px] text-text-tertiary hidden sm:inline">zury.app/dashboard</span>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center gap-1 rounded-xl bg-surface p-1 border border-border">
                <button
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${activeTab === "today" ? "bg-accent-soft text-accent" : "text-text-tertiary hover:text-text-secondary"}`}
                  onClick={() => setActiveTab("today")}
                >
                  Today
                </button>
                <button
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${activeTab === "planner" ? "bg-accent-soft text-accent" : "text-text-tertiary hover:text-text-secondary"}`}
                  onClick={() => setActiveTab("planner")}
                >
                  Plan
                </button>
                <button
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${activeTab === "offline" ? "bg-accent-soft text-accent" : "text-text-tertiary hover:text-text-secondary"}`}
                  onClick={() => setActiveTab("offline")}
                >
                  Offline Status
                </button>
                <button
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${activeTab === "ask" ? "bg-accent-soft text-accent" : "text-text-tertiary hover:text-text-secondary"}`}
                  onClick={() => setActiveTab("ask")}
                >
                  Ask
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-accent">
                <span className="size-2 rounded-full bg-accent animate-pulse" />
                <span className="font-medium text-[11px]">Saved offline</span>
              </div>
            </div>

            {/* Dynamic Content Preview Window */}
            <div className="p-4 sm:p-6 text-left min-h-[340px]">
              {activeTab === "today" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="rounded-2xl border border-border bg-surface p-5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Daily Briefing</p>
                      <span className="text-xs text-text-tertiary">Friday, July 31</span>
                    </div>
                    <h3 className="mt-2 font-serif text-2xl font-medium text-text-primary">
                      Here's what needs your attention today.
                    </h3>
                    <div className="mt-5 space-y-3">
                      <div className="flex items-center justify-between rounded-xl border border-border bg-surface-hover p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="size-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(33,209,139,0.4)]" />
                          <div>
                            <p className="text-xs font-medium text-text-primary">Computer Architecture Seminar</p>
                            <p className="text-[11px] text-text-tertiary">10:00 AM - 11:30 AM • Lecture Hall B</p>
                          </div>
                        </div>
                        <span className="rounded-lg bg-accent-soft px-2.5 py-1 text-[10px] font-semibold text-accent">Up Next</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-border bg-surface-hover/50 p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="size-2.5 rounded-full bg-text-tertiary" />
                          <div>
                            <p className="text-xs font-medium text-text-secondary">Algorithms Exam Review Session</p>
                            <p className="text-[11px] text-text-tertiary">2:00 PM - 4:00 PM • Campus Library</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-text-tertiary font-medium">Scheduled</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface p-5 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Zury Intelligence</p>
                      <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                        "You have two open hours after your lecture. I drafted a study block for your upcoming Algorithms quiz."
                      </p>
                    </div>
                    <button className="mt-6 rounded-xl border border-accent/40 bg-accent-soft p-3 text-center transition hover:bg-accent hover:text-accent-foreground">
                      <span className="text-xs font-semibold">Confirm Study Block</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "planner" && (
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <h3 className="font-serif text-xl font-medium text-text-primary">Weekly Schedule & Study Plan</h3>
                      <p className="text-xs text-text-tertiary mt-1">Realistic workload allocation based on active course commitments</p>
                    </div>
                    <span className="rounded-xl border border-border bg-surface-hover px-3 py-1.5 text-xs text-text-secondary font-medium">Auto-balanced</span>
                  </div>
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-border bg-surface-hover p-4">
                      <p className="text-xs font-semibold text-accent">Mon - Wed</p>
                      <p className="mt-2 text-sm font-medium text-text-primary">4 Lectures • 2 Labs</p>
                      <p className="mt-1 text-xs text-text-tertiary">Peak lecture days</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface-hover p-4">
                      <p className="text-xs font-semibold text-accent">Thursday</p>
                      <p className="mt-2 text-sm font-medium text-text-primary">3h Study Block</p>
                      <p className="mt-1 text-xs text-text-tertiary">Revision & Problem sets</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface-hover p-4">
                      <p className="text-xs font-semibold text-text-tertiary">Friday Evening</p>
                      <p className="mt-2 text-sm font-medium text-text-primary">Completely Free</p>
                      <p className="mt-1 text-xs text-text-tertiary">Workload balanced early</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "offline" && (
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <div className="flex items-center gap-3">
                    <span className="size-3 rounded-full bg-accent shadow-[0_0_12px_rgba(33,209,139,0.5)]" />
                    <h3 className="font-serif text-xl font-medium text-text-primary">Offline with Dignity</h3>
                  </div>
                  <p className="mt-2 text-xs text-text-secondary max-w-xl">
                    When network connectivity drops, Zury keeps running without broken error popups. All notes, calendar entries, and study plans stay cached locally.
                  </p>
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                    <div className="rounded-xl border border-border bg-canvas-raised p-4 flex justify-between items-center">
                      <span className="text-text-tertiary">Local Cache</span>
                      <span className="text-accent font-semibold">100% Synced</span>
                    </div>
                    <div className="rounded-xl border border-border bg-canvas-raised p-4 flex justify-between items-center">
                      <span className="text-text-tertiary">Pending Queue</span>
                      <span className="text-text-primary">0 Action Items</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "ask" && (
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <h3 className="font-serif text-xl font-medium text-text-primary">Academic Chief of Staff</h3>
                    <span className="text-xs text-text-tertiary">Ask interface</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-end">
                      <div className="rounded-2xl bg-accent px-4 py-2.5 text-xs text-accent-foreground font-medium">
                        What do I have scheduled for tomorrow morning?
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="rounded-2xl border border-border bg-canvas-raised px-4 py-3 text-xs text-text-primary max-w-lg leading-relaxed">
                        You have a Computer Science lecture at 9:00 AM, followed by 2 free hours before your afternoon lab.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Product Pillars / Experience Section */}
      <section id="features" className="border-t border-border py-24 bg-canvas-raised/40">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="max-w-2xl text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">Engineered for Focus</p>
            <h2 className="mt-3 font-serif text-3xl font-medium text-text-primary sm:text-4xl">
              An Academic OS built around how you actually learn.
            </h2>
            <p className="mt-4 text-sm text-text-secondary leading-relaxed">
              No bloated dashboards or complicated setups. Zury brings clarity to your academic workflow through four core operational pillars.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="rounded-2xl border border-border bg-surface p-6 transition hover:border-accent/40 hover:shadow-lg">
              <div className="size-10 grid place-items-center rounded-xl bg-accent-soft text-accent font-semibold text-base">
                01
              </div>
              <h3 className="mt-5 font-serif text-xl font-medium text-text-primary">Today Briefing</h3>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                Open straight to what's actionable right now. See your daily lectures, study goals, and urgent priorities at a single glance.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-border bg-surface p-6 transition hover:border-accent/40 hover:shadow-lg">
              <div className="size-10 grid place-items-center rounded-xl bg-accent-soft text-accent font-semibold text-base">
                02
              </div>
              <h3 className="mt-5 font-serif text-xl font-medium text-text-primary">Realistic Planner</h3>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                Allocate study time dynamically around your existing classes. Zury balances workload so Friday nights stay free.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border border-border bg-surface p-6 transition hover:border-accent/40 hover:shadow-lg">
              <div className="size-10 grid place-items-center rounded-xl bg-accent-soft text-accent font-semibold text-base">
                03
              </div>
              <h3 className="mt-5 font-serif text-xl font-medium text-text-primary">Offline with Dignity</h3>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                Network drops shouldn't stop your study. All schedules and notes are cached locally, syncing automatically when reconnected.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="rounded-2xl border border-border bg-surface p-6 transition hover:border-accent/40 hover:shadow-lg">
              <div className="size-10 grid place-items-center rounded-xl bg-accent-soft text-accent font-semibold text-base">
                04
              </div>
              <h3 className="mt-5 font-serif text-xl font-medium text-text-primary">Quiet Intelligence</h3>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                An AI companion that operates quietly in plain language—suggesting room for study sessions without chatbot noise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech & Architecture Showcase */}
      <section id="architecture" className="border-t border-border py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">Minimalist Engineering</p>
              <h2 className="mt-3 font-serif text-3xl font-medium text-text-primary sm:text-4xl">
                Advanced technology, quiet presentation.
              </h2>
              <p className="mt-4 text-sm text-text-secondary leading-relaxed">
                Zury is engineered for extreme performance and low bandwidth usage. Internal synchronization architecture, edge caching, and model routing remain completely invisible so you can focus strictly on academic success.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="size-6 shrink-0 grid place-items-center rounded-lg bg-accent-soft text-accent text-xs">✓</div>
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Local First Storage</h4>
                    <p className="text-xs text-text-secondary mt-0.5">Instant load times with IndexedDB client caching.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="size-6 shrink-0 grid place-items-center rounded-lg bg-accent-soft text-accent text-xs">✓</div>
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Bandwidth Conscious</h4>
                    <p className="text-xs text-text-secondary mt-0.5">Optimized payloads designed for 3G/4G connectivity across Africa.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="size-6 shrink-0 grid place-items-center rounded-lg bg-accent-soft text-accent text-xs">✓</div>
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Contextual AI Reasoning</h4>
                    <p className="text-xs text-text-secondary mt-0.5">Translates course outlines and lecture schedules into prioritized tasks.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-canvas-raised p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="text-xs font-mono text-text-secondary">System Status</span>
                <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-accent">Optimal</span>
              </div>
              <div className="mt-6 space-y-4 font-mono text-xs">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-text-tertiary">Sync Engine</span>
                  <span className="text-text-primary">Up to date</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-text-tertiary">Cache Mode</span>
                  <span className="text-text-primary">Offline Resilient</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-text-tertiary">Latency</span>
                  <span className="text-accent">&lt; 14ms (Local)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">User Security</span>
                  <span className="text-text-primary">Encrypted Session</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Footer */}
      <footer className="border-t border-border bg-canvas-raised py-16">
        <div className="mx-auto max-w-5xl px-6 text-center lg:px-8">
          <h2 className="font-serif text-3xl font-medium text-text-primary sm:text-4xl">
            Ready to simplify your academic life?
          </h2>
          <p className="mt-3 text-sm text-text-secondary">
            Join thousands of students managing their studies with calm clarity.
          </p>

          <div className="mt-8">
            <Link
              href={hasSession ? "/dashboard" : "/sign-in"}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-accent px-8 text-sm font-semibold text-accent-foreground shadow-[0_0_32px_rgba(33,209,139,0.3)] transition hover:opacity-90 active:scale-[0.98]"
            >
              Get Started with Zury
            </Link>
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row text-xs text-text-tertiary">
            <div className="flex items-center gap-2">
              <span className="grid size-5 place-items-center rounded bg-accent text-[10px] font-bold text-accent-foreground">Z</span>
              <span>Zury Operating System © 2026</span>
            </div>
            <p>Designed with care for African university students.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
