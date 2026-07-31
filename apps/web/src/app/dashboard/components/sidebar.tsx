import { LogoutButton } from "../logout-button";
import { navigation } from "../navigation";
import { Icon } from "./icon";
import Link from "next/link";
import { usePathname } from "next/navigation";

const routes: Partial<Record<string, string>> = {
  Home: "/dashboard",
  Planner: "/dashboard/planner",
  Conversation: "/dashboard/conversation",
  Connections: "/dashboard/connections",
};

export function Sidebar({
  user,
}: {
  user: { id: string; name: string; email: string; image?: string | null };
}) {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col border-r border-white/[0.08] bg-[#080A09]/95 px-3 py-5 backdrop-blur-2xl lg:flex xl:w-[260px] xl:px-4">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-1">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#21D18B] to-[#087A50] text-sm font-bold text-[#06120D] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_20px_rgba(33,209,139,0.2)]">
          Z
        </span>
        <div className="hidden min-w-0 xl:block">
          <span className="block font-heading text-base font-semibold tracking-[-0.03em] text-text-primary">Zury</span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-text-tertiary">Academic OS</span>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="mt-8 space-y-1.5" aria-label="Primary navigation">
        {navigation.map((item) => {
          const href = routes[item.label];
          const isActive = href === pathname || (href === "/dashboard" && pathname === "/dashboard");
          const classes = `relative flex min-h-11 items-center gap-3.5 rounded-xl px-3.5 text-xs font-medium transition-all duration-200 ${
            isActive
              ? "border border-emerald/30 bg-emerald-soft text-emerald font-semibold"
              : "border border-transparent text-text-secondary hover:border-white/[0.06] hover:bg-surface-hover hover:text-text-primary"
          }`;
          const content = (
            <>
              <Icon name={item.icon} size={18} />
              <span className="hidden xl:block">{item.label}</span>
            </>
          );
          return href ? (
            <Link key={item.label} href={href} aria-current={isActive ? "page" : undefined} className={classes}>
              {content}
            </Link>
          ) : (
            <span key={item.label} aria-disabled="true" className={`${classes} cursor-default`}>
              {content}
            </span>
          );
        })}
      </nav>

      {/* User & Footer Area */}
      <div className="mt-auto space-y-3 pt-4 border-t border-white/[0.08]">
        <div className="flex items-center gap-3 px-2 py-1">
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface text-xs font-semibold text-text-secondary ring-1 ring-white/10 shadow-inner">
            {user.image ? <img src={user.image} alt="" className="size-full object-cover" /> : user.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden min-w-0 xl:block">
            <span className="block truncate text-xs font-semibold text-text-primary">{user.name}</span>
            <span className="block max-w-[130px] truncate text-[11px] text-text-tertiary">{user.email}</span>
          </span>
        </div>
        <div className="hidden xl:block">
          <LogoutButton userId={user.id} />
        </div>
        <div className="mx-auto xl:hidden">
          <LogoutButton compact userId={user.id} />
        </div>
      </div>
    </aside>
  );
}
