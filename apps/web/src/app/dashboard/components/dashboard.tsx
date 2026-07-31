import { CalendarPanel } from "./calendar-panel";
import { DashboardHeader } from "./dashboard-header";
import { ChatEntry, GithubCard, InsightsCard, MockUpcoming, QuickActions, StudyCard, TodayFocus } from "./dashboard-sections";
import { MobileNavigation } from "./mobile-nav";
import { Sidebar } from "./sidebar";

export function Dashboard({ firstName, user }: { firstName: string; user: { name: string; email: string; image?: string | null } }) {
  return <div className="dashboard-theme min-h-dvh bg-background text-text-primary"><Sidebar user={user} /><div className="dashboard-main"><DashboardHeader firstName={firstName} /><main className="dashboard-content"><div className="dashboard-grid"><div className="space-y-6 lg:col-span-8"><TodayFocus /><div className="grid gap-6 md:grid-cols-2"><CalendarPanel /><InsightsCard /></div><ChatEntry /></div><div className="space-y-6 lg:col-span-4"><MockUpcoming /><StudyCard /><GithubCard /><QuickActions /></div></div></main></div><MobileNavigation /></div>;
}
