import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI Generator",
  description: "Generate custom AI skills, agents, and workflows with the AIHub Generator. Create production-ready AI components powered by the latest language models.",
  path: "/generator",
  keywords: ["AI generator","AI skill generator","AI agent builder","AI workflow generator","create AI agents"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}