import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI Agents",
  description: "Chat with specialized AI expert agents — a News Analyst, Model Expert, Prompt Engineer, Workflow Architect, Research Assistant, and more.",
  path: "/agents",
  keywords: ["AI agents","AI expert chat","prompt engineer AI","AI workflow agent","LLM agents"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}