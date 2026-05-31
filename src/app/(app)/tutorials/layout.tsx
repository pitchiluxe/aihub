import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Tutorials",
  description:
    "Learn AI development from beginner to expert. Step-by-step tutorials on prompt engineering, RAG, agents, LangGraph, CrewAI, MCP, Ollama, fine-tuning, and AI app development.",
  keywords: [
    "AI tutorials", "prompt engineering", "RAG tutorial", "AI agents tutorial",
    "LangGraph", "CrewAI", "Ollama", "OpenRouter", "LLM fine tuning",
    "AI development", "learn AI",
  ],
  openGraph: {
    title: "AI Tutorials | AIHub",
    description: "Learn prompt engineering, agents, RAG, LangGraph, and AI development from beginner to expert.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
