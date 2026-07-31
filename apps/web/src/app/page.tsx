import { getSession } from "@/lib/session";
import { LandingPageClient } from "./landing-page-client";

export default async function HomePage() {
  const session = await getSession();
  return <LandingPageClient hasSession={!!session} />;
}

