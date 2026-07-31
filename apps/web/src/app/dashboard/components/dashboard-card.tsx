import type { ReactNode } from "react";

export function DashboardCard({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={`rounded-2xl border border-border bg-surface/90 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,.018)] transition duration-200 hover:border-border-strong ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
            {eyebrow}
          </p>
        )}
        <h2 className="font-heading text-[17px] font-semibold tracking-[-0.025em] text-text-primary">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
