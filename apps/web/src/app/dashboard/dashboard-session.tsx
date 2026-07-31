"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface DashboardUser { id: string; name: string; email: string; image: string | null }
const DashboardSessionContext = createContext<DashboardUser | null>(null);

export function DashboardSessionProvider({ children, user }: { children: ReactNode; user: DashboardUser }) {
  return <DashboardSessionContext value={user}>{children}</DashboardSessionContext>;
}

export function useDashboardUser() {
  const user = useContext(DashboardSessionContext);
  if (!user) throw new Error("useDashboardUser must be used inside the dashboard layout");
  return user;
}
