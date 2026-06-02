import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "AI Playground",
  description: "Test and prototype with any AI model in the AIHub Playground. Adjust temperature, system prompts, and parameters. Compare outputs interactively.",
  path: "/playground",
  keywords: ["AI playground","LLM playground","test AI models","AI prompt testing","AI model sandbox"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}