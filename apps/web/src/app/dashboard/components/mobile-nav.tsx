import { navigation } from "../mock-data";
import { Icon } from "./icon";

export function MobileNavigation() {
  return <nav className="mobile-nav" aria-label="Mobile navigation">{navigation.slice(0, 4).map((item) => item.active ? <a href="/dashboard" aria-current="page" className="text-accent" key={item.label}><Icon name={item.icon} size={18} /><span>{item.label}</span></a> : <span aria-disabled="true" className="flex min-w-14 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium text-text-tertiary" key={item.label}><Icon name={item.icon} size={18} /><span>{item.label === "Conversation" ? "Ask" : item.label}</span></span>)}</nav>;
}
