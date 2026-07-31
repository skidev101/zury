import type { TimelineEvent } from "../types";
import { Icon } from "./icon";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return <div className="space-y-1">{events.map((event) => <div className="timeline-row" key={event.id}><span className="w-16 shrink-0 font-mono text-xs tabular-nums text-text-tertiary">{event.time}</span><span className={`timeline-dot timeline-dot-${event.type.toLowerCase()}`} /><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium text-text-primary">{event.title}</p><p className="mt-0.5 text-xs text-text-tertiary">{event.type}</p></div><Icon name="more" size={16} className="text-text-tertiary" /></div>)}</div>;
}
