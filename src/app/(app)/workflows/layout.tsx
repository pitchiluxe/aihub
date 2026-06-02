import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI Workflows",
  description: "Explore AI automation workflows, agent pipelines, RAG systems, and business automations. Templates, diagrams, and tutorials for AI orchestration.",
  path: "/workflows",
  keywords: ["AI workflows","AI automation","AI agent pipelines","RAG workflows","AI business automation"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}