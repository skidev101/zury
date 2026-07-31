"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { clearUserSnapshots } from "./today-storage";
import { clearConversationData } from "./conversation/conversation-storage";

export function LogoutButton({ compact = false, userId }: { compact?: boolean; userId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function signOut() {
    setIsPending(true);
    await Promise.all([clearUserSnapshots(userId), clearConversationData(userId)]).catch(() => undefined);
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <button className={`${compact ? "grid size-10 place-items-center" : "flex min-h-10 w-full items-center px-3"} cursor-pointer rounded-xl text-[13px] text-text-tertiary transition hover:bg-surface-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-55`} type="button" onClick={signOut} disabled={isPending} aria-label={compact ? "Sign out" : undefined}>
      {compact ? <span aria-hidden="true">↪</span> : isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
