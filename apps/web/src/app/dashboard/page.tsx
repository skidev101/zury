import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Dashboard } from "./components/dashboard";

export const metadata: Metadata = { title: "Home" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  return (
    <Dashboard
      firstName={session.user.name.trim().split(/\s+/)[0] || "there"}
      user={{ name: session.user.name, email: session.user.email, image: session.user.image }}
    />
  );
}
