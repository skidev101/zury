"use client";

import { useEffect, useState } from "react";
import { listPendingMessages } from "./conversation/conversation-storage";

export function ConnectivityStatus({ userId }: { userId: string }) {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    const refresh = () => void listPendingMessages(userId).then((items) => setPending(items.length)).catch(() => undefined);
    update(); refresh();
    window.addEventListener("online", update); window.addEventListener("offline", update); window.addEventListener("online", refresh);
    const interval = window.setInterval(refresh, 1500);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); window.removeEventListener("online", refresh); window.clearInterval(interval); };
  }, [userId]);

  return <div className="fixed right-3 top-3 z-50 sm:right-5 sm:top-5" role="status" aria-live="polite"><div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] backdrop-blur-xl ${online ? "border-emerald/20 bg-[#0d100f]/85 text-text-secondary" : "border-amber-400/25 bg-[#17140e]/90 text-amber-200"}`}><span className={`size-1.5 rounded-full ${online ? "bg-emerald" : "bg-amber-300"}`} /><span>{online ? "Online" : "Offline"}</span>{pending > 0 && <span className="border-l border-current/20 pl-2">{pending} waiting to send</span>}</div></div>;
}
