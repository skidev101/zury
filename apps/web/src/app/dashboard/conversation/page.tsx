import type { Metadata } from "next";
import { ConversationScreen } from "./conversation-screen";

export const metadata: Metadata = { title: "Conversation" };

export default function ConversationPage() { return <ConversationScreen />; }
