import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#09090B] px-6 text-[#FAFAFA]">
      <section className="w-full max-w-md rounded-2xl border border-white/[.08] bg-[#111113] p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.03)]">
        <span className="mx-auto grid size-11 place-items-center rounded-xl bg-[#10B981] font-heading font-bold text-[#03150E]">Z</span>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[.14em] text-[#71717A]">You&apos;re offline</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-[-.04em]">Zury is ready when you are.</h1>
        <p className="mt-3 text-sm leading-6 text-[#A1A1AA]">Reconnect to refresh your day. Your latest saved information will remain available from the app.</p>
        <Link className="mt-7 inline-flex min-h-10 items-center rounded-xl bg-[#FAFAFA] px-4 text-sm font-semibold text-[#09090B]" href="/dashboard">Try again</Link>
      </section>
    </main>
  );
}
