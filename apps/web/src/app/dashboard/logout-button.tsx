"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function signOut() {
    setIsPending(true);
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <button className="flex w-full min-h-10 cursor-pointer items-center rounded-xl px-3 text-[13px] text-text-tertiary transition hover:bg-surface-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-55" type="button" onClick={signOut} disabled={isPending}>
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
