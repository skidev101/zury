import type { SVGProps } from "react";

type IconName = "home" | "calendar" | "study" | "chat" | "connections" | "settings" | "search" | "plus" | "bell" | "arrow" | "note" | "spark" | "branch" | "more" | "chevron";

export function Icon({ name, size = 17, ...props }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  const common = { width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, ...props };
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 10 6-5 6 5" /><path d="M5 9v7h8V9M8 16v-4h2v4" /></>,
    calendar: <><rect x="3" y="4" width="12" height="11" rx="2" /><path d="M6 2v4M12 2v4M3 8h12" /></>,
    study: <><path d="m3 6 6-3 6 3-6 3-6-3Z" /><path d="M5 8v4c2 2 6 2 8 0V8M15 7v5" /></>,
    chat: <><path d="M3 4.5A2.5 2.5 0 0 1 5.5 2h7A2.5 2.5 0 0 1 15 4.5v4a2.5 2.5 0 0 1-2.5 2.5H8l-3.5 3v-3.2A2.5 2.5 0 0 1 3 8.5v-4Z" /><path d="M6 6h6M6 8.5h3" /></>,
    connections: <><circle cx="6" cy="8" r="2.5" /><circle cx="12" cy="8" r="2.5" /><path d="M8.5 8h3M6 10.5v2M12 10.5v2" /></>,
    settings: <><circle cx="9" cy="9" r="2.5" /><path d="m9 2 .7 1.7 1.7.7 1.7-.7 1.3 1.3-.7 1.7.7 1.7-.7 1.7.7 1.7-1.3 1.3-1.7-.7-1.7.7L9 16l-1.7-.7-1.7.7-1.3-1.3.7-1.7-.7-1.7.7-1.7-.7-1.7 1.3-1.3 1.7.7 1.7-.7L9 2Z" /></>,
    search: <><circle cx="7" cy="7" r="4" /><path d="m10 10 4 4" /></>,
    plus: <><path d="M9 3v12M3 9h12" /></>,
    bell: <><path d="M4 12.5h10l-1.2-1.7V7a3.8 3.8 0 0 0-7.6 0v3.8L4 12.5ZM7.5 14.5a1.7 1.7 0 0 0 3 0" /></>,
    arrow: <><path d="M3 9h11M10 5l4 4-4 4" /></>,
    note: <><path d="M4 3h8l2 2v10H4zM7 8h4M7 11h4" /></>,
    spark: <><path d="m9 2 .8 4.2L13 9l-3.2.8L9 14l-.8-4.2L5 9l3.2-.8L9 2ZM14 11l.4 2.1L16 14l-1.6.4L14 17l-.4-2.6L12 14l1.6-.9L14 11Z" /></>,
    branch: <><circle cx="5" cy="4" r="1.5" /><circle cx="5" cy="14" r="1.5" /><circle cx="13" cy="9" r="1.5" /><path d="M6.5 4h2a3 3 0 0 1 3 3v.5M6.5 14h2a3 3 0 0 0 3-3v-.5" /></>,
    more: <><circle cx="4" cy="9" r=".7" fill="currentColor" stroke="none" /><circle cx="9" cy="9" r=".7" fill="currentColor" stroke="none" /><circle cx="14" cy="9" r=".7" fill="currentColor" stroke="none" /></>,
    chevron: <path d="m6 7 3 3 3-3" />,
  };
  return <svg viewBox="0 0 18 18" aria-hidden="true" {...common}>{paths[name]}</svg>;
}
