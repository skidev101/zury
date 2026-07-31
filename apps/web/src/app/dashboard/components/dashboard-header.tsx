import { Icon } from "./icon";

export function DashboardHeader({ firstName }: { firstName: string }) {
  return <header className="dashboard-header"><div><p className="text-[13px] text-text-tertiary">Friday, July 31</p><h1 className="dashboard-title">Good afternoon, {firstName}.</h1></div><div className="flex items-center gap-2"><button className="dashboard-icon-button hidden sm:grid" aria-label="Search"><Icon name="search" /></button><button className="dashboard-button hidden sm:inline-flex"><Icon name="plus" size={16} /> New chat</button><button className="dashboard-icon-button" aria-label="Notifications"><Icon name="bell" /></button></div></header>;
}
