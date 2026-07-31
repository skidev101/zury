import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSession } from "@/lib/session";
import { AuthForm } from "./auth-form";

export const metadata: Metadata = {
  title: "Welcome",
};

export default async function SignInPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="relative grid min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_16%_16%,color-mix(in_srgb,var(--accent)_10%,transparent),transparent_28%),linear-gradient(135deg,var(--background),var(--canvas-raised),var(--background))] lg:grid-cols-[minmax(0,1.38fr)_minmax(420px,0.92fr)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,var(--accent-soft),transparent_22%)] opacity-70" />

      <section className="relative z-10 hidden min-h-dvh flex-col justify-between border-r border-border p-[clamp(30px,4vw,62px)] lg:flex" aria-labelledby="auth-heading">
        <div className="flex items-center justify-between gap-5">
          <Brand />
          <span className="text-[11px] tracking-[0.02em] text-text-tertiary">Made for the rhythm of student life</span>
        </div>

        <div className="my-auto max-w-2xl py-20">
          <span className="text-xs font-semibold uppercase tracking-[0.13em] text-accent">Your academic day, composed</span>
          <h1 id="auth-heading" className="mt-6 max-w-2xl font-serif text-[clamp(3.5rem,6.4vw,5.75rem)] font-medium leading-[0.94] tracking-[-0.055em]">
            Make space for <em className="font-normal text-accent">what matters.</em>
          </h1>
          <p className="mt-7 max-w-lg text-[clamp(1rem,1.5vw,1.2rem)] leading-8 text-text-secondary">
            Your day, your studies and your next move, together in one calm place.
          </p>
        </div>

        <div className="w-full max-w-xl rounded-3xl border border-border bg-surface/65 px-6 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.1)] backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <span className="font-semibold"><small className="mb-1 block text-[10px] font-medium uppercase tracking-[0.1em] text-text-tertiary">Today</small>Thursday, 30 July</span>
            <span className="text-xs text-text-tertiary"><i className="mr-1.5 inline-block size-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent-glow)]" />Saved for offline use</span>
          </div>
          <PreviewEvent time="10:00" title="Data structures" detail="Lecture hall B" />
          <PreviewEvent time="14:30" title="Graph traversal review" detail="Study session" accented />
          <p className="mt-3 border-t border-border pt-4 font-serif text-[15px] italic text-text-tertiary">Your afternoon has room for focused work.</p>
        </div>
      </section>

      <section className="relative z-10 grid min-h-dvh place-items-center bg-background/40 px-[clamp(22px,6vw,92px)] py-10" aria-label="Sign in to Zury">
        <div className="absolute right-[clamp(22px,5vw,72px)] top-7"><ThemeToggle /></div>
        <AuthForm />
      </section>
    </main>
  );
}

function Brand() {
  return (
    <a className="inline-flex w-fit items-center gap-2.5 text-lg font-semibold tracking-[-0.03em]" href="/" aria-label="Zury home">
      <span className="grid size-8 place-items-center rounded-[10px] border border-border-strong bg-gradient-to-br from-surface-hover to-surface text-sm text-accent shadow-sm" aria-hidden="true">Z</span>
      <span>Zury</span>
    </a>
  );
}

function PreviewEvent({ time, title, detail, accented = false }: { time: string; title: string; detail: string; accented?: boolean }) {
  return (
    <div className="grid min-h-12 grid-cols-[48px_2px_1fr] items-stretch gap-3.5 py-2">
      <span className="text-xs text-text-tertiary">{time}</span>
      <span className={accented ? "rounded-full bg-accent shadow-[0_0_18px_var(--accent-glow)]" : "rounded-full bg-border-strong"} />
      <span><strong className="block text-[13px] font-semibold">{title}</strong><small className="mt-0.5 block text-xs text-text-tertiary">{detail}</small></span>
    </div>
  );
}
