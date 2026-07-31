"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  ...(process.env.NODE_ENV === "production"
    ? {}
    : { baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001" }),
  fetchOptions: {
    credentials: "include",
  },
});
