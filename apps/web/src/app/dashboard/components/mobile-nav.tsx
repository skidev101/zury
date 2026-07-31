import { Icon } from "./icon";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Home", icon: "home" as const, href: "/dashboard" },
  { label: "Planner", icon: "calendar" as const, href: "/dashboard/planner" },
  { label: "Ask", icon: "chat" as const, href: "/dashboard/conversation" },
  { label: "Connections", icon: "connections" as const, href: "/dashboard/connections" },
];

export function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 flex min-h-16 items-center justify-around rounded-2xl border border-border bg-[#111113]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
      {items.map((item) => {
        const isActive = item.href === pathname || (item.href === "/dashboard" && pathname === "/dashboard");
        const classes = `flex min-w-14 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium ${isActive ? "text-accent" : "text-text-tertiary"}`;
        const content = <><Icon name={item.icon} size={18} /><span>{item.label}</span></>;
        return item.href ? <Link href={item.href} aria-current={isActive ? "page" : undefined} className={classes} key={item.label}>{content}</Link> : <span aria-disabled="true" className={classes} key={item.label}>{content}</span>;
      })}
    </nav>
  );
}
