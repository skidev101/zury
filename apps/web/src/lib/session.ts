import "server-only";

import { cookies } from "next/headers";

const apiUrl = process.env.NODE_ENV === "production"
  ? process.env.API_PROXY_URL ?? "https://zury-jm0l.onrender.com"
  : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface SessionData {
  user: SessionUser;
  session: {
    id: string;
    expiresAt: string;
  };
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();

  try {
    const response = await fetch(`${apiUrl}/api/auth/get-session`, {
      headers: {
        cookie: cookieStore.toString(),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const session: unknown = await response.json();
    return isSessionData(session) ? session : null;
  } catch {
    return null;
  }
}

function isSessionData(value: unknown): value is SessionData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (!candidate.user || typeof candidate.user !== "object") {
    return false;
  }

  const user = candidate.user as Record<string, unknown>;
  return (
    typeof user.id === "string" &&
    typeof user.name === "string" &&
    typeof user.email === "string"
  );
}
