import type { Metadata } from "next";
import { Dashboard } from "./components/dashboard";

export const metadata: Metadata = { title: "Home" };

export default function DashboardPage() { return <Dashboard />; }
