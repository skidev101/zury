import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "@/lib/session";
import { DashboardSessionProvider } from "./dashboard-session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const user = { id: session.user.id, name: session.user.name, email: session.user.email, image: session.user.image ?? null };
  return <DashboardSessionProvider user={user}>{children}</DashboardSessionProvider>;
}
