"use client";

import { createAuthClient } from "better-auth/react";

const apiUrl = process.env.NODE_ENV === "production"
  ? window.location.origin
  : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL: apiUrl,
  fetchOptions: {
    credentials: "include",
  },
});
