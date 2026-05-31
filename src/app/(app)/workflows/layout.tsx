import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Workflows",
  description:
    "Explore AI automation workflows, agent pipelines, RAG systems, and business automations. Templates, diagrams, and tutorials for n8n-style AI orchestration.",
  keywords: [
    "AI workflows", "AI automation", "agent pipelines", "RAG workflow",
    "n8n AI", "AI orchestration", "LangGraph workflows", "CrewAI workflows",
  ],
  openGraph: {
    title: "AI Workflows | AIHub",
    description: "AI workflow templates, agent pipelines, and automation blueprints.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
