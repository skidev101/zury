import type { Metadata } from "next";
import { StudyScreen } from "./study-screen";

export const metadata: Metadata = { title: "Study" };

export default function StudyPage() {
  return <StudyScreen />;
}
