import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Agents",
  description:
    "Chat with specialized AI experts — a News Analyst, Model Expert, Prompt Engineer, Workflow Architect, Research Assistant, and more. AI-only agents for AI professionals.",
  keywords: [
    "AI agents", "AI assistant", "prompt engineer", "AI workflow", "AI expert chat",
    "AI research assistant", "AI coding mentor",
  ],
  openGraph: {
    title: "AI Agents | AIHub",
    description: "Chat with specialized AI experts — News Analyst, Model Expert, Prompt Engineer, and more.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
