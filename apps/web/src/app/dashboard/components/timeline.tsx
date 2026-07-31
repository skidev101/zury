import type { TimelineEvent } from "../types";
import { Icon } from "./dashboard-icon";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="space-y-1">
      {events.map((event) => (
        <div
          className="flex min-h-12 items-center gap-3 rounded-xl px-2 transition duration-200 hover:bg-surface-hover"
          key={event.id}
        >
          <span className="w-16 shrink-0 font-mono text-xs tabular-nums text-text-tertiary">
            {event.time}
          </span>
          <span
            className={`size-1.5 shrink-0 rounded-full ${event.type === "Class" ? "bg-accent" : event.type === "Exam" ? "bg-red-400" : event.type === "Meeting" ? "bg-blue-400" : "bg-amber-400"}`}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-text-primary">
              {event.title}
            </p>
            <p className="mt-0.5 text-xs text-text-tertiary">{event.type}</p>
          </div>
          <Icon name="more" size={16} className="text-text-tertiary" />
        </div>
      ))}
    </div>
  );
}
