import type { ReactNode } from "react";

export function DashboardCard({ children, className = "", ...props }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLElement>) {
  return <section className={`dashboard-card ${className}`} {...props}>{children}</section>;
}

export function SectionHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <div className="mb-4 flex items-end justify-between gap-4"><div>{eyebrow && <p className="dashboard-eyebrow">{eyebrow}</p>}<h2 className="dashboard-section-title">{title}</h2></div>{action}</div>;
}
