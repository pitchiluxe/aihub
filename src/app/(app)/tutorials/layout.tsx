import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI Tutorials",
  description: "Learn AI development from beginner to expert. Step-by-step tutorials on prompt engineering, RAG, AI agents, LangGraph, CrewAI, MCP, Ollama, and fine-tuning.",
  path: "/tutorials",
  keywords: ["AI tutorials","prompt engineering tutorial","RAG tutorial","AI agents tutorial","Ollama tutorial"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}