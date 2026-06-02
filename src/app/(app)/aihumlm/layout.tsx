import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AIHub LM",
  description: "Chat with the AIHub AI assistant — your conversational guide to the AI ecosystem. Ask about models, news, research, tutorials, and anything AI-related.",
  path: "/aihumlm",
  keywords: ["AI assistant","AIHub chat","AI Q and A","AI knowledge assistant","AI ecosystem assistant"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}